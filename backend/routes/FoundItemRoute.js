// Express (the web framework)
import express from "express";
// Tool used to check MongoDB ids
import mongoose from "mongoose";

// Database models
import FoundItem from "../model/FoundItem.js";
import Category from "../model/Category.js";
// Login check
import authMiddleware from "../middleware/authMiddleware.js";
// Limiters (stop too many requests)
import { createItemLimiter, contactLimiter } from "../middleware/rateLimiter.js";
// Image upload (multer)
import {
  uploadItemImage,
  deleteUploadedImage,
} from "../middleware/imageUploadMiddleware.js";
// Email that tells the admin about a new post (change the path if needed)
import { sendNewItemNotificationEmail } from "../job/email.js";

const foundItemRouter = express.Router();


// ------------------------------------------------------
// Settings for this file
// ------------------------------------------------------

// The districts we accept (same list as the FoundItem model)
const allowedDistricts = [
  "Abdiaziz",
  "Bondhere",
  "Daynile",
  "Dharkenley",
  "Hamar Jajab",
  "Hamar Weyne",
  "Hodan",
  "Howlwadaag",
  "Kahda",
  "Karaan",
  "Shangani",
  "Shibis",
  "Waberi",
  "Wadajir",
  "Warta Nabada",
  "Yaqshid",
  "Garasbaaley",
  "Daarusalaam",
  "Gubadley",
  "Huriwaa",
];

// Phone format: 7 to 20 characters (numbers, +, spaces, brackets, dash)
const phonePattern = /^[0-9+\s()-]{7,20}$/;

// How many days an item stays public (counted from admin approval)
const ITEM_LIFETIME_DAYS = 90;

// Fields the PUBLIC must never see (phone number and who posted it)
const hiddenFields = "-contactPhone -postedBy";

// Makes user text safe to use inside a search pattern.
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


// ======================================================
// CREATE FOUND ITEM
// POST /api/items
// PROTECTED
//
// Sent as FormData (text fields + a file called "image").
// The item is saved as "pending". It is NOT public until
// the admin approves it. The admin gets an email.
// ======================================================

