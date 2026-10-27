// Tool that talks to MongoDB
import mongoose from "mongoose";

// The shape of one email verification code
const verificationCodeSchema = new mongoose.Schema(
  {
    // The user this code belongs to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What the code is used for (only "email" for now)
    type: {
      type: String,
      enum: ["email"],
      default: "email",
    },

    // The 6-digit code
    code: {
      type: String,
      required: true,
    },

    // How many times the user tried to enter a code.
    // Too many tries = the code is deleted (stops guessing).
    attempts: {
      type: Number,
      default: 0,
    },

    // The code stops working after this time
    expiresAt: {
      type: Date,
      required: true,
    },

    // Filled when the code was used successfully
    verifiedAt: {
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
verificationCodeSchema.index({ userId: 1 });

// MongoDB deletes the code by itself after expiresAt (checks every minute)
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create the model
const VerificationCode = mongoose.model(
  "VerificationCode",
  verificationCodeSchema
);

export default VerificationCode;
