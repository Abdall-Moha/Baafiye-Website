// Tool that limits how many requests one IP address can make
import rateLimit from "express-rate-limit";

// When a limit is passed, the user gets "429 Too Many Requests".
// The counters live in the server memory (they reset when the server restarts).


// General Limiter (used on every /api route)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Maximum 500 requests

  message: {
    status: false,
    message: "Too many requests. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Register Limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 registration attempts

  message: {
    status: false,
    message: "Too many registration attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Login Limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 10, // Maximum 10 requests

  message: {
    status: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Forgot Password Limiter
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 requests

  message: {
    status: false,
    message: "Too many password reset requests. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Email Verification Limiter
export const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 attempts

  message: {
    status: false,
    message: "Too many verification attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Reset Password Limiter
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 attempts

  message: {
    status: false,
    message: "Too many password reset attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Post Item Limiter
export const createItemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Maximum 20 requests

  message: {
    status: false,
    message: "Too many item posting attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Resend Email Verification Code Limiter
export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 resend requests

  message: {
    status: false,
    message: "Too many verification code requests. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});


// Contact Finder Limiter (stops bots from collecting phone numbers)
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Maximum 30 phone number requests

  message: {
    status: false,
    message: "Too many contact requests. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});
