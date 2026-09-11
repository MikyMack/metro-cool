const Service = require("../models/Service");
const fs = require("fs");
const path = require("path");

// ========================================
// CREATE SERVICE
// ========================================

const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      shortDescription,
      content,
      status,
      faq,
      metaTitle,
      metaDescription,
      tags,
    } = req.body;

    // Validate required fields
    if (!title  || !shortDescription || !content) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // Images required
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one service image is required.",
      });
    }

    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);

    let parsedFaq = [];
    let parsedTags = [];

    try {
      parsedFaq = faq ? JSON.parse(faq) : [];
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid FAQ or tags format.",
      });
    }

    const service = await Service.create({
      title,
      category,
      shortDescription,
      content,
      status: status || "published",
      images: imagePaths,

      faq: parsedFaq,
      metaTitle: metaTitle || "",
      metaDescription: metaDescription || "",
      tags: parsedTags,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create service.",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL SERVICES
// ========================================

const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch services.",
      error: error.message,
    });
  }
};

// ========================================
// GET SERVICE BY ID
// ========================================

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service.",
      error: error.message,
    });
  }
};

// ========================================
// GET SERVICE BY SLUG
// ========================================

const getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({
      slug: req.params.slug,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get service by slug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service.",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE SERVICE
// ========================================

const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    // ========================================
    // UPDATE BASIC DETAILS
    // ========================================

    service.title = req.body.title;
    service.category = req.body.category;
    service.shortDescription = req.body.shortDescription;
    service.content = req.body.content;
    service.status = req.body.status || "published";

    // ==============================
    // FAQ + SEO
    // ==============================

    let parsedFaq = [];
    let parsedTags = [];

    try {
      parsedFaq = req.body.faq ? JSON.parse(req.body.faq) : [];
      parsedTags = req.body.tags ? JSON.parse(req.body.tags) : [];
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid FAQ or tags format.",
      });
    }

    service.faq = parsedFaq;
    service.metaTitle = req.body.metaTitle || "";
    service.metaDescription = req.body.metaDescription || "";
    service.tags = parsedTags;
    // ========================================
    // EXISTING IMAGES
    // ========================================

    const currentImages = Array.isArray(service.images)
      ? [...service.images]
      : [];

    // ========================================
    // REMOVED IMAGES
    // ========================================

    let removedImages = [];

    if (req.body.removedImages) {
      removedImages = Array.isArray(req.body.removedImages)
        ? req.body.removedImages
        : [req.body.removedImages];
    }

    // Only allow removal of images that
    // actually belong to this service
    const imagesToRemove = currentImages.filter((image) =>
      removedImages.includes(image),
    );

    // Keep images that were NOT removed
    const remainingImages = currentImages.filter(
      (image) => !removedImages.includes(image),
    );

    // ========================================
    // NEW IMAGES
    // ========================================

    const newImages = (req.files || []).map(
      (file) => `/uploads/${file.filename}`,
    );

    // ========================================
    // FINAL IMAGE LIST
    // ========================================

    const finalImages = [...remainingImages, ...newImages];

    // At least one image must remain
    if (finalImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one service image is required.",
      });
    }

    // Maximum 10 images
    if (finalImages.length > 10) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 10 images is allowed.",
      });
    }

    // ========================================
    // SAVE DATABASE
    // ========================================

    service.images = finalImages;

    await service.save();

    // ========================================
    // DELETE REMOVED IMAGE FILES
    // ========================================

    for (const image of imagesToRemove) {
      const imagePath = path.join(
        __dirname,
        "..",
        image.replace(/^[/\\]+/, ""),
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // ========================================
    // RESPONSE
    // ========================================

    res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update service.",
      error: error.message,
    });
  }
};

// ========================================
// DELETE SERVICE
// ========================================

const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    // Delete image from uploads folder
    if (service.image) {
      const imagePath = path.join(__dirname, "..", service.image);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Service.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete service.",
      error: error.message,
    });
  }
};

// ========================================
// TOGGLE SERVICE STATUS
// ========================================

const toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    service.status = service.status === "published" ? "draft" : "published";

    await service.save();

    return res.status(200).json({
      success: true,
      message: `Service ${
        service.status === "published" ? "published" : "moved to draft"
      } successfully.`,
      status: service.status,
    });
  } catch (error) {
    console.error("Toggle service status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update service status.",
      error: error.message,
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  getServiceBySlug,
  updateService,
  deleteService,
  toggleServiceStatus,
};
