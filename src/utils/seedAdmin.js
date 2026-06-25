/**
 * Run once to create the first super admin account:
 *   npm run seed:admin
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.ADMIN_EMAIL || "admin@maaevents9.com").toLowerCase();
    const existing = await Admin.findOne({ email });

    if (existing) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }

    const admin = await Admin.create({
      name: process.env.ADMIN_NAME || "Super Admin",
      email,
      password: process.env.ADMIN_PASSWORD || "ChangeMe@12345",
      role: "superadmin",
    });

    console.log("✅ Admin created successfully:");
    console.log(`   Email: ${admin.email}`);
    console.log("   Password: (the one set in .env ADMIN_PASSWORD)");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
})();
