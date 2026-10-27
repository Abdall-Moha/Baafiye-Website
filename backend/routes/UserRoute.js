// The user model
import User from "../model/UserModel.js";
// Express (the web framework)
import express from "express";
// Tool that hashes passwords
import bcrypt from "bcrypt";
// Tool that creates login tokens
import jwt from "jsonwebtoken";
// Settings file (FRONTEND_URL is used for the reset link)
import env from "../config/env.js";
// Email functions
import { sendEmailVerificationCode } from "../job/email.js";
import { sendPasswordResetEmail } from "../job/email.js";
// Code and token makers
import { GenerateVerificationCode } from "../utils/GenerateCode.js";
import { GenerateResetToken } from "../utils/GenerateResetToken.js";
import { HashResetToken } from "../utils/GenerateResetToken.js";
// Database models for codes and tokens
import VerificationCode from "../model/VerificationCode.js";
import PasswordResetToken from "../model/PasswordResetToken.js";
// Limiters (stop too many requests)
import { loginLimiter, forgotPasswordLimiter, verifyEmailLimiter, resetPasswordLimiter, registerLimiter, resendVerificationLimiter } from "../middleware/rateLimiter.js";


const userRouter = express.Router();


// ------------------------------------------------------
// Settings for this file (change the numbers here)
// ------------------------------------------------------

// How long an email code is valid (minutes)
const CODE_EXPIRY_MINUTES = 10;

// How many wrong tries are allowed before the code is deleted
const MAX_CODE_ATTEMPTS = 5;

// How long a reset link is valid (minutes)
const RESET_EXPIRY_MINUTES = 15;

// How many seconds a user must wait before asking for another email
const RESEND_COOLDOWN_SECONDS = 60;

// Email format: something@something.something (no spaces)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone format: 9 to 20 characters (numbers, +, spaces, brackets, dash)
const phonePattern = /^[0-9+\s()-]{9,20}$/;


// ============
// REGISTER
// =============

userRouter.post("/register", registerLimiter, async (req, res) => {
  try {
    // Read the data sent by the frontend
    const { name, email, password, phone } = req.body;

    // Check required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        status: false,
        message: "Name, email, password and phone are required",
      });
    }

    // All values must be text (blocks objects and arrays)
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid input",
      });
    }

    // Clean input
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Validate name
    if (cleanName.length < 3 || cleanName.length > 60) {
      return res.status(400).json({
        status: false,
        message: "Name must be between 3 and 60 characters",
      });
    }

    // Validate email
    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password (bcrypt only uses the first 72 bytes, so we stop at 64)
    if (password.length < 6 || password.length > 64) {
      return res.status(400).json({
        status: false,
        message: "Password must be between 6 and 64 characters",
      });
    }

    // Validate phone
    if (!phonePattern.test(cleanPhone)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid phone number",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {

      // Registered before but never verified: send the user to the verify page
      // (they can ask for a new code with /resend-verification)
      if (!existingUser.isVerified) {
        return res.status(400).json({
          status: false,
          requiresVerification: true,
          email: existingUser.email,
          message:
            "This email is registered but not verified. Please request a new verification code.",
        });
      }

      return res.status(400).json({
        status: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (role is always "user", the frontend cannot choose it)
    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      phone: cleanPhone,
      role: "user",
      isVerified: false,
      isActive: true,
    });

    // Generate verification code
    const code = GenerateVerificationCode();

    // Remove any previous verification codes
    await VerificationCode.deleteMany({
      userId: newUser._id,
    });

    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Save verification code
    await VerificationCode.create({
      userId: newUser._id,
      type: "email",
      code,
      attempts: 0,
      expiresAt,
    });

    // Send verification email
    const emailSent = await sendEmailVerificationCode(
      newUser.email,
      code
    );

    // If email fails, remove the created records
    if (!emailSent) {
      await VerificationCode.deleteMany({
        userId: newUser._id,
      });

      await User.findByIdAndDelete(newUser._id);

      return res.status(500).json({
        status: false,
        message: "Failed to send verification code. Please try again later.",
      });
    }

    // Registration successful
    return res.status(201).json({
      status: true,
      requiresVerification: true,
      email: newUser.email,
      message: "Registration successful. Verification code sent to your email.",
    });

  } catch (error) {
    console.error("Error registering user:", error);

    return res.status(500).json({
      status: false,
      message: "Something went wrong while registering your account",
    });
  }
});

