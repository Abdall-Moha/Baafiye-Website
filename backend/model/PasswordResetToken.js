// Tool that talks to MongoDB
import mongoose from "mongoose";

// The shape of one password reset token
const passwordResetTokenSchema = new mongoose.Schema(
  {
    // The user who asked for the reset
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The HASHED token (the real token is only in the email link)
    token: {
      type: String,
      required: true,
      unique: true,
    },

    // The link stops working after this time
    expiresAt: {
      type: Date,
      required: true,
    },

    // Filled when the token is used. A used token can never be used again.
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Fast search by user
passwordResetTokenSchema.index({ userId: 1 });

// MongoDB deletes the token by itself after expiresAt (checks every minute)
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create the model
const PasswordResetToken = mongoose.model(
  "PasswordResetToken",
  passwordResetTokenSchema
);

export default PasswordResetToken;
