// Express (the web framework)
import express from "express";
// Tool used to check MongoDB ids
import mongoose from "mongoose";

// Database models
import User from "../model/UserModel.js";
import FoundItem from "../model/FoundItem.js";
import Category from "../model/Category.js";
import ContactMessage from "../model/ContactMessage.js";
// Login check
import authMiddleware from "../middleware/authMiddleware.js";

const adminRouter = express.Router();


// ------------------------------------------------------
// Settings for this file
// ------------------------------------------------------

// How many days an item stays public (same as FoundItemRoute)
const ITEM_LIFETIME_DAYS = 90;

// Statuses the admin can FILTER the list by (includes "pending")
const filterStatuses = ["pending", "active", "returned", "expired", "cancelled"];

// Statuses the admin can SET with the status route.
// "pending" is not here: pending items are handled by approve / reject.
const allowedStatuses = ["active", "returned", "expired", "cancelled"];

// Makes user text safe to use inside a search pattern
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Allows only admins. It runs after authMiddleware.
const adminOnly = (req, res, next) => {
  // The role comes from the database (see authMiddleware)
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: false,
      message: "Admin access required",
    });
  }

  // Continue to the route
  next();
};

// EVERY route in this file needs: 1) login   2) admin role
adminRouter.use(authMiddleware, adminOnly);


// ======================================================
// GET DASHBOARD NUMBERS
// GET /api/admin/stats
// ADMIN ONLY
// ======================================================

adminRouter.get("/stats", async (req, res) => {
  try {

    // Reports ("most found category / district") count only items that
    // were really approved. Pending (not checked yet) and cancelled
    // (rejected or removed) items are not counted.
    const countedStatuses = ["active", "returned", "expired"];

    // Count everything at the same time
    const [
      totalUsers,
      blockedUsers,
      totalCategories,
      pendingItems,
      activeItems,
      returnedItems,
      expiredItems,
      cancelledItems,
      unreadMessages,
      categoryTotals,
      districtTotals,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: false }),
      Category.countDocuments(),
      FoundItem.countDocuments({ status: "pending" }),
      FoundItem.countDocuments({ status: "active" }),
      FoundItem.countDocuments({ status: "returned" }),
      FoundItem.countDocuments({ status: "expired" }),
      FoundItem.countDocuments({ status: "cancelled" }),
      ContactMessage.countDocuments({ status: "new" }),

      // The 5 categories with the most items
      FoundItem.aggregate([
        { $match: { status: { $in: countedStatuses } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 },
      ]),

      // The 5 districts with the most items
      FoundItem.aggregate([
        { $match: { status: { $in: countedStatuses } } },
        { $group: { _id: "$district", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 },
      ]),
    ]);


    // The aggregate gives category ids, so we get the names
    const categoryDocs = await Category.find({
      _id: { $in: categoryTotals.map((row) => row._id) },
    }).select("name");

    const topCategories = categoryTotals.map((row) => {
      const found = categoryDocs.find(
        (category) => category._id.toString() === row._id.toString()
      );

      return {
        name: found ? found.name : "Unknown",
        count: row.count,
      };
    });

    // Districts are already text
    const topDistricts = districtTotals.map((row) => {
      return {
        name: row._id,
        count: row.count,
      };
    });


    return res.status(200).json({
      status: true,
      stats: {
        totalUsers,
        blockedUsers,
        totalCategories,
        unreadMessages,
        approvedItems: activeItems + returnedItems + expiredItems,
        topCategories,
        topDistricts,
        items: {
          pending: pendingItems,
          active: activeItems,
          returned: returnedItems,
          expired: expiredItems,
          cancelled: cancelledItems,
        },
      },
    });

  } catch (error) {
    console.log("Admin stats error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get stats",
    });
  }
});


// ======================================================
// GET ALL CATEGORIES (also inactive ones)
// GET /api/admin/categories
// ADMIN ONLY
// ======================================================

adminRouter.get("/categories", async (req, res) => {
  try {

    const categories = await Category.find().sort({ name: 1 });

    return res.status(200).json({
      status: true,
      categories,
    });

  } catch (error) {
    console.log("Admin get categories error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get categories",
    });
  }
});


