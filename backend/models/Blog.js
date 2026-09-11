// models/Blog.js
const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    metaTitle: {
      type: String,
      required: true,
      trim: true,
    },

    metaDescription: {
      type: String,
      required: true,
      trim: true,
    },

    metaKeywords: {
      type: [String],
      required: true,
      default: [],
    },

    content: {
      type: String,
      required: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["published", "draft"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Blog", BlogSchema);