foundItemRouter.post(
  "/",
  createItemLimiter,
  authMiddleware,
  uploadItemImage,
  async (req, res) => {
    try {

      // Read the data sent by the frontend
      const {
        title,
        category,
        district,
        village,
        foundDate,
        contactPhone,
      } = req.body;


      // ----------------------------------------------
      // Validate required fields (the image file too)
      // ----------------------------------------------

      if (
        !title ||
        !category ||
        !district ||
        !village ||
        !foundDate ||
        !contactPhone ||
        !req.file
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Title, category, district, village, found date, contact phone and image are required",
        });
      }


      // ----------------------------------------------
      // All values must be text (blocks objects and arrays)
      // ----------------------------------------------

      if (
        typeof title !== "string" ||
        typeof category !== "string" ||
        typeof district !== "string" ||
        typeof village !== "string" ||
        typeof foundDate !== "string" ||
        typeof contactPhone !== "string"
      ) {
        return res.status(400).json({
          status: false,
          message: "Invalid input",
        });
      }


      // ----------------------------------------------
      // Clean the text
      // ----------------------------------------------

      const cleanTitle = title.trim();
      const cleanDistrict = district.trim();
      const cleanVillage = village.trim();
      const cleanPhone = contactPhone.trim();


      // ----------------------------------------------
      // Validate title
      // ----------------------------------------------

      if (cleanTitle.length < 3 || cleanTitle.length > 100) {
        return res.status(400).json({
          status: false,
          message: "Title must be between 3 and 100 characters",
        });
      }


      // ----------------------------------------------
      // Validate district
      // ----------------------------------------------

      if (!allowedDistricts.includes(cleanDistrict)) {
        return res.status(400).json({
          status: false,
          message: "Invalid district",
        });
      }


      // ----------------------------------------------
      // Validate village
      // ----------------------------------------------

      if (cleanVillage.length < 2 || cleanVillage.length > 100) {
        return res.status(400).json({
          status: false,
          message: "Village must be between 2 and 100 characters",
        });
      }


      // ----------------------------------------------
      // Validate contact phone
      // ----------------------------------------------

      if (!phonePattern.test(cleanPhone)) {
        return res.status(400).json({
          status: false,
          message: "Invalid contact phone",
        });
      }


      // ----------------------------------------------
      // Validate found date (must be real and not in the future)
      // ----------------------------------------------

      const parsedFoundDate = new Date(foundDate);

      if (isNaN(parsedFoundDate.getTime())) {
        return res.status(400).json({
          status: false,
          message: "Invalid found date",
        });
      }

      if (parsedFoundDate > new Date()) {
        return res.status(400).json({
          status: false,
          message: "Found date cannot be in the future",
        });
      }


      // ----------------------------------------------
      // Validate category ID
      // ----------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          status: false,
          message: "Invalid category",
        });
      }


      // ----------------------------------------------
      // Check category (first database check, so all the
      // cheap checks above run first)
      // ----------------------------------------------

      const categoryExists = await Category.findOne({
        _id: category,
        isActive: true,
      });

      if (!categoryExists) {
        return res.status(400).json({
          status: false,
          message: "Category not found or inactive",
        });
      }


      // ----------------------------------------------
      // Create item (PENDING, waits for admin approval)
      // ----------------------------------------------

      const foundItem = await FoundItem.create({

        title: cleanTitle,

        category: category,

        district: cleanDistrict,

        village: cleanVillage,

        foundDate: parsedFoundDate,

        contactPhone: cleanPhone,

        // The uploaded picture (saved in the uploads folder)
        image: `/uploads/${req.file.filename}`,

        // Not public until the admin approves it
        status: "pending",

        // Get user from JWT.
        // postedBy is NOT accepted from frontend.
        postedBy: req.user.userId,

        // expiresAt is set when the admin approves the item
        expiresAt: null,
      });


      // ----------------------------------------------
      // Tell the admin by email.
      // If the email fails, the post is still saved
      // and the admin can see it in the dashboard.
      // ----------------------------------------------

      await sendNewItemNotificationEmail({
        item: foundItem,
        categoryName: categoryExists.name,
      });


      // Populate category
      await foundItem.populate(
        "category",
        "name slug image"
      );


      return res.status(201).json({
        status: true,
        message:
          "Your item was submitted and is waiting for admin approval",
        item: foundItem,
      });

    } catch (error) {

      console.log(
        "Create found item error:",
        error
      );

      return res.status(500).json({
        status: false,
        message: "Failed to post found item",
      });
    }
  }
);


// ======================================================
// GET ALL ACTIVE FOUND ITEMS
// GET /api/items
// PUBLIC
//
// Only APPROVED (active) items are shown.
// Supports: search, category, district, village, pagination
// The phone number is NOT included (see Contact Finder below)
// ======================================================

