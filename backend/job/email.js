// Tool that sends emails
import nodemailer from "nodemailer";
// Tools to find the uploaded picture on the server
import path from "path";
import fs from "fs";
// Settings file (has the Gmail account)
import env from "../config/env.js";
// Folder where the uploaded pictures are saved
import { uploadsDir } from "../middleware/imageUploadMiddleware.js";

// The "mail sender" that uses your Gmail account
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: env.EMAIL.EMAIL_USER,
        pass: env.EMAIL.EMAIL_PASS,
    },
});


// Makes user text safe to put inside HTML
// (anyone can post anything, so we never trust their text)
const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};


// Send the 6-digit verification code.
// Returns true if the email was sent, false if it failed.
export const sendEmailVerificationCode = async (email, code) => {
    try {
        // Send the email
        await transporter.sendMail({
            from: `"Baafin" <${env.EMAIL.EMAIL_USER}>`,
            to: email,
            subject: "Verify Your Email",
            html: `
    <div style="
        max-width: 500px;
        margin: 40px auto;
        padding: 30px;
        background: #ffffff;
        border-radius: 12px;
        font-family: Arial, sans-serif;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    ">
        <h2 style="color: #2563eb; margin-bottom: 10px;">
            Verify Your Email
        </h2>

        <p style="color: #555; font-size: 15px;">
            Use the verification code below to verify your email address.
        </p>

        <div style="
            margin: 25px 0;
            padding: 15px;
            background: #eff6ff;
            border: 1px dashed #2563eb;
            border-radius: 8px;
            color: #2563eb;
            font-size: 30px;
            font-weight: bold;
            letter-spacing: 6px;
        ">
            ${code}
        </div>

        <p style="color: #999; font-size: 13px;">
            This code will expire in 10 minutes.
        </p>

        <p style="color: #aaa; font-size: 12px; margin-top: 25px;">
            If you didn't request this code, you can ignore this email.
        </p>
    </div>
`
        });
        return true;
    } catch (error) {
        console.log("EMAIL ERROR:", error);

        return false;
    }
};


// Send the password reset link.
// Returns true if the email was sent, false if it failed.
export const sendPasswordResetEmail = async (email,resetLink) => {
    try {
        // Send the email
        await transporter.sendMail({
            from: `"Baafin" <${env.EMAIL.EMAIL_USER}>`,
            to: email,
            subject: "Reset Your Baafin Password",

            html: `
        <div style="
          max-width: 500px;
          margin: 40px auto;
          padding: 30px;
          background: #ffffff;
          border-radius: 12px;
          font-family: Arial, sans-serif;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        ">

          <h2 style="
            color: #2563eb;
            margin-bottom: 10px;
          ">
            Reset Your Password
          </h2>

          <p style="
            color: #555;
            font-size: 15px;
          ">
            We received a request to reset your Baafin password.
          </p>

          <a
            href="${resetLink}"
            style="
              display: inline-block;
              margin: 25px 0;
              padding: 14px 25px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Reset Password
          </a>

          <p style="
            color: #999;
            font-size: 13px;
          ">
            This link will expire in 15 minutes and can be used only once.
          </p>

          <p style="
            color: #aaa;
            font-size: 12px;
            margin-top: 25px;
          ">
            If you didn't request a password reset,
            you can safely ignore this email.
          </p>

        </div>
      `,
        });

        return true;

    } catch (error) {

        console.log(
            "PASSWORD RESET EMAIL ERROR:",
            error
        );

        return false;
    }
};


// Tell the admin that an item is waiting for approval.
// The admin account is the same Gmail account that sends the emails.
// isUpdate = true when a user edited an already approved post.
// Returns true if the email was sent, false if it failed.
export const sendNewItemNotificationEmail = async ({
    item,
    categoryName,
    isUpdate = false,
}) => {
    try {
        const foundDate = new Date(item.foundDate).toDateString();

        // The picture is a file in the uploads folder.
        // We attach it and show it inside the email.
        const imageFile = path.join(
            uploadsDir,
            path.basename(item.image || "")
        );

        const hasImage = fs.existsSync(imageFile);

        await transporter.sendMail({
            from: `"Baafin" <${env.EMAIL.EMAIL_USER}>`,
            to: env.EMAIL.EMAIL_USER,
            subject: isUpdate
                ? "Edited post needs re-approval - Baafin"
                : "New found item waiting for approval - Baafin",

            attachments: hasImage
                ? [
                      {
                          filename: path.basename(imageFile),
                          path: imageFile,
                          cid: "item-image",
                      },
                  ]
                : [],

            html: `
        <div style="
          max-width: 500px;
          margin: 40px auto;
          padding: 30px;
          background: #ffffff;
          border-radius: 12px;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        ">

          <h2 style="color: #2563eb; margin-bottom: 10px; text-align: center;">
            ${isUpdate ? "Edited Post Needs Approval" : "New Post Needs Approval"}
          </h2>

          <p style="color: #555; font-size: 15px; text-align: center;">
            ${
                isUpdate
                    ? "A user edited an approved post. It is hidden until you approve it again."
                    : "A user posted a found item. It is hidden until you approve it."
            }
          </p>

          ${
              hasImage
                  ? `<img
            src="cid:item-image"
            alt="Item image"
            style="
              display: block;
              width: 100%;
              max-height: 300px;
              object-fit: cover;
              border-radius: 8px;
              margin: 20px 0;
            "
          />`
                  : ""
          }

          <table style="width: 100%; font-size: 14px; color: #333; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #888;">Title</td>
              <td style="padding: 6px 0;"><b>${escapeHtml(item.title)}</b></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888;">Category</td>
              <td style="padding: 6px 0;">${escapeHtml(categoryName)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888;">District</td>
              <td style="padding: 6px 0;">${escapeHtml(item.district)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888;">Village</td>
              <td style="padding: 6px 0;">${escapeHtml(item.village)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888;">Found date</td>
              <td style="padding: 6px 0;">${escapeHtml(foundDate)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888;">Contact phone</td>
              <td style="padding: 6px 0;">${escapeHtml(item.contactPhone)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888;">Item ID</td>
              <td style="padding: 6px 0;">${escapeHtml(item._id)}</td>
            </tr>
          </table>

          <p style="color: #999; font-size: 13px; margin-top: 25px; text-align: center;">
            Open your admin dashboard to approve or reject this post.
          </p>

        </div>
      `,
        });

        return true;

    } catch (error) {

        console.log(
            "NEW ITEM NOTIFICATION EMAIL ERROR:",
            error
        );

        return false;
    }
};