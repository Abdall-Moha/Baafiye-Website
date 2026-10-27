// Tool that reads uploaded files (multipart/form-data)
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

// ------------------------------------------------------
// Where the pictures are saved: <project>/uploads
// (works no matter where you start the server from)
// ------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadsDir = path.join(__dirname, "..", "uploads");

// Create the folder if it does not exist
fs.mkdirSync(uploadsDir, { recursive: true });


// ------------------------------------------------------
// Settings
// ------------------------------------------------------

// Allowed image types and the file ending we give them.
// The ending comes from the type, NOT from the user's file name.
const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Maximum image size: 5MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;


// Deletes a file and ignores the error if it is already gone
const removeFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // nothing to do
  }
};


// Deletes an image that is saved in the database as "/uploads/xxxx.jpg"
export const deleteUploadedImage = async (imagePath) => {
  if (
    typeof imagePath !== "string" ||
    !imagePath.startsWith("/uploads/")
  ) {
    return;
  }

  // basename blocks tricks like "/uploads/../../secret"
  await removeFile(
    path.join(uploadsDir, path.basename(imagePath))
  );
};


// ------------------------------------------------------
// Multer settings
// ------------------------------------------------------

const storage = multer.diskStorage({

  // Save into the uploads folder
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  // Random name, so nobody can guess other pictures
  filename: (req, file, cb) => {
    cb(
      null,
      `${crypto.randomUUID()}${allowedTypes[file.mimetype]}`
    );
  },
});

const upload = multer({

  storage,

  // Only accept JPG, PNG and WEBP
  fileFilter: (req, file, cb) => {
    if (!allowedTypes[file.mimetype]) {
      const error = new Error("Invalid image type");
      error.code = "INVALID_IMAGE_TYPE";
      return cb(error);
    }

    cb(null, true);
  },

  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
    fields: 10,
    fieldSize: 10 * 1024,
  },

}).single("image");


// ------------------------------------------------------
// Check the REAL content of the file (first bytes),
// because the type sent by the browser can be faked
// ------------------------------------------------------

const hasValidSignature = async (file) => {
  const handle = await fs.promises.open(file.path, "r");

  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);

    if (file.mimetype === "image/jpeg") {
      return (
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    }

    if (file.mimetype === "image/png") {
      return buffer
        .subarray(0, 8)
        .equals(
          Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
          ])
        );
    }

    if (file.mimetype === "image/webp") {
      return (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    }

    return false;

  } finally {
    await handle.close();
  }
};


// ------------------------------------------------------
// The middleware used in routes
//
// - Reads ONE file from the field called "image"
// - The image is optional here. The route decides if it is
//   required (req.file is undefined when no image was sent)
// - If the response ends with an error (400, 403, 404, 500...),
//   the uploaded file is deleted automatically
// ------------------------------------------------------

export const uploadItemImage = (req, res, next) => {

  upload(req, res, async (error) => {

    // ---- Upload errors ----
    if (error) {

      let message = "Image upload failed";

      if (error.code === "LIMIT_FILE_SIZE") {
        message = "Image must be 5MB or smaller";
      } else if (error.code === "INVALID_IMAGE_TYPE") {
        message = "Only JPG, PNG and WEBP images are allowed";
      } else if (
        error.code === "LIMIT_UNEXPECTED_FILE" ||
        error.code === "LIMIT_FILE_COUNT"
      ) {
        message = "Send only one image in the field called image";
      }

      return res.status(400).json({
        status: false,
        message,
      });
    }

    // No file sent (the route decides if that is allowed)
    if (!req.file) {
      return next();
    }

    // ---- Check the real file content ----
    try {
      const isValid = await hasValidSignature(req.file);

      if (!isValid) {
        await removeFile(req.file.path);

        return res.status(400).json({
          status: false,
          message: "The file is not a valid image",
        });
      }

    } catch (checkError) {

      console.log("Image check error:", checkError);

      await removeFile(req.file.path);

      return res.status(400).json({
        status: false,
        message: "The file is not a valid image",
      });
    }

    // ---- Remove the file if the request fails later ----
    res.on("finish", () => {
      if (res.statusCode >= 400 && req.file) {
        removeFile(req.file.path);
      }
    });

    next();
  });
};