foundItemRouter.get(
  "/",
  async (req, res) => {
    try {

      // Read the values from the URL
      const {
        category,
        district,
        village,
        search,
        page = 1,
        limit = 10,
      } = req.query;


      // ----------------------------------------------
      // URL values must be plain text
      // (blocks tricks like ?district[$ne]=x)
      // ----------------------------------------------

      if (
        (category && typeof category !== "string") ||
        (district && typeof district !== "string") ||
        (village && typeof village !== "string") ||
        (search && typeof search !== "string")
      ) {
        return res.status(400).json({
          status: false,
          message: "Invalid search values",
        });
      }


      // ----------------------------------------------
      // Pagination
      // ----------------------------------------------

      const currentPage = Math.max(
        Number(page) || 1,
        1
      );

      const itemsPerPage = Math.min(
        Math.max(Number(limit) || 10, 1),
        50
      );

      const skip =
        (currentPage - 1) * itemsPerPage;


      // ----------------------------------------------
      // Base filter: approved (active) AND not expired
      // ----------------------------------------------

      const filter = {
        status: "active",
        expiresAt: { $gt: new Date() },
      };


      // ----------------------------------------------
      // Category filter
      // ----------------------------------------------

      if (category) {

        if (!mongoose.Types.ObjectId.isValid(category)) {
          return res.status(400).json({
            status: false,
            message: "Invalid category",
          });
        }

        filter.category = category;
      }


      // ----------------------------------------------
      // District filter
      // ----------------------------------------------

      if (district) {

        if (!allowedDistricts.includes(district.trim())) {
          return res.status(400).json({
            status: false,
            message: "Invalid district",
          });
        }

        filter.district = district.trim();
      }


      // ----------------------------------------------
      // Village filter
      // ----------------------------------------------

      if (village) {

        filter.village = {
          $regex: escapeRegex(village.trim()),
          $options: "i",
        };
      }


      // ----------------------------------------------
      // Search title
      // ----------------------------------------------

      if (search) {

        filter.title = {
          $regex: escapeRegex(search.trim()),
          $options: "i",
        };
      }


      // ----------------------------------------------
      // Get items + total count
      // ----------------------------------------------

      const [
        items,
        totalItems,
      ] = await Promise.all([

        FoundItem.find(filter)

          // Hide phone number and poster
          .select(hiddenFields)

          .populate(
            "category",
            "name slug image"
          )

          .sort({
            createdAt: -1,
          })

          .skip(skip)

          .limit(itemsPerPage),

        FoundItem.countDocuments(filter),
      ]);


      // ----------------------------------------------
      // Pagination information
      // ----------------------------------------------

      const totalPages = Math.ceil(
        totalItems / itemsPerPage
      );


      return res.status(200).json({
        status: true,

        items,

        pagination: {
          currentPage,
          itemsPerPage,
          totalItems,
          totalPages,

          hasNextPage:
            currentPage < totalPages,

          hasPreviousPage:
            currentPage > 1,
        },
      });

    } catch (error) {

      console.log(
        "Get found items error:",
        error
      );

      return res.status(500).json({
        status: false,
        message: "Failed to get found items",
      });
    }
  }
);


// ======================================================
// GET MY FOUND ITEMS
// GET /api/items/my-items
// PROTECTED
//
// The owner sees ALL their items, including pending ones
// (and their own phone number).
//
// IMPORTANT: keep this route ABOVE "/:id",
// otherwise Express thinks "my-items" is an id.
// ======================================================

foundItemRouter.get(
  "/my-items",
  authMiddleware,
  async (req, res) => {
    try {

      const items = await FoundItem.find({
        postedBy: req.user.userId,
      })

        .populate(
          "category",
          "name slug image"
        )

        .sort({
          createdAt: -1,
        });


      return res.status(200).json({
        status: true,
        items,
      });

    } catch (error) {

      console.log(
        "Get my items error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to get your found items",
      });
    }
  }
);


// ======================================================
// GET SINGLE ACTIVE FOUND ITEM
// GET /api/items/:id
// PUBLIC
//
// Pending items are NOT visible here.
// The phone number is NOT included (see Contact Finder below)
// ======================================================

foundItemRouter.get(
  "/:id",
  async (req, res) => {
    try {

      // ----------------------------------------------
      // Validate ID
      // ----------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid item ID",
        });
      }


      // ----------------------------------------------
      // Only return approved items that are not expired
      // ----------------------------------------------

      const item = await FoundItem.findOne({

        _id: req.params.id,

        status: "active",

        expiresAt: { $gt: new Date() },

      })

        // Hide phone number and poster
        .select(hiddenFields)

        .populate(
          "category",
          "name slug image"
        );


      if (!item) {
        return res.status(404).json({
          status: false,
          message:
            "Found item not found or no longer available",
        });
      }


      return res.status(200).json({
        status: true,
        item,
      });

    } catch (error) {

      console.log(
        "Get item error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to get found item",
      });
    }
  }
);


// ======================================================
// CONTACT FINDER (reveal the phone number)
// GET /api/items/:id/contact
// PUBLIC (limited by contactLimiter)
//
// Only works for approved items.
// ======================================================

