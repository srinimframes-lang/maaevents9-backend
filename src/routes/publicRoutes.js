const express = require("express");
const router = express.Router();
const {
  getPublicEventBySlug,
  incrementViewer,
  addBlessing,
} = require("../controllers/eventController");

router.get("/events/:slug", getPublicEventBySlug);
router.post("/events/:slug/view", incrementViewer);
router.post("/events/:slug/blessings", addBlessing);

module.exports = router;
