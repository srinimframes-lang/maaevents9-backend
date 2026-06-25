const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again later." },
});

router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);

module.exports = router;
