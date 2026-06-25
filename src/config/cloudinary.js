const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generic storage factory — routes resource_type by field/folder
const makeStorage = (folder, resourceType = "image") =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `maaevents9/${folder}`,
      resource_type: resourceType,
      allowed_formats:
        resourceType === "video"
          ? ["mp3", "wav", "m4a", "ogg"]
          : ["jpg", "jpeg", "png", "webp"],
      transformation:
        resourceType === "image" ? [{ quality: "auto", fetch_format: "auto" }] : undefined,
    },
  });

// Single multer instance handling mixed fields; folder decided per-field in controller via separate uploaders
const imageUpload = multer({ storage: makeStorage("photos", "image") });
const audioUpload = multer({ storage: makeStorage("music", "video") }); // cloudinary treats audio under "video" resource_type

module.exports = { cloudinary, imageUpload, audioUpload };
