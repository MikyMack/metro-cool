const Testimonial = require("../models/Testimonial");
const fs = require("fs");
const path = require("path");

// ============================================================
// DELETE IMAGE FILE
// ============================================================

function deleteImageFile(imagePath) {
  try {
    if (!imagePath) return;

    const cleanPath = imagePath.replace(/^[\/\\]+/, "");

    const filePath = path.join(__dirname, "..", cleanPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Delete testimonial image error:", error);
  }
}

// ============================================================
// CREATE TESTIMONIAL
// ============================================================

const createTestimonial = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const { name, designation, content, isActive, rating } = req.body;

    // --------------------------------------------------------
    // Validate required fields
    // --------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Testimonial content is required.",
      });
    }

    // --------------------------------------------------------
    // Validate rating
    // --------------------------------------------------------

    let parsedRating;

    if (rating !== undefined && rating !== null && rating !== "") {
      parsedRating = Number(rating);

      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5.",
        });
      }
    }

    // --------------------------------------------------------
    // Uploaded image
    // --------------------------------------------------------

    if (req.file) {
      uploadedFilePath = req.file.path;
    }

    // --------------------------------------------------------
    // Create testimonial
    // --------------------------------------------------------

    const testimonial = await Testimonial.create({
      name: name.trim(),

      designation: designation?.trim() || "",

      content: content.trim(),

      imageUrl: req.file ? `/uploads/${req.file.filename}` : "",

      cloudinary_id: "",

      isActive:
        isActive === undefined
          ? true
          : isActive === true || isActive === "true",

      ...(parsedRating !== undefined && {
        rating: parsedRating,
      }),
    });

    return res.status(201).json({
      success: true,
      message: "Testimonial created successfully.",
      testimonial,
    });
  } catch (error) {
    console.error("Create testimonial error:", error);

    // --------------------------------------------------------
    // Delete uploaded image if DB creation failed
    // --------------------------------------------------------

    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create testimonial.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL TESTIMONIALS
// ============================================================

const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: testimonials.length,
      testimonials,
    });
  } catch (error) {
    console.error("Get testimonials error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch testimonials.",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE TESTIMONIAL
// ============================================================

const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found.",
      });
    }

    return res.status(200).json({
      success: true,
      testimonial,
    });
  } catch (error) {
    console.error("Get testimonial error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch testimonial.",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE TESTIMONIAL
// ============================================================

const updateTestimonial = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found.",
      });
    }

    // --------------------------------------------------------
    // Keep old image for cleanup
    // --------------------------------------------------------

    const oldImage = testimonial.imageUrl;

    // --------------------------------------------------------
    // Get request data
    // --------------------------------------------------------

    const { name, designation, content, isActive, rating } = req.body;

    // --------------------------------------------------------
    // Validate required fields
    // --------------------------------------------------------

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (content !== undefined && !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Testimonial content is required.",
      });
    }

    // --------------------------------------------------------
    // Validate rating
    // --------------------------------------------------------

    let parsedRating;

    if (rating !== undefined && rating !== null && rating !== "") {
      parsedRating = Number(rating);

      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5.",
        });
      }
    }

    // --------------------------------------------------------
    // Update fields
    // --------------------------------------------------------

    if (name !== undefined) {
      testimonial.name = name.trim();
    }

    if (designation !== undefined) {
      testimonial.designation = designation.trim();
    }

    if (content !== undefined) {
      testimonial.content = content.trim();
    }

    if (isActive !== undefined) {
      testimonial.isActive = isActive === true || isActive === "true";
    }

    if (parsedRating !== undefined) {
      testimonial.rating = parsedRating;
    }

    // --------------------------------------------------------
    // New image uploaded
    // --------------------------------------------------------

    if (req.file) {
      uploadedFilePath = req.file.path;

      testimonial.imageUrl = `/uploads/${req.file.filename}`;

      // Local upload setup
      testimonial.cloudinary_id = "";
    }

    // --------------------------------------------------------
    // Save changes
    // --------------------------------------------------------

    await testimonial.save();

    // --------------------------------------------------------
    // Delete old image AFTER successful save
    // --------------------------------------------------------

    if (req.file && oldImage) {
      deleteImageFile(oldImage);
    }

    return res.status(200).json({
      success: true,
      message: "Testimonial updated successfully.",
      testimonial,
    });
  } catch (error) {
    console.error("Update testimonial error:", error);

    // --------------------------------------------------------
    // Delete newly uploaded image if update failed
    // --------------------------------------------------------

    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update testimonial.",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE TESTIMONIAL
// ============================================================

const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found.",
      });
    }

    const imagePath = testimonial.imageUrl;

    await Testimonial.findByIdAndDelete(req.params.id);

    // Delete image after DB deletion
    if (imagePath) {
      deleteImageFile(imagePath);
    }

    return res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    console.error("Delete testimonial error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete testimonial.",
      error: error.message,
    });
  }
};

// ============================================================
// TOGGLE TESTIMONIAL STATUS
// ============================================================

const toggleTestimonialStatus = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found.",
      });
    }

    testimonial.isActive = !testimonial.isActive;

    await testimonial.save();

    return res.status(200).json({
      success: true,

      message: testimonial.isActive
        ? "Testimonial activated successfully."
        : "Testimonial deactivated successfully.",

      isActive: testimonial.isActive,
    });
  } catch (error) {
    console.error("Toggle testimonial status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update testimonial status.",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialStatus,
};
