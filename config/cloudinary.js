const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generic storage factory so we can route different uploads (cover, bride,
// groom, gallery, music) into organized Cloudinary folders.
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

const uploadEventMedia = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      let folder = "maaevents9/misc";
      let resource_type = "image";
      if (file.fieldname === "coverPhoto") folder = "maaevents9/cover";
      if (file.fieldname === "bridePhoto") folder = "maaevents9/bride";
      if (file.fieldname === "groomPhoto") folder = "maaevents9/groom";
      if (file.fieldname === "galleryPhotos") folder = "maaevents9/gallery";
      if (file.fieldname === "backgroundMusic") {
        folder = "maaevents9/music";
        resource_type = "video"; // cloudinary stores audio under 'video' resource type
      }
      return {
        folder,
        resource_type,
        allowed_formats:
          resource_type === "video"
            ? ["mp3", "wav", "m4a", "ogg"]
            : ["jpg", "jpeg", "png", "webp"],
      };
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
});

module.exports = { cloudinary, uploadEventMedia, makeStorage };
