const mongoose = require("mongoose");

// Each Event document represents one fully self-contained wedding live
// streaming page. The admin fills this out once from the dashboard and the
// public page at /live/[slug] is generated dynamically from this data —
// no code changes are ever required to add a new wedding.

const familyMemberSchema = new mongoose.Schema(
  {
    name: String,
    relation: String, // e.g. "Father of Bride"
    photo: String,
  },
  { _id: false }
);

const blessingSchema = new mongoose.Schema(
  {
    name: String,
    message: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const scheduleItemSchema = new mongoose.Schema(
  {
    time: String,
    title: String,
    description: String,
  },
  { _id: false }
);

const galleryPhotoSchema = new mongoose.Schema(
  {
    url: String,
    publicId: String,
    caption: String,
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    brideName: { type: String, required: true, trim: true },
    groomName: { type: String, required: true, trim: true },
    eventTitle: { type: String, trim: true },
    weddingDate: { type: Date, required: true },
    weddingTime: { type: String, required: true }, // "18:30"
    venue: { type: String, required: true },
    venueMapLink: { type: String }, // Google Maps embed/share link

    youtubeLink: { type: String, required: true }, // full URL or video ID
    youtubeVideoId: { type: String }, // extracted automatically

    coverPhoto: { url: String, publicId: String },
    bridePhoto: { url: String, publicId: String },
    groomPhoto: { url: String, publicId: String },
    galleryPhotos: [galleryPhotoSchema],
    backgroundMusic: { url: String, publicId: String },

    whatsappNumber: { type: String, required: true },
    callNumber: { type: String },

    coupleStory: { type: String },
    familyMembers: [familyMemberSchema],
    schedule: [scheduleItemSchema],
    blessings: [blessingSchema],

    invitationPdf: { url: String, publicId: String },
    giftQrCode: { url: String, publicId: String },
    upiId: { type: String },

    slug: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isLiveOverride: { type: Boolean, default: null }, // manual override of live status
    viewerCountBase: { type: Number, default: 0 }, // simulated base viewers
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

eventSchema.index({ brideName: "text", groomName: "text", venue: "text" });

module.exports = mongoose.model("Event", eventSchema);