// ======================================================
// GET ALL ITEMS (any status, with phone and poster)
// GET /api/admin/items
// ADMIN ONLY
//
// Supports: status, search, page, limit
//
// To see the posts waiting for approval:
// GET /api/admin/items?status=pending
// (oldest first, so the first post is answered first)
// ======================================================

adminRouter.get("/items", async (req, res) => {
  try {

    // Read the values from the URL
    const {
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;


    // URL values must be plain text
    if (
      (status && typeof status !== "string") ||
      (search && typeof search !== "string")
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid search values",
      });
    }


    // Pagination (admins can see up to 100 per page)
    const currentPage = Math.max(Number(page) || 1, 1);

    const itemsPerPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip = (currentPage - 1) * itemsPerPage;


    // Filter (empty = show everything)
    const filter = {};

    // Filter by status
    if (status) {

      if (!filterStatuses.includes(status)) {
        return res.status(400).json({
          status: false,
          message: "Invalid status",
        });
      }

      filter.status = status;
    }

    // Search in the title
    if (search) {
      filter.title = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }


    // Pending posts: oldest first. Everything else: newest first.
    const sortOrder =
      status === "pending"
        ? { createdAt: 1 }
        : { createdAt: -1 };


    // Get items + total count
    const [
      items,
      totalItems,
    ] = await Promise.all([

      FoundItem.find(filter)
        .populate("category", "name slug image")
        .populate("postedBy", "name email phone isActive")
        .sort(sortOrder)
        .skip(skip)
        .limit(itemsPerPage),

      FoundItem.countDocuments(filter),
    ]);


    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return res.status(200).json({
      status: true,

      items,

      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });

  } catch (error) {
    console.log("Admin get items error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get items",
    });
  }
});


// ======================================================
// APPROVE A PENDING ITEM
// PATCH /api/admin/items/:id/approve
// ADMIN ONLY
//
// The item becomes "active" (public) and gets 90 days
// from NOW.
// ======================================================

adminRouter.patch("/items/:id/approve", async (req, res) => {
  try {

    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid item ID",
      });
    }


    // Find the item
    const item = await FoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        status: false,
        message: "Found item not found",
      });
    }


    // Only pending items can be approved
    if (item.status !== "pending") {
      return res.status(400).json({
        status: false,
        message: "Only pending items can be approved",
      });
    }


    // Make it public and start the 90 days
    item.status = "active";

    item.expiresAt = new Date(
      Date.now() +
      ITEM_LIFETIME_DAYS * 24 * 60 * 60 * 1000
    );

    await item.save();

    await item.populate("category", "name slug image");
    await item.populate("postedBy", "name email phone isActive");


    return res.status(200).json({
      status: true,
      message: "Item approved successfully",
      item,
    });

  } catch (error) {
    console.log("Admin approve item error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to approve item",
    });
  }
});


// ======================================================
// REJECT A PENDING ITEM
// PATCH /api/admin/items/:id/reject
// ADMIN ONLY
//
// The item becomes "cancelled" and is never shown
// to the public.
// ======================================================

adminRouter.patch("/items/:id/reject", async (req, res) => {
  try {

    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid item ID",
      });
    }


    // Find the item
    const item = await FoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        status: false,
        message: "Found item not found",
      });
    }


    // Only pending items can be rejected
    if (item.status !== "pending") {
      return res.status(400).json({
        status: false,
        message: "Only pending items can be rejected",
      });
    }


    item.status = "cancelled";

    await item.save();

    await item.populate("category", "name slug image");
    await item.populate("postedBy", "name email phone isActive");


    return res.status(200).json({
      status: true,
      message: "Item rejected successfully",
      item,
    });

  } catch (error) {
    console.log("Admin reject item error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to reject item",
    });
  }
});


// ======================================================
// CHANGE THE STATUS OF ANY ITEM
// PATCH /api/admin/items/:id/status
// ADMIN ONLY
//
// Body: { "status": "active" | "returned" | "expired" | "cancelled" }
//
// Examples:
// "cancelled" = remove a bad item from the public page
// "returned"  = mark an item as returned
// "active"    = show the item again
//
// Pending items are NOT handled here.
// Use /approve or /reject for them.
// ======================================================

