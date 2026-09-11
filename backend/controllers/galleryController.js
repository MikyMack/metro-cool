const Gallery = require("../models/Gallery");
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
    console.error("Delete gallery image error:", error);
  }
}

// ============================================================
// CREATE GALLERY ITEM
// ============================================================

const createGallery = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const { title, alt_text, sort_order, is_active } = req.body;

    // Image is required
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Gallery image is required.",
      });
    }

    uploadedFilePath = req.file.path;

    const gallery = await Gallery.create({
      title: title || "",
      image: `/uploads/${req.file.filename}`,
      alt_text: alt_text || "",
      sort_order:
        sort_order !== undefined && sort_order !== "" ? Number(sort_order) : 0,
      is_active:
        is_active === undefined
          ? true
          : is_active === true || is_active === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Gallery item created successfully.",
      gallery,
    });
  } catch (error) {
    console.error("Create gallery error:", error);

    // Delete uploaded image if DB operation fails
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (deleteError) {
        console.error("Failed to delete uploaded file:", deleteError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create gallery item.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL GALLERY ITEMS
// ============================================================

const getAllGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({
      sort_order: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: gallery.length,
      gallery,
    });
  } catch (error) {
    console.error("Get gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch gallery items.",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE GALLERY ITEM
// ============================================================

const getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      gallery,
    });
  } catch (error) {
    console.error("Get gallery item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch gallery item.",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE GALLERY ITEM
// ============================================================

const updateGallery = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      if (req.file) {
        uploadedFilePath = req.file.path;
      }

      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    const oldImage = gallery.image;

    const { title, alt_text, sort_order, is_active } = req.body;

    // Update text fields
    if (title !== undefined) {
      gallery.title = title;
    }

    if (alt_text !== undefined) {
      gallery.alt_text = alt_text;
    }

    // Update sort order
    if (sort_order !== undefined && sort_order !== "") {
      const parsedSortOrder = Number(sort_order);

      if (Number.isNaN(parsedSortOrder)) {
        return res.status(400).json({
          success: false,
          message: "Sort order must be a valid number.",
        });
      }

      gallery.sort_order = parsedSortOrder;
    }

    // Update active status
    if (is_active !== undefined) {
      gallery.is_active = is_active === true || is_active === "true";
    }

    // --------------------------------------------------------
    // New image uploaded
    // --------------------------------------------------------

    if (req.file) {
      uploadedFilePath = req.file.path;

      gallery.image = `/uploads/${req.file.filename}`;

      await gallery.save();

      // Delete old image only after successful save
      if (oldImage) {
        deleteImageFile(oldImage);
      }
    } else {
      // Keep existing image
      await gallery.save();
    }

    return res.status(200).json({
      success: true,
      message: "Gallery item updated successfully.",
      gallery,
    });
  } catch (error) {
    console.error("Update gallery error:", error);

    // Delete newly uploaded image if update fails
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (deleteError) {
        console.error("Failed to delete uploaded file:", deleteError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update gallery item.",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE GALLERY ITEM
// ============================================================

const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    const imagePath = gallery.image;

    // Delete database record
    await Gallery.findByIdAndDelete(req.params.id);

    // Delete image from uploads folder
    if (imagePath) {
      deleteImageFile(imagePath);
    }

    return res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete gallery item.",
      error: error.message,
    });
  }
};

// ============================================================
// TOGGLE GALLERY STATUS
// ============================================================

const toggleGalleryStatus = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    gallery.is_active = !gallery.is_active;

    await gallery.save();

    return res.status(200).json({
      success: true,
      message: gallery.is_active
        ? "Gallery item activated successfully."
        : "Gallery item deactivated successfully.",
      is_active: gallery.is_active,
    });
  } catch (error) {
    console.error("Toggle gallery status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update gallery status.",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE SORT ORDER
// ============================================================

const updateGallerySortOrder = async (req, res) => {
  try {
    const { sort_order } = req.body;

    const parsedSortOrder = Number(sort_order);

    if (Number.isNaN(parsedSortOrder)) {
      return res.status(400).json({
        success: false,
        message: "Sort order must be a valid number.",
      });
    }

    const gallery = await Gallery.findByIdAndUpdate(
      req.params.id,
      {
        sort_order: parsedSortOrder,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Gallery order updated successfully.",
      gallery,
    });
  } catch (error) {
    console.error("Update gallery sort order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update gallery order.",
      error: error.message,
    });
  }
};

module.exports = {
  createGallery,
  getAllGallery,
  getGalleryById,
  updateGallery,
  deleteGallery,
  toggleGalleryStatus,
  updateGallerySortOrder,
};
