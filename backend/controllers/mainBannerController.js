const MainBanner = require("../models/MainBanner");
const fs = require("fs");
const path = require("path");

// ========================================
// CREATE MAIN BANNER
// ========================================

const createMainBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      link,
      isActive,
    } = req.body;

    // ====================================
    // VALIDATE IMAGE
    // ====================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required.",
      });
    }

    // ====================================
    // CREATE BANNER
    // ====================================

    const banner = await MainBanner.create({
      title: title?.trim(),
      subtitle: subtitle?.trim(),
      description: description?.trim(),
      image: `/uploads/${req.file.filename}`,
      link: link?.trim(),
      isActive:
        isActive === undefined
          ? true
          : isActive === "true" || isActive === true,
    });

    res.status(201).json({
      success: true,
      message: "Main banner created successfully.",
      banner,
    });
  } catch (error) {
    console.error("Create main banner error:", error);

    // Remove uploaded file if database save fails
    if (req.file) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        req.file.filename
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create main banner.",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL MAIN BANNERS
// ========================================

const getAllMainBanners = async (req, res) => {
  try {
    const banners = await MainBanner.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("Get main banners error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch main banners.",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE MAIN BANNER
// ========================================

const getMainBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner =
      await MainBanner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Main banner not found.",
      });
    }

    res.status(200).json({
      success: true,
      banner,
    });
  } catch (error) {
    console.error(
      "Get main banner error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch main banner.",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE MAIN BANNER
// ========================================

const updateMainBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner =
      await MainBanner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Main banner not found.",
      });
    }

    // ====================================
    // UPDATE TEXT FIELDS
    // ====================================

    if (req.body.title !== undefined) {
      banner.title =
        req.body.title.trim();
    }

    if (req.body.subtitle !== undefined) {
      banner.subtitle =
        req.body.subtitle.trim();
    }

    if (req.body.description !== undefined) {
      banner.description =
        req.body.description.trim();
    }

    if (req.body.link !== undefined) {
      banner.link =
        req.body.link.trim();
    }

    if (req.body.isActive !== undefined) {
      banner.isActive =
        req.body.isActive === "true" ||
        req.body.isActive === true;
    }

    // ====================================
    // REPLACE IMAGE IF NEW IMAGE PROVIDED
    // ====================================

    if (req.file) {
      const oldImage =
        banner.image;

      banner.image =
        `/uploads/${req.file.filename}`;

      await banner.save();

      // Delete old image after successful save
      if (oldImage) {
        deleteImageFile(oldImage);
      }
    } else {
      await banner.save();
    }

    res.status(200).json({
      success: true,
      message: "Main banner updated successfully.",
      banner,
    });
  } catch (error) {
    console.error(
      "Update main banner error:",
      error
    );

    // If a new image was uploaded but update failed,
    // remove the new image
    if (req.file) {
      const newFilePath = path.join(
        __dirname,
        "..",
        "uploads",
        req.file.filename
      );

      if (fs.existsSync(newFilePath)) {
        fs.unlinkSync(newFilePath);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to update main banner.",
      error: error.message,
    });
  }
};

// ========================================
// DELETE MAIN BANNER
// ========================================

const deleteMainBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner =
      await MainBanner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Main banner not found.",
      });
    }

    const image =
      banner.image;

    await MainBanner.findByIdAndDelete(id);

    // Delete image from uploads folder
    if (image) {
      deleteImageFile(image);
    }

    res.status(200).json({
      success: true,
      message: "Main banner deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete main banner error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete main banner.",
      error: error.message,
    });
  }
};

// ========================================
// TOGGLE ACTIVE STATUS
// ========================================

const toggleMainBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner =
      await MainBanner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Main banner not found.",
      });
    }

    banner.isActive =
      !banner.isActive;

    await banner.save();

    res.status(200).json({
      success: true,
      message: banner.isActive
        ? "Main banner activated successfully."
        : "Main banner deactivated successfully.",
      isActive: banner.isActive,
    });
  } catch (error) {
    console.error(
      "Toggle main banner status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update banner status.",
      error: error.message,
    });
  }
};

// ========================================
// DELETE IMAGE HELPER
// ========================================

function deleteImageFile(imagePath) {
  try {
    const cleanPath =
      imagePath.replace(/^[/\\]+/, "");

    const filePath =
      path.join(
        __dirname,
        "..",
        cleanPath
      );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "Delete image file error:",
      error
    );
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  createMainBanner,
  getAllMainBanners,
  getMainBannerById,
  updateMainBanner,
  deleteMainBanner,
  toggleMainBannerStatus,
};