// Tool that reads the .env file
import dotenv from 'dotenv'

// Load the .env file into process.env
dotenv.config()

// All settings in one place (the rest of the project imports this file)
const env = {
    // Port the server runs on
    PORT: process.env.PORT || 5000,

    // "development" or "production"
    NODE_ENV: process.env.NODE_ENV || "development",

    // Address of the React frontend.
    // Used for CORS and for the password reset link.
    // The ".replace" removes a slash at the end, if there is one.
    FRONTEND_URL: (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, ""),

    // Login token settings
    JWT: {
        SECRET: process.env.JWT_SECRET,
        REFRESH_SECRET: process.env.REFRESH_SECRET
    },

    // MongoDB settings
    DATABASE: {
        URI: process.env.MONGO_URI
    },

    // Gmail settings used to send emails
    EMAIL:{
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS
    }
}


// List of settings that are missing
const missing = []

// Check every important setting
if (!env.DATABASE.URI) missing.push("MONGO_URI")
if (!env.JWT.SECRET) missing.push("JWT_SECRET")
if (!env.EMAIL.EMAIL_USER) missing.push("EMAIL_USER")
if (!env.EMAIL.EMAIL_PASS) missing.push("EMAIL_PASS")

// Stop the server if something is missing (better than failing later)
if (missing.length > 0) {
    console.log("❌ Missing settings in your .env file:", missing.join(", "))
    process.exit(1)
}

// A short secret is easy to guess
if (env.JWT.SECRET.length < 32) {
    console.log("⚠️  JWT_SECRET is short. Use at least 32 random characters.")
}

export default env
