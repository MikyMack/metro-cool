const multer = require("multer");
const path = require("path");

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/[^a-z0-9\-\.]+/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    const baseName = path.basename(file.originalname, ext);

    const slugified = slugify(baseName);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const seoName = `${slugified}-${uniqueSuffix}${ext}`;

    cb(null, seoName);
  },
});

const upload = multer({
  storage,
});

module.exports = upload;
