import "dotenv/config";
import { connectDB } from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/User.js";

// Production-ready seed: Only creates admin user
// This is safe to run multiple times - won't create duplicate admins
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";

async function run() {
  try {
    await connectDB();
    console.log("[seed] 🔗 Connected to MongoDB");

    // Admin user: created only if it doesn't already exist
    // Using `.create()` (not insertMany) so the pre("save") bcrypt-hash hook
    // on the User model actually runs and hashes the password
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    
    if (existingAdmin) {
      console.log(`[seed] ✅ Admin user already exists (${ADMIN_EMAIL})`);
      console.log("[seed] ℹ️  No action taken — existing admin left untouched");
    } else {
      await User.create({ 
        name: ADMIN_NAME, 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD, 
        role: "admin" 
      });
      console.log(`[seed] ✅ Admin user created successfully!`);
      console.log(`[seed] 📧 Email: ${ADMIN_EMAIL}`);
      console.log(`[seed] 🔐 Password: ${ADMIN_PASSWORD}`);
      console.log("[seed] ⚠️  Change this password immediately after first login!");
    }

    console.log("[seed] ✨ Seed completed successfully");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[seed] ❌ Failed:", err.message);
    process.exit(1);
  }
}

run();
