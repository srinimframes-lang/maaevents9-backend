const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { eventUploadFields } = require("../middleware/upload");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  removeGalleryPhoto,
  setLiveStatus,
} = require("../controllers/eventController");

router.use(protect); // all routes below require admin JWT

router.get("/", getAllEvents);
router.post("/", eventUploadFields, createEvent);
router.get("/:id", getEventById);
router.put("/:id", eventUploadFields, updateEvent);
router.delete("/:id", deleteEvent);
router.delete("/:id/gallery", removeGalleryPhoto);
router.put("/:id/live-status", setLiveStatus);

module.exports = router;