adminRouter.patch("/items/:id/status", async (req, res) => {
  try {

    // Read the data sent by the frontend
    const { status } = req.body;


    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid item ID",
      });
    }


    // Check the new status
    if (typeof status !== "string" || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: false,
        message:
          "Status must be active, returned, expired or cancelled",
      });
    }


    // Find the item
    const item = await FoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        status: false,
        message: "Found item not found",
      });
    }


    // Pending items must be approved or rejected
    if (item.status === "pending") {
      return res.status(400).json({
        status: false,
        message: "Use approve or reject for pending items",
      });
    }


    // Set the new status
    item.status = status;

    // Keep returnedAt correct
    if (status === "returned") {

      // Save the date only the first time
      if (!item.returnedAt) {
        item.returnedAt = new Date();
      }

    } else {
      item.returnedAt = null;
    }

    // An item that is shown again needs a date in the future,
    // otherwise it would stay hidden
    if (
      status === "active" &&
      (!item.expiresAt || item.expiresAt <= new Date())
    ) {
      item.expiresAt = new Date(
        Date.now() +
        ITEM_LIFETIME_DAYS * 24 * 60 * 60 * 1000
      );
    }

    await item.save();

    await item.populate("category", "name slug image");
    await item.populate("postedBy", "name email phone isActive");


    return res.status(200).json({
      status: true,
      message: `Item status changed to ${status}`,
      item,
    });

  } catch (error) {
    console.log("Admin change item status error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to change item status",
    });
  }
});


// ======================================================
// GET ALL USERS
// GET /api/admin/users
// ADMIN ONLY
//
// Supports: search (name or email), page, limit
// ======================================================

adminRouter.get("/users", async (req, res) => {
  try {

    // Read the values from the URL
    const {
      search,
      page = 1,
      limit = 20,
    } = req.query;


    // URL values must be plain text
    if (search && typeof search !== "string") {
      return res.status(400).json({
        status: false,
        message: "Invalid search values",
      });
    }


    // Pagination
    const currentPage = Math.max(Number(page) || 1, 1);

    const usersPerPage = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip = (currentPage - 1) * usersPerPage;


    // Filter (empty = show everyone)
    const filter = {};

    // Search in name or email
    if (search) {
      const pattern = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };

      filter.$or = [
        { name: pattern },
        { email: pattern },
      ];
    }


    // Get users + total count
    const [
      users,
      totalUsers,
    ] = await Promise.all([

      User.find(filter)
        // Never send the password hash
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(usersPerPage),

      User.countDocuments(filter),
    ]);


    const totalPages = Math.ceil(totalUsers / usersPerPage);

    return res.status(200).json({
      status: true,

      users,

      pagination: {
        currentPage,
        itemsPerPage: usersPerPage,
        totalItems: totalUsers,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });

  } catch (error) {
    console.log("Admin get users error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get users",
    });
  }
});


// ======================================================
// BLOCK OR UNBLOCK A USER
// PATCH /api/admin/users/:id/active
// ADMIN ONLY
//
// Body: { "isActive": false }  = block
//       { "isActive": true }   = unblock
//
// When a user is blocked, their pending and active items
// are removed (status becomes "cancelled").
// Unblocking does NOT bring the items back.
// ======================================================

adminRouter.patch("/users/:id/active", async (req, res) => {
  try {

    // Read the data sent by the frontend
    const { isActive } = req.body;


    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
      });
    }


    // Check the value
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "isActive must be true or false",
      });
    }


    // An admin cannot block their own account
    if (req.params.id === req.user.userId) {
      return res.status(400).json({
        status: false,
        message: "You cannot change your own account",
      });
    }


    // Find the user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }


    // Save the new value
    user.isActive = isActive;

    await user.save();


    // Blocked user: remove all their pending and active items
    if (isActive === false) {
      await FoundItem.updateMany(
        {
          postedBy: user._id,
          status: { $in: ["pending", "active"] },
        },
        {
          $set: { status: "cancelled" },
        }
      );
    }


    return res.status(200).json({
      status: true,
      message: isActive
        ? "User activated successfully"
        : "User blocked successfully",
    });

  } catch (error) {
    console.log("Admin change user active error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to change user status",
    });
  }
});