foundItemRouter.get(
  "/:id/contact",
  contactLimiter,
  async (req, res) => {
    try {

      // ----------------------------------------------
      // Validate ID
      // ----------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid item ID",
        });
      }


      // ----------------------------------------------
      // Only approved items that are not expired
      // ----------------------------------------------

      const item = await FoundItem.findOne({

        _id: req.params.id,

        status: "active",

        expiresAt: { $gt: new Date() },

      }).select("contactPhone");


      if (!item) {
        return res.status(404).json({
          status: false,
          message:
            "Found item not found or no longer available",
        });
      }


      // ----------------------------------------------
      // Send only the phone number
      // ----------------------------------------------

      return res.status(200).json({
        status: true,
        contactPhone: item.contactPhone,
      });

    } catch (error) {

      console.log(
        "Contact finder error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to get contact information",
      });
    }
  }
);


// ======================================================
// UPDATE FOUND ITEM
// PUT /api/items/:id
// PROTECTED
// OWNER OR ADMIN
//
// Can be sent as FormData (with a new "image" file) or as JSON
// (without a new image). The image is optional here.
//
// If the OWNER edits an approved (active) item, it goes
// back to "pending" and the admin must approve it again.
// An admin edit does not change the status.
// ======================================================

foundItemRouter.put(
  "/:id",
  authMiddleware,
  uploadItemImage,
  async (req, res) => {
    try {

      // Read the data sent by the frontend
      const {
        title,
        category,
        district,
        village,
        foundDate,
        contactPhone,
      } = req.body;


      // ----------------------------------------------
      // Validate ID
      // ----------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid item ID",
        });
      }


      // ----------------------------------------------
      // At least one field (or a new image) must be sent
      // ----------------------------------------------

      if (
        title === undefined &&
        category === undefined &&
        district === undefined &&
        village === undefined &&
        foundDate === undefined &&
        contactPhone === undefined &&
        !req.file
      ) {
        return res.status(400).json({
          status: false,
          message: "Nothing to update",
        });
      }


      // ----------------------------------------------
      // Find item
      // ----------------------------------------------

      const item = await FoundItem.findById(
        req.params.id
      );


      if (!item) {
        return res.status(404).json({
          status: false,
          message: "Found item not found",
        });
      }


      // ----------------------------------------------
      // Check owner (an admin can edit any item)
      // ----------------------------------------------

      const isAdmin = req.user.role === "admin";

      if (
        item.postedBy.toString() !==
        req.user.userId.toString() &&
        !isAdmin
      ) {
        return res.status(403).json({
          status: false,
          message:
            "You can only edit your own posts",
        });
      }


      // ----------------------------------------------
      // Only pending or active items can be edited
      // ----------------------------------------------

      if (item.status !== "active" && item.status !== "pending") {
        return res.status(400).json({
          status: false,
          message:
            "This item can no longer be edited",
        });
      }


      // We need the category name for the admin email
      let categoryName = null;


      // ----------------------------------------------
      // Update title
      // ----------------------------------------------

      if (title !== undefined) {

        if (typeof title !== "string") {
          return res.status(400).json({
            status: false,
            message: "Title must be text",
          });
        }

        const cleanTitle = title.trim();

        if (cleanTitle.length < 3 || cleanTitle.length > 100) {
          return res.status(400).json({
            status: false,
            message:
              "Title must be between 3 and 100 characters",
          });
        }

        item.title = cleanTitle;
      }


      // ----------------------------------------------
      // Update category
      // ----------------------------------------------

      if (category !== undefined) {

        if (
          typeof category !== "string" ||
          !mongoose.Types.ObjectId.isValid(category)
        ) {
          return res.status(400).json({
            status: false,
            message: "Invalid category",
          });
        }

        const categoryExists = await Category.findOne({
          _id: category,
          isActive: true,
        });

        if (!categoryExists) {
          return res.status(400).json({
            status: false,
            message:
              "Category not found or inactive",
          });
        }

        item.category = category;
        categoryName = categoryExists.name;
      }


      // ----------------------------------------------
      // Update district
      // ----------------------------------------------

      if (district !== undefined) {

        if (typeof district !== "string") {
          return res.status(400).json({
            status: false,
            message: "Invalid district",
          });
        }

        const cleanDistrict = district.trim();

        if (!allowedDistricts.includes(cleanDistrict)) {
          return res.status(400).json({
            status: false,
            message: "Invalid district",
          });
        }

        item.district = cleanDistrict;
      }


      // ----------------------------------------------
      // Update village
      // ----------------------------------------------

      if (village !== undefined) {

        if (typeof village !== "string") {
          return res.status(400).json({
            status: false,
            message: "Village must be text",
          });
        }

        const cleanVillage = village.trim();

        if (cleanVillage.length < 2 || cleanVillage.length > 100) {
          return res.status(400).json({
            status: false,
            message:
              "Village must be between 2 and 100 characters",
          });
        }

        item.village = cleanVillage;
      }


      // ----------------------------------------------
      // Update found date
      // ----------------------------------------------

      if (foundDate !== undefined) {

        if (typeof foundDate !== "string") {
          return res.status(400).json({
            status: false,
            message: "Invalid found date",
          });
        }

        const parsedDate = new Date(foundDate);

        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            status: false,
            message: "Invalid found date",
          });
        }

        if (parsedDate > new Date()) {
          return res.status(400).json({
            status: false,
            message:
              "Found date cannot be in the future",
          });
        }

        item.foundDate = parsedDate;
      }


      // ----------------------------------------------
      // Update contact phone
      // ----------------------------------------------

      if (contactPhone !== undefined) {

        if (typeof contactPhone !== "string") {
          return res.status(400).json({
            status: false,
            message: "Invalid contact phone",
          });
        }

        const cleanPhone = contactPhone.trim();

        if (!phonePattern.test(cleanPhone)) {
          return res.status(400).json({
            status: false,
            message: "Invalid contact phone",
          });
        }

        item.contactPhone = cleanPhone;
      }


      // ----------------------------------------------
      // Update image (a new file replaces the old one)
      // ----------------------------------------------

      let oldImage = null;

      if (req.file) {
        oldImage = item.image;
        item.image = `/uploads/${req.file.filename}`;
      }


      // ----------------------------------------------
      // Owner edited an approved item:
      // hide it again until the admin re-approves it
      // ----------------------------------------------

      const sentBackToPending =
        !isAdmin && item.status === "active";

      if (sentBackToPending) {
        item.status = "pending";
        item.expiresAt = null;
      }


      // Save the changes
      await item.save();


      // The new data is saved, so the old picture can go
      if (oldImage) {
        await deleteUploadedImage(oldImage);
      }


      // ----------------------------------------------
      // Tell the admin that this post needs approval again
      // ----------------------------------------------

      if (sentBackToPending) {

        if (!categoryName) {
          const currentCategory = await Category.findById(
            item.category
          ).select("name");

          categoryName = currentCategory
            ? currentCategory.name
            : "Unknown";
        }

        await sendNewItemNotificationEmail({
          item,
          categoryName,
          isUpdate: true,
        });
      }


      await item.populate(
        "category",
        "name slug image"
      );


      return res.status(200).json({
        status: true,
        message: sentBackToPending
          ? "Item updated. It is waiting for admin approval again"
          : "Found item updated successfully",
        item,
      });

    } catch (error) {

      console.log(
        "Update item error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to update found item",
      });
    }
  }
);