// ============
// VERIFY EMAIL
// =============

userRouter.post("/verify", verifyEmailLimiter, async (req, res) => {
  try {
    // Read the data sent by the frontend
    const { code, email } = req.body;

    // Check if email and code were provided
    if (!email || !code) {
      return res.status(400).json({
        status: false,
        message: "Email and verification code are required",
      });
    }

    // Both values must be text
    if (typeof email !== "string" || typeof code !== "string") {
      return res.status(400).json({
        status: false,
        message: "Invalid input",
      });
    }

    // Clean email and code
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Find user
    const user = await User.findOne({
      email: cleanEmail,
    });

    // Check if user exists (general message, so nobody can test emails)
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid email or verification code",
      });
    }

    // Check if email is already verified
    if (user.isVerified) {
      return res.status(400).json({
        status: false,
        message: "Email is already verified",
      });
    }

    // Find the newest unused code AND count this try (+1) in ONE step.
    // One step means many fast requests cannot cheat the counter.
    const verification = await VerificationCode.findOneAndUpdate(
      {
        userId: user._id,
        type: "email",
        verifiedAt: null,
      },
      {
        $inc: { attempts: 1 },
      },
      {
        new: true,
        sort: { createdAt: -1 },
      }
    );

    // Check if verification code exists
    if (!verification) {
      return res.status(400).json({
        status: false,
        message: "Verification code not found or expired. Please request a new one.",
      });
    }

    // Check if code has expired
    if (verification.expiresAt < new Date()) {
      // Delete expired code
      await VerificationCode.findByIdAndDelete(verification._id);

      return res.status(400).json({
        status: false,
        message: "Verification code has expired. Please request a new one.",
      });
    }

    // Too many tries: delete the code so guessing stops
    if (verification.attempts > MAX_CODE_ATTEMPTS) {
      await VerificationCode.findByIdAndDelete(verification._id);

      return res.status(429).json({
        status: false,
        message: "Too many wrong attempts. Please request a new code.",
      });
    }

    // Check if code matches
    if (verification.code !== cleanCode) {

      // How many tries are left
      const attemptsLeft = MAX_CODE_ATTEMPTS - verification.attempts;

      // That was the last allowed try: delete the code
      if (attemptsLeft <= 0) {
        await VerificationCode.findByIdAndDelete(verification._id);

        return res.status(429).json({
          status: false,
          message: "Too many wrong attempts. Please request a new code.",
        });
      }

      return res.status(400).json({
        status: false,
        message: "Incorrect verification code",
        attemptsLeft,
      });
    }

    // Update user's verification status
    user.isVerified = true;

    await user.save();

    // Mark the code as used
    verification.verifiedAt = new Date();

    await verification.save();

    return res.status(200).json({
      status: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    console.log("Error verifying email:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to verify email",
    });
  }
});


// ===========
// LOGIN
// ===========

