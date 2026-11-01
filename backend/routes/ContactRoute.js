// Express (the web framework)
import express from "express";

// Database model
import ContactMessage from "../model/ContactMessage.js";
// Limiter (stops spam)
import { contactMessageLimiter } from "../middleware/rateLimiter.js";

const contactRouter = express.Router();


// ------------------------------------------------------
// Settings for this file
// ------------------------------------------------------

// Simple email format check: something@something.something
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone format: 7 to 20 characters (numbers, +, spaces, brackets, dash)
const phonePattern = /^[0-9+\s()-]{7,20}$/;


// ======================================================
// SEND A CONTACT MESSAGE
// POST /api/contact
// PUBLIC (limited by contactMessageLimiter)
//
// Body: name, email, phone (optional), subject, message
// The admin reads the messages in the dashboard.
// ======================================================

contactRouter.post(
  "/",
  contactMessageLimiter,
  async (req, res) => {
    try {

      // Read the data sent by the frontend
      const {
        name,
        email,
        phone = "",
        subject,
        message,
        website, // hidden trap field (real people never fill it)
      } = req.body;


      // ----------------------------------------------
      // Spam trap: a robot filled the hidden field.
      // We pretend it worked, but we save nothing.
      // ----------------------------------------------

      if (website) {
        return res.status(201).json({
          status: true,
          message: "Your message was sent. Thank you!",
        });
      }


      // ----------------------------------------------
      // Validate required fields
      // ----------------------------------------------

      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          status: false,
          message: "Name, email, subject and message are required",
        });
      }


      // ----------------------------------------------
      // All values must be text (blocks objects and arrays)
      // ----------------------------------------------

      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof phone !== "string" ||
        typeof subject !== "string" ||
        typeof message !== "string"
      ) {
        return res.status(400).json({
          status: false,
          message: "Invalid input",
        });
      }


      // ----------------------------------------------
      // Clean the text
      // ----------------------------------------------

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();
      const cleanSubject = subject.trim();
      const cleanMessage = message.trim();


      // ----------------------------------------------
      // Validate name
      // ----------------------------------------------

      if (cleanName.length < 2 || cleanName.length > 60) {
        return res.status(400).json({
          status: false,
          message: "Name must be between 2 and 60 characters",
        });
      }


      // ----------------------------------------------
      // Validate email
      // ----------------------------------------------

      if (cleanEmail.length > 100 || !emailPattern.test(cleanEmail)) {
        return res.status(400).json({
          status: false,
          message: "Please enter a valid email",
        });
      }


      // ----------------------------------------------
      // Validate phone (only when the user wrote one)
      // ----------------------------------------------

      if (cleanPhone && !phonePattern.test(cleanPhone)) {
        return res.status(400).json({
          status: false,
          message: "Please enter a valid phone number",
        });
      }


      // ----------------------------------------------
      // Validate subject
      // ----------------------------------------------

      if (cleanSubject.length < 3 || cleanSubject.length > 100) {
        return res.status(400).json({
          status: false,
          message: "Subject must be between 3 and 100 characters",
        });
      }


      // ----------------------------------------------
      // Validate message
      // ----------------------------------------------

      if (cleanMessage.length < 10 || cleanMessage.length > 2000) {
        return res.status(400).json({
          status: false,
          message: "Message must be between 10 and 2000 characters",
        });
      }


      // ----------------------------------------------
      // Save the message
      // ----------------------------------------------

      await ContactMessage.create({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: cleanSubject,
        message: cleanMessage,
      });


      return res.status(201).json({
        status: true,
        message: "Your message was sent. Thank you!",
      });

    } catch (error) {

      console.log(
        "Send contact message error:",
        error
      );

      return res.status(500).json({
        status: false,
        message: "Failed to send your message",
      });
    }
  }
);


export default contactRouter;