// ======================================================
// CANCEL FOUND ITEM
// DELETE /api/items/:id
// PROTECTED
// OWNER ONLY
// (admins use /api/admin/items/:id/status)
//
// Works for pending and active items.
// ======================================================

foundItemRouter.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {

      // ----------------------------------------------
      // Validate ID
      // ----------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid item ID",
        });
      }


      // ----------------------------------------------
      // Find item
      // ----------------------------------------------

      const item = await FoundItem.findById(
        req.params.id
      );


      if (!item) {
        return res.status(404).json({
          status: false,
          message: "Found item not found",
        });
      }


      // ----------------------------------------------
      // Check owner
      // ----------------------------------------------

      if (
        item.postedBy.toString() !==
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          status: false,
          message:
            "You can only cancel your own posts",
        });
      }


      // ----------------------------------------------
      // Only pending or active items can be cancelled
      // ----------------------------------------------

      if (item.status !== "active" && item.status !== "pending") {
        return res.status(400).json({
          status: false,
          message:
            "This item is no longer active",
        });
      }


      // Don't physically delete.
      item.status = "cancelled";


      await item.save();


      return res.status(200).json({
        status: true,
        message:
          "Found item cancelled successfully",
      });

    } catch (error) {

      console.log(
        "Cancel item error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to cancel found item",
      });
    }
  }
);


