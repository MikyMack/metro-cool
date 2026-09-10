const mongoose = require("mongoose");

const TestimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    designation: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: [true, "Testimonial content is required"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    cloudinary_id: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Testimonial", TestimonialSchema);