// ======================================================
// MAKE A USER ADMIN (or normal user again)
// PATCH /api/admin/users/:id/role
// ADMIN ONLY
//
// Body: { "role": "admin" } or { "role": "user" }
// ======================================================

adminRouter.patch("/users/:id/role", async (req, res) => {
  try {

    // Read the data sent by the frontend
    const { role } = req.body;


    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
      });
    }


    // Check the role
    if (role !== "admin" && role !== "user") {
      return res.status(400).json({
        status: false,
        message: "Role must be admin or user",
      });
    }


    // An admin cannot change their own role
    // (this stops you from locking yourself out)
    if (req.params.id === req.user.userId) {
      return res.status(400).json({
        status: false,
        message: "You cannot change your own role",
      });
    }


    // Find the user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }


    // Save the new role
    user.role = role;

    await user.save();


    return res.status(200).json({
      status: true,
      message: `User role changed to ${role}`,
    });

  } catch (error) {
    console.log("Admin change user role error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to change user role",
    });
  }
});


// ======================================================
// GET CONTACT MESSAGES
// GET /api/admin/messages
// ADMIN ONLY
//
// Supports: status (new | read), search (name, email, subject),
// page, limit. Newest first.
// ======================================================

adminRouter.get("/messages", async (req, res) => {
  try {

    // Read the values from the URL
    const {
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;


    // URL values must be plain text
    if (
      (status && typeof status !== "string") ||
      (search && typeof search !== "string")
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid search values",
      });
    }


    // Pagination
    const currentPage = Math.max(Number(page) || 1, 1);

    const messagesPerPage = Math.min(
      Math.max(Number(limit) || 10, 1),
      50
    );

    const skip = (currentPage - 1) * messagesPerPage;


    // Filter (empty = show everything)
    const filter = {};

    if (status) {

      if (status !== "new" && status !== "read") {
        return res.status(400).json({
          status: false,
          message: "Invalid status",
        });
      }

      filter.status = status;
    }

    // Search in name, email or subject
    if (search) {
      const pattern = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };

      filter.$or = [
        { name: pattern },
        { email: pattern },
        { subject: pattern },
      ];
    }


    // Get messages + total count
    const [
      messages,
      totalMessages,
    ] = await Promise.all([

      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(messagesPerPage),

      ContactMessage.countDocuments(filter),
    ]);


    const totalPages = Math.ceil(totalMessages / messagesPerPage);

    return res.status(200).json({
      status: true,

      messages,

      pagination: {
        currentPage,
        itemsPerPage: messagesPerPage,
        totalItems: totalMessages,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });

  } catch (error) {
    console.log("Admin get messages error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get messages",
    });
  }
});


// ======================================================
// MARK A MESSAGE AS READ (or unread again)
// PATCH /api/admin/messages/:id/status
// ADMIN ONLY
//
// Body: { "status": "read" } or { "status": "new" }
// ======================================================

adminRouter.patch("/messages/:id/status", async (req, res) => {
  try {

    // Read the data sent by the frontend
    const { status } = req.body;


    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid message ID",
      });
    }


    // Check the new status
    if (status !== "read" && status !== "new") {
      return res.status(400).json({
        status: false,
        message: "Status must be read or new",
      });
    }


    // Find and update the message
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found",
      });
    }


    return res.status(200).json({
      status: true,
      message: "Message updated",
      contactMessage: message,
    });

  } catch (error) {
    console.log("Admin update message error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to update message",
    });
  }
});


// ======================================================
// DELETE A MESSAGE
// DELETE /api/admin/messages/:id
// ADMIN ONLY
// ======================================================

adminRouter.delete("/messages/:id", async (req, res) => {
  try {

    // Check the id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid message ID",
      });
    }


    // Delete the message
    const message = await ContactMessage.findByIdAndDelete(
      req.params.id
    );

    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found",
      });
    }


    return res.status(200).json({
      status: true,
      message: "Message deleted",
    });

  } catch (error) {
    console.log("Admin delete message error:", error);

      return res.status(500).json({
      status: false,
      message: "Failed to delete message",
    });
  }
});

export default adminRouter;