userRouter.post("/login", loginLimiter, async (req, res) => {
  try {
    // Read the data sent by the frontend
    const { email, password } = req.body;

    // Check if email and password were provided
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    // Both values must be text
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        status: false,
        message: "Invalid input",
      });
    }

    // Clean email
    const cleanEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      email: cleanEmail,
    });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // Check if email is verified
    // (requiresVerification tells the frontend to open the "enter code" page)
    if (!user.isVerified) {
      return res.status(403).json({
        status: false,
        requiresVerification: true,
        email: user.email,
        message: "Please verify your email before logging in",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        status: false,
        message: "Your account has been deactivated",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Login successful
    return res.status(200).json({
      status: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.log("Login error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to login",
    });
  }
});


// ======================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// PUBLIC
// ======================================================

userRouter.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {

    // Read the data sent by the frontend
    const { email } = req.body;


    // ----------------------------------------------
    // Check email
    // ----------------------------------------------

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }


    // ----------------------------------------------
    // Clean email
    // ----------------------------------------------

    const cleanEmail = email
      .trim()
      .toLowerCase();


    // The answer is ALWAYS the same, so nobody can find out
    // which emails are registered
    const sameAnswer =
      "If an account with this email exists, a password reset link has been sent.";


    // ----------------------------------------------
    // Find user
    // ----------------------------------------------

    const user = await User.findOne({
      email: cleanEmail,
    });


    // ----------------------------------------------
    // Unknown, unverified or blocked account:
    // pretend everything is fine, but send nothing
    // ----------------------------------------------

    if (!user || !user.isVerified || !user.isActive) {
      return res.status(200).json({
        status: true,
        message: sameAnswer,
      });
    }


    // ----------------------------------------------
    // Cooldown: do not send another email too fast
    // ----------------------------------------------

    const lastToken = await PasswordResetToken.findOne({
      userId: user._id,
    }).sort({ createdAt: -1 });

    if (lastToken) {
      const secondsPassed =
        (Date.now() - lastToken.createdAt.getTime()) / 1000;

      if (secondsPassed < RESEND_COOLDOWN_SECONDS) {
        return res.status(200).json({
          status: true,
          message: sameAnswer,
        });
      }
    }


    // ----------------------------------------------
    // Delete old unused reset tokens
    // ----------------------------------------------

    await PasswordResetToken.deleteMany({
      userId: user._id,
      usedAt: null,
    });


    // ----------------------------------------------
    // Generate secure reset token
    // ----------------------------------------------

    const token = GenerateResetToken();


    // ----------------------------------------------
    // Token expires after 15 minutes
    // ----------------------------------------------

    const expiresAt = new Date(
      Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000
    );


    // ----------------------------------------------
    // Save reset token (only the HASH is saved)
    // ----------------------------------------------

    await PasswordResetToken.create({
      userId: user._id,
      token: HashResetToken(token),
      expiresAt,
    });


    // ----------------------------------------------
    // Create reset link (it has the real token)
    // ----------------------------------------------

    const resetLink =
      `${env.FRONTEND_URL}/reset-password/${token}`;


    // ----------------------------------------------
    // Send email
    // ----------------------------------------------

    const emailSent =
      await sendPasswordResetEmail(
        user.email,
        resetLink
      );


    // ----------------------------------------------
    // Check email sending
    // ----------------------------------------------

    if (!emailSent) {

      // Remove token if email failed
      await PasswordResetToken.deleteOne({
        token: HashResetToken(token),
      });

      // We do NOT send an error to the user here, because an error
      // would show that this email exists. The problem is in the server log.
      console.log("Password reset email failed for user:", user._id);
    }


    // ----------------------------------------------
    // Success
    // ----------------------------------------------

    return res.status(200).json({
      status: true,
      message: sameAnswer,
    });

  } catch (error) {

    console.log(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        "Failed to process password reset request",
    });
  }
});



// ======================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// PUBLIC
// ======================================================

userRouter.post("/reset-password", resetPasswordLimiter, async (req, res) => {
  try {

    // Read the data sent by the frontend
    const { token, newPassword } = req.body;


    // ----------------------------------------------
    // Check required fields
    // ----------------------------------------------

    if (!token || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "Token and new password are required",
      });
    }

    // Both values must be text
    if (typeof token !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        status: false,
        message: "Invalid input",
      });
    }


    // ----------------------------------------------
    // Validate password length
    // ----------------------------------------------

    if (newPassword.length < 6 || newPassword.length > 64) {
      return res.status(400).json({
        status: false,
        message:
          "Password must be between 6 and 64 characters",
      });
    }


    // ----------------------------------------------
    // Find the token AND mark it as used in ONE step.
    // It must be: the right token, not used, not expired.
    // One step means the same token can never be used twice,
    // even if two requests arrive at the same moment.
    // ----------------------------------------------

    const resetToken = await PasswordResetToken.findOneAndUpdate(
      {
        token: HashResetToken(token.trim()),
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        usedAt: new Date(),
      },
      {
        new: true,
      }
    );


    // ----------------------------------------------
    // Token doesn't exist, was used, or has expired
    // ----------------------------------------------

    if (!resetToken) {
      return res.status(400).json({
        status: false,
        message:
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }


    // ----------------------------------------------
    // Find user
    // ----------------------------------------------

    const user = await User.findById(
      resetToken.userId
    );


    if (!user || !user.isActive) {
      return res.status(400).json({
        status: false,
        message:
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }


    // ----------------------------------------------
    // Hash new password
    // ----------------------------------------------

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );


    // ----------------------------------------------
    // Update user's password
    // ----------------------------------------------

    user.password = hashedPassword;

    // Old login tokens stop working (see authMiddleware)
    user.passwordChangedAt = new Date();

    await user.save();


    // ----------------------------------------------
    // Delete any other unused reset tokens of this user
    // ----------------------------------------------

    await PasswordResetToken.deleteMany({
      userId: user._id,
      usedAt: null,
    });


    // ----------------------------------------------
    // Success
    // ----------------------------------------------

    return res.status(200).json({
      status: true,
      message:
        "Password has been reset successfully",
    });

  } catch (error) {

    console.log(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        "Failed to reset password",
    });
  }
});


