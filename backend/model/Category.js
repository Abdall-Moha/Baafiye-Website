// Tool that talks to MongoDB
import mongoose from "mongoose";

// The shape of one category (Money, Passport, Phone...)
const categorySchema = new mongoose.Schema(
  {
    // Name shown to people, for example "ID Card"
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Name used in URLs, for example "id-card"
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Generic picture of the category (never a real document photo)
    image: {
      type: String,
      default: "",
    },

    // false = hidden from the public (we never delete categories)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Create the model
const Category = mongoose.model("Category", categorySchema);

export default Category;
