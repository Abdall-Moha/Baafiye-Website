// Tool that talks to MongoDB
import mongoose from "mongoose";

// The shape of one message sent from the Contact page
const contactMessageSchema = new mongoose.Schema(
  {
    // Name of the person who wrote
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    // Email of the person (we reply to it)
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },

    // Phone of the person (optional)
    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // What the message is about
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // The message itself
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // new  = nobody read it yet
    // read = an admin read it
    status: {
      type: String,
      enum: ["new", "read"],
      default: "new",
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Fast search for the admin dashboard (newest first, by status)
contactMessageSchema.index({ status: 1, createdAt: -1 });

// Create the model
const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;