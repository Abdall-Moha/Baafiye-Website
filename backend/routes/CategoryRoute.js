// Express (the web framework)
import express from "express";
// Tool used to check MongoDB ids
import mongoose from "mongoose";
// The category model
import Category from "../model/Category.js";
// Login check
import authMiddleware from "../middleware/authMiddleware.js";

const categoryRouter = express.Router();

// A slug can only have lowercase letters, numbers and dashes (example: id-card)
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;


// ======================================================
// GET ALL ACTIVE CATEGORIES
// GET /api/categories
// PUBLIC
// ======================================================

categoryRouter.get("/", async (req, res) => {
  try {
    // Get active categories, sorted by name
    const categories = await Category.find({
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      status: true,
      categories,
    });

  } catch (error) {
    console.log("Get categories error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get categories",
    });
  }
});


// ======================================================
// GET SINGLE ACTIVE CATEGORY
// GET /api/categories/:id
// PUBLIC
// ======================================================

categoryRouter.get("/:id", async (req, res) => {
  try {

    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid category ID",
      });
    }

    // Find the category
    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      status: true,
      category,
    });

  } catch (error) {
    console.log("Get category error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get category",
    });
  }
});


// ======================================================
// CREATE CATEGORY
// POST /api/categories
// ADMIN ONLY
// ======================================================

categoryRouter.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {

      // Check admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: false,
          message: "Admin access required",
        });
      }

      // Read the data sent by the frontend
      const { name, slug, image } = req.body;

      // Required fields
      if (!name || !slug) {
        return res.status(400).json({
          status: false,
          message: "Category name and slug are required",
        });
      }

      // Name, slug and image must be text
      if (
        typeof name !== "string" ||
        typeof slug !== "string" ||
        (image !== undefined && typeof image !== "string")
      ) {
        return res.status(400).json({
          status: false,
          message: "Invalid input",
        });
      }

      const cleanName = name.trim();
      const cleanSlug = slug.trim().toLowerCase();

      // Check name length
      if (!cleanName || cleanName.length > 50) {
        return res.status(400).json({
          status: false,
          message: "Category name must be between 1 and 50 characters",
        });
      }

      // Check slug format
      if (!slugPattern.test(cleanSlug)) {
        return res.status(400).json({
          status: false,
          message:
            "Slug can only have lowercase letters, numbers and dashes (example: id-card)",
        });
      }

      // Check duplicate category
      const existingCategory = await Category.findOne({
        $or: [
          { name: cleanName },
          { slug: cleanSlug },
        ],
      });

      if (existingCategory) {
        return res.status(400).json({
          status: false,
          message: "Category already exists",
        });
      }

      // Create the category
      const category = await Category.create({
        name: cleanName,
        slug: cleanSlug,
        image: image ? image.trim() : "",
        isActive: true,
      });

      return res.status(201).json({
        status: true,
        message: "Category created successfully",
        category,
      });

    } catch (error) {
      console.log("Create category error:", error);

      // Duplicate key protection
      if (error.code === 11000) {
        return res.status(400).json({
          status: false,
          message: "Category name or slug already exists",
        });
      }

      return res.status(500).json({
        status: false,
        message: "Failed to create category",
      });
    }
  }
);


// ======================================================
// UPDATE CATEGORY
// PUT /api/categories/:id
// ADMIN ONLY
// ======================================================

categoryRouter.put(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {

      // Check admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: false,
          message: "Admin access required",
        });
      }

      // Check the id
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid category ID",
        });
      }

      // Read the data sent by the frontend
      const {
        name,
        slug,
        image,
        isActive,
      } = req.body;

      // Find the category (this one can also be inactive)
      const category = await Category.findById(
        req.params.id
      );

      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Category not found",
        });
      }

      // Update name
      if (name !== undefined) {

        if (typeof name !== "string") {
          return res.status(400).json({
            status: false,
            message: "Category name must be text",
          });
        }

        const cleanName = name.trim();

        if (!cleanName || cleanName.length > 50) {
          return res.status(400).json({
            status: false,
            message: "Category name must be between 1 and 50 characters",
          });
        }

        category.name = cleanName;
      }

      // Update slug
      if (slug !== undefined) {

        if (typeof slug !== "string") {
          return res.status(400).json({
            status: false,
            message: "Category slug must be text",
          });
        }

        const cleanSlug = slug.trim().toLowerCase();

        if (!slugPattern.test(cleanSlug)) {
          return res.status(400).json({
            status: false,
            message:
              "Slug can only have lowercase letters, numbers and dashes (example: id-card)",
          });
        }

        category.slug = cleanSlug;
      }

      // Update image
      if (image !== undefined) {

        if (typeof image !== "string") {
          return res.status(400).json({
            status: false,
            message: "Image must be text",
          });
        }

        category.image = image.trim();
      }

      // Update active status
      if (isActive !== undefined) {

        if (typeof isActive !== "boolean") {
          return res.status(400).json({
            status: false,
            message: "isActive must be true or false",
          });
        }

        category.isActive = isActive;
      }

      // Save the changes
      await category.save();

      return res.status(200).json({
        status: true,
        message: "Category updated successfully",
        category,
      });

    } catch (error) {
      console.log("Update category error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          status: false,
          message: "Category name or slug already exists",
        });
      }

      return res.status(500).json({
        status: false,
        message: "Failed to update category",
      });
    }
  }
);


// ======================================================
// DELETE / DEACTIVATE CATEGORY
// DELETE /api/categories/:id
// ADMIN ONLY
// ======================================================

categoryRouter.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {

      // Check admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          status: false,
          message: "Admin access required",
        });
      }

      // Check the id
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid category ID",
        });
      }

      // Find the category
      const category = await Category.findById(
        req.params.id
      );

      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Category not found",
        });
      }

      // Don't permanently delete category.
      // Existing FoundItems may still reference it.
      category.isActive = false;

      await category.save();

      return res.status(200).json({
        status: true,
        message: "Category deactivated successfully",
      });

    } catch (error) {
      console.log("Delete category error:", error);

      return res.status(500).json({
        status: false,
        message: "Failed to deactivate category",
      });
    }
  }
);


export default categoryRouter;
