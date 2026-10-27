// ======================================================
// SEED SCRIPT
// Run it ONCE with:   npm run seed
//
// It creates:
// 1) the starting categories (Money, Passport, Phone...)
// 2) the FIRST ADMIN account
//
// Put these 4 lines in your .env file before running it:
// ADMIN_NAME=Baafin Admin
// ADMIN_EMAIL=youradmin@gmail.com
// ADMIN_PASSWORD=a_strong_password
// ADMIN_PHONE=252610000000
//
// It is safe to run again: it will not create duplicates.
// ======================================================

// Tool that hashes passwords
import bcrypt from "bcrypt";
// Tool that talks to MongoDB
import mongoose from "mongoose";
// Connects to MongoDB (the same file the server uses)
import database from "../config/database.js";
// Database models
import User from "../model/UserModel.js";
import Category from "../model/Category.js";


// Wait until MongoDB is connected
await database;


// The starting categories.
// Add the generic pictures later from the admin category routes
// (never use pictures of real documents).
const categories = [
  { name: "Money", slug: "money" },
  { name: "Passport", slug: "passport" },
  { name: "ID Card", slug: "id-card" },
  { name: "Phone", slug: "phone" },
  { name: "Wallet", slug: "wallet" },
  { name: "Watch", slug: "watch" },
  { name: "Keys", slug: "keys" },
  { name: "Bag", slug: "bag" },
  { name: "Laptop", slug: "laptop" },
  { name: "Documents", slug: "documents" },
  { name: "Human", slug: "human" },
  { name: "Other", slug: "other" },
];


// Create the categories that do not exist yet
for (const item of categories) {

  // Does a category with this name or slug exist?
  const exists = await Category.findOne({
    $or: [
      { name: item.name },
      { slug: item.slug },
    ],
  });

  // Yes: skip it
  if (exists) {
    console.log(`➖ Category already exists: ${item.name}`);
    continue;
  }

  // No: create it
  await Category.create({
    name: item.name,
    slug: item.slug,
    image: "",
    isActive: true,
  });

  console.log(`✅ Category created: ${item.name}`);
}


// Read the admin settings from the .env file
const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "";

// Stop here if the admin settings are missing
if (!adminEmail || !adminPassword) {
  console.log("⚠️  ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env. Admin not created.");
} else {

  // Does a user with this email exist?
  const existingUser = await User.findOne({ email: adminEmail });

  if (existingUser) {

    // Yes: make this user an admin (the password is not changed)
    existingUser.role = "admin";
    existingUser.isVerified = true;
    existingUser.isActive = true;

    await existingUser.save();

    console.log(`✅ This user is now an admin: ${adminEmail}`);

  } else {

    // No: create a new admin
    await User.create({
      name: process.env.ADMIN_NAME || "Baafin Admin",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      phone: process.env.ADMIN_PHONE || "252610000000",
      role: "admin",
      isVerified: true,
      isActive: true,
    });

    console.log("✅ Admin created");
  }
}


// Close the database connection so the script can finish
await mongoose.disconnect();

console.log("🎉 Seeding finished");