// ======================================================
// RESEND EMAIL VERIFICATION CODE
// POST /api/auth/resend-verification
// PUBLIC
// ======================================================

userRouter.post(
  "/resend-verification",
  resendVerificationLimiter,
  async (req, res) => {
    try {

      // Read the data sent by the frontend
      const { email } = req.body;


      // ----------------------------------------------
      // Check email
      // ----------------------------------------------

      if (!email || typeof email !== "string") {
        return res.status(400).json({
          status: false,
          message: "Email is required",
        });
      }


      // ----------------------------------------------
      // Clean email
      // ----------------------------------------------

      const cleanEmail = email
        .trim()
        .toLowerCase();


      // The answer for unknown emails (so nobody can test emails)
      const sameAnswer =
        "If this email is registered and not verified, a new code has been sent.";


      // ----------------------------------------------
      // Find user
      // ----------------------------------------------

      const user = await User.findOne({
        email: cleanEmail,
      });


      // ----------------------------------------------
      // Unknown or blocked account: pretend everything is fine
      // ----------------------------------------------

      if (!user || !user.isActive) {
        return res.status(200).json({
          status: true,
          message: sameAnswer,
        });
      }


      // ----------------------------------------------
      // Check if already verified
      // ----------------------------------------------

      if (user.isVerified) {
        return res.status(400).json({
          status: false,
          message: "Email is already verified",
        });
      }


      // ----------------------------------------------
      // Cooldown: the newest code shows when we last sent one
      // ----------------------------------------------

      const lastCode = await VerificationCode.findOne({
        userId: user._id,
        type: "email",
        verifiedAt: null,
      }).sort({ createdAt: -1 });

      if (lastCode) {
        const secondsPassed =
          (Date.now() - lastCode.createdAt.getTime()) / 1000;

        if (secondsPassed < RESEND_COOLDOWN_SECONDS) {
          const secondsLeft = Math.ceil(
            RESEND_COOLDOWN_SECONDS - secondsPassed
          );

          return res.status(429).json({
            status: false,
            message: `Please wait ${secondsLeft} seconds before requesting a new code.`,
            secondsLeft,
          });
        }
      }


      // ----------------------------------------------
      // Delete old verification codes
      // ----------------------------------------------

      await VerificationCode.deleteMany({
        userId: user._id,
        type: "email",
        verifiedAt: null,
      });


      // ----------------------------------------------
      // Generate new code
      // ----------------------------------------------

      const code = GenerateVerificationCode();


      // ----------------------------------------------
      // Create new verification code
      // ----------------------------------------------

      await VerificationCode.create({
        userId: user._id,
        type: "email",
        code,
        attempts: 0,
        expiresAt: new Date(
          Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000
        ),
      });


      // ----------------------------------------------
      // Send new code
      // ----------------------------------------------

      const emailSent =
        await sendEmailVerificationCode(
          user.email,
          code
        );


      // ----------------------------------------------
      // Check email sending
      // ----------------------------------------------

      if (!emailSent) {

        // Delete the code if email failed
        await VerificationCode.deleteMany({
          userId: user._id,
          type: "email",
          verifiedAt: null,
        });

        return res.status(500).json({
          status: false,
          message:
            "Failed to send verification code. Please try again later.",
        });
      }


      // ----------------------------------------------
      // Success
      // ----------------------------------------------

      return res.status(200).json({
        status: true,
        message: sameAnswer,
      });

    } catch (error) {

      console.log(
        "Resend verification error:",
        error
      );

      return res.status(500).json({
        status: false,
        message:
          "Failed to resend verification code",
      });
    }
  }
);

export default userRouter;
