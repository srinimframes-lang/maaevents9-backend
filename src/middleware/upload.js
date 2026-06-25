const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

// Single combined storage: decides folder/resource_type based on field name
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isAudio = file.fieldname === "backgroundMusic";
    return {
      folder: `maaevents9/${isAudio ? "music" : "photos"}`,
      resource_type: isAudio ? "video" : "image", // cloudinary stores audio under "video"
      allowed_formats: isAudio
        ? ["mp3", "wav", "m4a", "ogg"]
        : ["jpg", "jpeg", "png", "webp"],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
});

// Fields used across create/update event forms
const eventUploadFields = upload.fields([
  { name: "coverPhoto", maxCount: 1 },
  { name: "bridePhoto", maxCount: 1 },
  { name: "groomPhoto", maxCount: 1 },
  { name: "gallery", maxCount: 100 },
  { name: "backgroundMusic", maxCount: 1 },
  { name: "weddingLogo", maxCount: 1 },
  { name: "photographyLogo", maxCount: 1 },
  { name: "invitationFile", maxCount: 1 },
  { name: "giftQrImage", maxCount: 1 },
]);

module.exports = { eventUploadFields };
