const MobileBanner = require("../models/MobileBanner");
const fs = require("fs");
const path = require("path");

// Delete image file from uploads folder
function deleteImageFile(imagePath) {
  try {
    if (!imagePath) return;

    const cleanPath = imagePath.replace(/^[\/\\]+/, "");
    const filePath = path.join(__dirname, "..", cleanPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Delete mobile banner image error:", error);
  }
}

// CREATE MOBILE BANNER
const createMobileBanner = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const { title, subtitle, description, link, isActive } = req.body;

    // Image is required when creating
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Mobile banner image is required.",
      });
    }

    uploadedFilePath = req.file.path;

    const mobileBanner = await MobileBanner.create({
      title: title || "",
      subtitle: subtitle || "",
      description: description || "",
      link: link || "",
      image: `/uploads/${req.file.filename}`,
      isActive:
        isActive === undefined
          ? true
          : isActive === true || isActive === "true",
    });

    res.status(201).json({
      success: true,
      message: "Mobile banner created successfully.",
      banner: mobileBanner,
    });
  } catch (error) {
    console.error("Create mobile banner error:", error);

    // Delete uploaded image if database operation fails
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (deleteError) {
        console.error("Failed to delete uploaded file:", deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to create mobile banner.",
      error: error.message,
    });
  }
};

// GET ALL MOBILE BANNERS
const getAllMobileBanners = async (req, res) => {
  try {
    const banners = await MobileBanner.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("Get mobile banners error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch mobile banners.",
      error: error.message,
    });
  }
};

// GET SINGLE MOBILE BANNER
const getMobileBannerById = async (req, res) => {
  try {
    const banner = await MobileBanner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Mobile banner not found.",
      });
    }

    res.status(200).json({
      success: true,
      banner,
    });
  } catch (error) {
    console.error("Get mobile banner error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch mobile banner.",
      error: error.message,
    });
  }
};

// UPDATE MOBILE BANNER
const updateMobileBanner = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const banner = await MobileBanner.findById(req.params.id);

    if (!banner) {
      if (req.file) {
        uploadedFilePath = req.file.path;
      }

      return res.status(404).json({
        success: false,
        message: "Mobile banner not found.",
      });
    }

    const oldImage = banner.image;

    const { title, subtitle, description, link, isActive } = req.body;

    // Update text fields
    banner.title = title !== undefined ? title : banner.title;
    banner.subtitle = subtitle !== undefined ? subtitle : banner.subtitle;
    banner.description =
      description !== undefined ? description : banner.description;
    banner.link = link !== undefined ? link : banner.link;

    // Convert frontend value to Boolean
    if (isActive !== undefined) {
      banner.isActive = isActive === true || isActive === "true";
    }

    // If new image is uploaded
    if (req.file) {
      uploadedFilePath = req.file.path;

      banner.image = `/uploads/${req.file.filename}`;

      await banner.save();

      // Delete old image only after successful database update
      if (oldImage) {
        deleteImageFile(oldImage);
      }
    } else {
      await banner.save();
    }

    res.status(200).json({
      success: true,
      message: "Mobile banner updated successfully.",
      banner,
    });
  } catch (error) {
    console.error("Update mobile banner error:", error);

    // Delete newly uploaded image if update failed
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (deleteError) {
        console.error("Failed to delete uploaded file:", deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to update mobile banner.",
      error: error.message,
    });
  }
};

// DELETE MOBILE BANNER
const deleteMobileBanner = async (req, res) => {
  try {
    const banner = await MobileBanner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Mobile banner not found.",
      });
    }

    const imagePath = banner.image;

    await MobileBanner.findByIdAndDelete(req.params.id);

    // Delete image from uploads folder
    if (imagePath) {
      deleteImageFile(imagePath);
    }

    res.status(200).json({
      success: true,
      message: "Mobile banner deleted successfully.",
    });
  } catch (error) {
    console.error("Delete mobile banner error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete mobile banner.",
      error: error.message,
    });
  }
};

// TOGGLE MOBILE BANNER STATUS
const toggleMobileBannerStatus = async (req, res) => {
  try {
    const banner = await MobileBanner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Mobile banner not found.",
      });
    }

    banner.isActive = !banner.isActive;

    await banner.save();

    res.status(200).json({
      success: true,
      message: banner.isActive
        ? "Mobile banner published successfully."
        : "Mobile banner moved to draft.",
      isActive: banner.isActive,
    });
  } catch (error) {
    console.error("Toggle mobile banner error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update mobile banner status.",
      error: error.message,
    });
  }
};

module.exports = {
  createMobileBanner,
  getAllMobileBanners,
  getMobileBannerById,
  updateMobileBanner,
  deleteMobileBanner,
  toggleMobileBannerStatus,
};
