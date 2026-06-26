require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

connectDB();const Admin = require("./models/Admin");
setTimeout(async () => {
  try {
    const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existing) {
      await Admin.create({
        name: "Super Admin",
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      });
      console.log("✅ Admin auto-created:", process.env.ADMIN_EMAIL);
    } else {
      console.log("Admin already exists");
    }
  } catch (err) {
    console.log("Admin seed error:", err.message);
  }
}, 3000);

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => res.json({ success: true, message: "MaaEvents9 API is live" }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
