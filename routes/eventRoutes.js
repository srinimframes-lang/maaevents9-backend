const express = require("express");
const { protect } = require("../middleware/auth");
const { uploadEventMedia } = require("../config/cloudinary");
const {
  createEvent,
  getAllEvents,
  getEventById,
  getEventBySlug,
  updateEvent,
  deleteEvent,
  deleteGalleryPhoto,
  addBlessing,
} = require("../controllers/eventController");

const router = express.Router();

const uploadFields = uploadEventMedia.fields([
  { name: "coverPhoto", maxCount: 1 },
  { name: "bridePhoto", maxCount: 1 },
  { name: "groomPhoto", maxCount: 1 },
  { name: "galleryPhotos", maxCount: 50 },
  { name: "backgroundMusic", maxCount: 1 },
]);

// ---- Public routes (consumed by the Next.js live page) ----
router.get("/public/:slug", getEventBySlug);
router.post("/public/:slug/blessings", addBlessing);

// ---- Admin-only routes ----
router.use(protect);
router.get("/", getAllEvents);
router.post("/", uploadFields, createEvent);
router.get("/:id", getEventById);
router.put("/:id", uploadFields, updateEvent);
router.delete("/:id", deleteEvent);
router.delete("/:id/gallery/:publicId", deleteGalleryPhoto);

module.exports = router;
