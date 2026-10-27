// Tool that talks to MongoDB
import mongoose from "mongoose";

// The shape of one user in the database
const userSchema = new mongoose.Schema(
  {
    // Full name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Email: saved in lowercase, and no two users can have the same email
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password: always saved as a bcrypt hash, never as normal text
    password: {
      type: String,
      required: true,
    },

    // Phone number of the user
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // "user" = normal user, "admin" = can manage everything
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // true after the user enters the correct email code
    isVerified: {
      type: Boolean,
      default: false,
    },

    // false = the user is blocked by an admin
    isActive: {
      type: Boolean,
      default: true,
    },

    // Filled when the password is reset.
    // Login tokens created BEFORE this date stop working.
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Create the model (this is what the routes use)
const User = mongoose.model("User", userSchema);

export default User;