// ======================================================
// MARK ITEM AS RETURNED
// PATCH /api/items/:id/returned
// PROTECTED
// OWNER ONLY
// (admins use /api/admin/items/:id/status)
//
// Only approved (active) items can be marked as returned.
// ======================================================

foundItemRouter.patch(
  "/:id/returned",
  authMiddleware,
  async (req, res) => {
    try {

      // ----------------------------------------------
      // Validate ID
      // ----------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid item ID",
        });
      }


      // ----------------------------------------------
      // Find item
      // ----------------------------------------------

      const item = await FoundItem.findById(
        req.params.id
      );


      if (!item) {
        return res.status(404).json({
          status: false,
          message: "Found item not found",
        });
      }


      // ----------------------------------------------
      // Check owner
      // ----------------------------------------------

      if (
        item.postedBy.toString() !==
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          status: false,
          message:
            "You can only update your own found items",
        });
      }


      // ----------------------------------------------
      // Check status
      // ----------------------------------------------

      if (item.status !== "active") {
        return res.status(400).json({
          status: false,
          message:
            "Only approved items can be marked as returned",
        });
      }


      // ----------------------------------------------
      // Mark as returned
      // ----------------------------------------------

      item.status = "returned";

      item.returnedAt = new Date();


      await item.save();


      return res.status(200).json({
        status: true,
        message:
          "Item marked as returned successfully",
        item,
      });

    } catch (error) {

      console.log(
        "Mark returned error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to mark item as returned",
      });
    }
  }
);


// ======================================================
// RENEW FOUND ITEM (another 90 days)
// PATCH /api/items/:id/renew
// PROTECTED
// OWNER ONLY
//
// Works for active items and expired items.
// An expired item becomes active again.
// Pending, returned and cancelled items cannot be renewed.
// ======================================================

foundItemRouter.patch(
  "/:id/renew",
  authMiddleware,
  async (req, res) => {
    try {

      // ----------------------------------------------
      // Validate ID
      // ----------------------------------------------

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid item ID",
        });
      }


      // ----------------------------------------------
      // Find item
      // ----------------------------------------------

      const item = await FoundItem.findById(
        req.params.id
      );


      if (!item) {
        return res.status(404).json({
          status: false,
          message: "Found item not found",
        });
      }


      // ----------------------------------------------
      // Check owner
      // ----------------------------------------------

      if (
        item.postedBy.toString() !==
        req.user.userId.toString()
      ) {
        return res.status(403).json({
          status: false,
          message:
            "You can only renew your own posts",
        });
      }


      // ----------------------------------------------
      // Only active or expired items can be renewed
      // ----------------------------------------------

      if (item.status !== "active" && item.status !== "expired") {
        return res.status(400).json({
          status: false,
          message:
            "This item cannot be renewed",
        });
      }


      // ----------------------------------------------
      // Give it another 90 days
      // ----------------------------------------------

      item.status = "active";

      item.expiresAt = new Date(
        Date.now() +
        ITEM_LIFETIME_DAYS * 24 * 60 * 60 * 1000
      );


      await item.save();


      await item.populate(
        "category",
        "name slug image"
      );


      return res.status(200).json({
        status: true,
        message:
          "Item renewed for 90 more days",
        item,
      });

    } catch (error) {

      console.log(
        "Renew item error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to renew found item",
      });
    }
  }
);


export default foundItemRouter;