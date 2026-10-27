// Tool that talks to MongoDB
import mongoose from "mongoose";

// The shape of one found item in the database
const foundItemSchema = new mongoose.Schema(
  {
    // Short title, for example "Black wallet"
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // The category of the item (points to the Category collection)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // District where the item was found (must be one of these)
    district: {
      type: String,
      required: true,
      enum: [
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
      ],
    },

    // Village or area inside the district
    village: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // The day the item was found
    foundDate: {
      type: Date,
      required: true,
    },

    // Picture of the item (REQUIRED).
    // The finder uploads it, we save the path, for example "/uploads/3f2a....jpg"
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Phone number of the finder (NOT shown in public lists)
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },

    // pending   = waiting for admin approval (NOT public)
    // active    = approved and public
    // returned  = given back
    // expired   = 90 days passed
    // cancelled = removed by the finder or by an admin (also used for rejected posts)
    status: {
      type: String,
      enum: ["pending", "active", "returned", "expired", "cancelled"],
      default: "pending",
    },

    // The user who posted the item
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // When the item was marked as returned
    returnedAt: {
      type: Date,
      default: null,
    },

    // Set when the admin approves (approval date + 90 days).
    // null while the item is pending.
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Indexes make searching faster (like the index at the back of a book)
foundItemSchema.index({ status: 1, expiresAt: 1, createdAt: -1 });
foundItemSchema.index({ category: 1 });
foundItemSchema.index({ district: 1 });
foundItemSchema.index({ postedBy: 1, createdAt: -1 });

// Create the model
const FoundItem = mongoose.model("FoundItem", foundItemSchema);

export default FoundItem;