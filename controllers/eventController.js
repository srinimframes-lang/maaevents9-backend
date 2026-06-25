const slugify = require("slugify");
const Event = require("../models/Event");
const { extractYouTubeId } = require("../utils/youtube");
const { cloudinary } = require("../config/cloudinary");

// Builds a unique slug like "srinivas-mounika", appending -2, -3... on collision.
async function buildUniqueSlug(brideName, groomName) {
  const base = slugify(`${groomName}-${brideName}`, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Event.exists({ slug })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }
  return slug;
}

const fileField = (file) => (file ? { url: file.path, publicId: file.filename } : undefined);

// POST /api/events  (Admin only)
exports.createEvent = async (req, res, next) => {
  try {
    const body = req.body;
    const files = req.files || {};

    const slug = await buildUniqueSlug(body.groomName, body.brideName);
    const youtubeVideoId = extractYouTubeId(body.youtubeLink);

    const galleryPhotos = (files.galleryPhotos || []).map((f) => ({
      url: f.path,
      publicId: f.filename,
    }));

    const event = await Event.create({
      brideName: body.brideName,
      groomName: body.groomName,
      eventTitle: body.eventTitle,
      weddingDate: body.weddingDate,
      weddingTime: body.weddingTime,
      venue: body.venue,
      venueMapLink: body.venueMapLink,
      youtubeLink: body.youtubeLink,
      youtubeVideoId,
      coverPhoto: fileField(files.coverPhoto?.[0]),
      bridePhoto: fileField(files.bridePhoto?.[0]),
      groomPhoto: fileField(files.groomPhoto?.[0]),
      galleryPhotos,
      backgroundMusic: fileField(files.backgroundMusic?.[0]),
      whatsappNumber: body.whatsappNumber,
      callNumber: body.callNumber,
      coupleStory: body.coupleStory,
      familyMembers: body.familyMembers ? JSON.parse(body.familyMembers) : [],
      schedule: body.schedule ? JSON.parse(body.schedule) : [],
      upiId: body.upiId,
      slug,
      status: body.status || "published",
      createdBy: req.admin._id,
    });

    res.status(201).json({
      success: true,
      event,
      liveUrl: `${process.env.FRONTEND_URL}/live/${event.slug}`,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/events  (Admin only - dashboard list)
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ success: true, count: events.length, events });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id (Admin only - for edit form)
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/public/:slug  (Public - powers the live page)
exports.getEventBySlug = async (req, res, next) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, status: "published" });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// PUT /api/events/:id  (Admin only)
exports.updateEvent = async (req, res, next) => {
  try {
    const body = req.body;
    const files = req.files || {};
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const updatable = [
      "brideName", "groomName", "eventTitle", "weddingDate", "weddingTime",
      "venue", "venueMapLink", "youtubeLink", "whatsappNumber", "callNumber",
      "coupleStory", "upiId", "status",
    ];
    updatable.forEach((field) => {
      if (body[field] !== undefined) event[field] = body[field];
    });

    if (body.youtubeLink) event.youtubeVideoId = extractYouTubeId(body.youtubeLink);
    if (body.familyMembers) event.familyMembers = JSON.parse(body.familyMembers);
    if (body.schedule) event.schedule = JSON.parse(body.schedule);

    if (files.coverPhoto?.[0]) event.coverPhoto = fileField(files.coverPhoto[0]);
    if (files.bridePhoto?.[0]) event.bridePhoto = fileField(files.bridePhoto[0]);
    if (files.groomPhoto?.[0]) event.groomPhoto = fileField(files.groomPhoto[0]);
    if (files.backgroundMusic?.[0]) event.backgroundMusic = fileField(files.backgroundMusic[0]);
    if (files.galleryPhotos?.length) {
      const newPhotos = files.galleryPhotos.map((f) => ({ url: f.path, publicId: f.filename }));
      event.galleryPhotos = [...event.galleryPhotos, ...newPhotos];
    }

    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id  (Admin only)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Clean up Cloudinary assets so storage doesn't accumulate orphaned files.
    const allPublicIds = [
      event.coverPhoto?.publicId,
      event.bridePhoto?.publicId,
      event.groomPhoto?.publicId,
      event.backgroundMusic?.publicId,
      ...event.galleryPhotos.map((p) => p.publicId),
    ].filter(Boolean);

    await Promise.all(
      allPublicIds.map((id) =>
        cloudinary.uploader.destroy(id).catch(() => null)
      )
    );

    await event.deleteOne();
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id/gallery/:publicId  (Admin only - remove single photo)
exports.deleteGalleryPhoto = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    event.galleryPhotos = event.galleryPhotos.filter(
      (p) => p.publicId !== req.params.publicId
    );
    await cloudinary.uploader.destroy(req.params.publicId).catch(() => null);
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// POST /api/events/public/:slug/blessings  (Public - guests leave a blessing)
exports.addBlessing = async (req, res, next) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ success: false, message: "Name and message required" });
    }
    const event = await Event.findOneAndUpdate(
      { slug: req.params.slug },
      { $push: { blessings: { name, message } } },
      { new: true }
    );
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, blessings: event.blessings });
  } catch (err) {
    next(err);
  }
};
