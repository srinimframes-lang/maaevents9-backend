const slugify = require("slugify");
const Event = require("../models/Event");

// ---------- helpers ----------
const extractYouTubeId = (url = "") => {
  if (!url) return "";
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return "";
};

const buildEmbedUrl = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`;

const generateUniqueSlug = async (brideName, groomName, excludeId = null) => {
  const base = slugify(`${groomName}-${brideName}`, { lower: true, strict: true });
  let slug = base;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Event.findOne(query);
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

const parseJSONField = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// ---------- ADMIN: create event ----------
// POST /api/events
exports.createEvent = async (req, res, next) => {
  try {
    const body = req.body;
    const files = req.files || {};

    const videoId = extractYouTubeId(body.youtubeEmbedUrl);
    const slug = await generateUniqueSlug(body.brideName, body.groomName);

    const fileUrl = (field) => (files[field] && files[field][0] ? files[field][0].path : "");

    const galleryUrls = (files.gallery || []).map((f) => ({ url: f.path, caption: "" }));

    const event = await Event.create({
      brideName: body.brideName,
      groomName: body.groomName,
      eventTitle: body.eventTitle || `${body.groomName} & ${body.brideName} Wedding`,
      weddingDate: body.weddingDate,
      weddingTime: body.weddingTime,
      venue: body.venue,
      venueMapEmbedUrl: body.venueMapEmbedUrl || "",
      venueMapLink: body.venueMapLink || "",
      youtubeEmbedUrl: videoId ? buildEmbedUrl(videoId) : body.youtubeEmbedUrl,
      youtubeVideoId: videoId,
      coverPhoto: fileUrl("coverPhoto"),
      bridePhoto: fileUrl("bridePhoto"),
      groomPhoto: fileUrl("groomPhoto"),
      gallery: galleryUrls,
      backgroundMusic: fileUrl("backgroundMusic"),
      weddingLogo: fileUrl("weddingLogo"),
      photographyLogo: fileUrl("photographyLogo"),
      invitationFile: fileUrl("invitationFile"),
      whatsappNumber: body.whatsappNumber,
      contactPhone: body.contactPhone || body.whatsappNumber,
      coupleStory: body.coupleStory || "",
      familyMembers: parseJSONField(body.familyMembers, []),
      schedule: parseJSONField(body.schedule, []),
      giftQrImage: fileUrl("giftQrImage"),
      giftUpiId: body.giftUpiId || "",
      giftNote: body.giftNote || "",
      metaDescription:
        body.metaDescription ||
        `Watch ${body.groomName} & ${body.brideName}'s wedding live streaming.`,
      slug,
      createdBy: req.admin._id,
    });

    res.status(201).json({
      success: true,
      message: "Event published successfully",
      event,
      liveUrl: `/live/${event.slug}`,
    });
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: list all events ----------
// GET /api/events
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ success: true, count: events.length, events });
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: get single event for editing ----------
// GET /api/events/:id
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: update event ----------
// PUT /api/events/:id
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const body = req.body;
    const files = req.files || {};
    const fileUrl = (field) => (files[field] && files[field][0] ? files[field][0].path : null);

    // Regenerate slug only if names changed
    if (
      (body.brideName && body.brideName !== event.brideName) ||
      (body.groomName && body.groomName !== event.groomName)
    ) {
      event.slug = await generateUniqueSlug(
        body.brideName || event.brideName,
        body.groomName || event.groomName,
        event._id
      );
    }

    const simpleFields = [
      "brideName",
      "groomName",
      "eventTitle",
      "weddingDate",
      "weddingTime",
      "venue",
      "venueMapEmbedUrl",
      "venueMapLink",
      "whatsappNumber",
      "contactPhone",
      "coupleStory",
      "giftUpiId",
      "giftNote",
      "metaDescription",
    ];
    simpleFields.forEach((f) => {
      if (body[f] !== undefined) event[f] = body[f];
    });

    if (body.youtubeEmbedUrl) {
      const videoId = extractYouTubeId(body.youtubeEmbedUrl);
      event.youtubeEmbedUrl = videoId ? buildEmbedUrl(videoId) : body.youtubeEmbedUrl;
      event.youtubeVideoId = videoId;
    }

    if (body.familyMembers !== undefined) event.familyMembers = parseJSONField(body.familyMembers, event.familyMembers);
    if (body.schedule !== undefined) event.schedule = parseJSONField(body.schedule, event.schedule);
    if (body.streamStatus) event.streamStatus = body.streamStatus;
    if (body.isPublished !== undefined) event.isPublished = body.isPublished === "true" || body.isPublished === true;

    [
      "coverPhoto",
      "bridePhoto",
      "groomPhoto",
      "backgroundMusic",
      "weddingLogo",
      "photographyLogo",
      "invitationFile",
      "giftQrImage",
    ].forEach((field) => {
      const url = fileUrl(field);
      if (url) event[field] = url;
    });

    if (files.gallery && files.gallery.length) {
      const newGallery = files.gallery.map((f) => ({ url: f.path, caption: "" }));
      event.gallery = [...event.gallery, ...newGallery];
    }

    await event.save();
    res.json({ success: true, message: "Event updated successfully", event });
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: delete event ----------
// DELETE /api/events/:id
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: remove single gallery photo ----------
// DELETE /api/events/:id/gallery
exports.removeGalleryPhoto = async (req, res, next) => {
  try {
    const { url } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    event.gallery = event.gallery.filter((g) => g.url !== url);
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: toggle live status ----------
// PUT /api/events/:id/live-status
exports.setLiveStatus = async (req, res, next) => {
  try {
    const { streamStatus } = req.body; // scheduled | live | ended
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { streamStatus, isLive: streamStatus === "live" },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// ---------- PUBLIC: get event by slug ----------
// GET /api/public/events/:slug
exports.getPublicEventBySlug = async (req, res, next) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, isPublished: true });
    if (!event) return res.status(404).json({ success: false, message: "Wedding page not found" });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// ---------- PUBLIC: increment / get viewer count (simple counter) ----------
// POST /api/public/events/:slug/view
exports.incrementViewer = async (req, res, next) => {
  try {
    const event = await Event.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { viewerCount: 1 } },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, viewerCount: event.viewerCount });
  } catch (err) {
    next(err);
  }
};

// ---------- PUBLIC: post a blessing ----------
// POST /api/public/events/:slug/blessings
exports.addBlessing = async (req, res, next) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ success: false, message: "Name and message are required" });
    }
    const event = await Event.findOneAndUpdate(
      { slug: req.params.slug },
      { $push: { blessings: { name, message, createdAt: new Date() } } },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, blessings: event.blessings });
  } catch (err) {
    next(err);
  }
};
