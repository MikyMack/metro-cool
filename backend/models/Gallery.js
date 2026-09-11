const mongoose = require("mongoose");


const GallerySchema = new mongoose.Schema(

  {
    title: String,
    image: { type: String, required: true },
    alt_text: String,
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Gallery", GallerySchema);
