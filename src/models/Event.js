const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, required: true }, // e.g. "Father of Bride"
    photo: { type: String, default: "" },
  },
  { _id: false }
);

const blessingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const scheduleItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Mehendi", "Sangeet", "Wedding Ceremony"
    date: { type: String },
    time: { type: String },
    venue: { type: String },
  },
  { _id: false }
);

const gallerySchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    // Core
    brideName: { type: String, required: true, trim: true },
    groomName: { type: String, required: true, trim: true },
    eventTitle: { type: String, trim: true },
    weddingDate: { type: String, required: true }, // ISO date string e.g. 2026-12-04
    weddingTime: { type: String, required: true }, // e.g. 18:30
    venue: { type: String, required: true },
    venueMapEmbedUrl: { type: String, default: "" }, // Google Maps embed iframe src
    venueMapLink: { type: String, default: "" }, // plain Google Maps link

    // Streaming
    youtubeEmbedUrl: { type: String, required: true },
    youtubeVideoId: { type: String }, // parsed automatically
    isLive: { type: Boolean, default: false },
    streamStatus: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
    },

    // Media
    coverPhoto: { type: String, default: "" },
    bridePhoto: { type: String, default: "" },
    groomPhoto: { type: String, default: "" },
    gallery: [gallerySchema],
    backgroundMusic: { type: String, default: "" },
    weddingLogo: { type: String, default: "" },
    photographyLogo: { type: String, default: "" },
    invitationFile: { type: String, default: "" }, // downloadable invite (image/pdf)

    // Contact
    whatsappNumber: { type: String, required: true },
    contactPhone: { type: String, default: "" },

    // Content sections
    coupleStory: { type: String, default: "" },
    familyMembers: [familyMemberSchema],
    blessings: [blessingSchema],
    schedule: [scheduleItemSchema],

    // Gift / QR
    giftQrImage: { type: String, default: "" },
    giftUpiId: { type: String, default: "" },
    giftNote: { type: String, default: "" },

    // SEO / sharing
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    metaDescription: { type: String, default: "" },

    // Stats
    viewerCount: { type: Number, default: 0 },

    // Publishing
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

eventSchema.index({ slug: 1 });

module.exports = mongoose.model("Event", eventSchema);
