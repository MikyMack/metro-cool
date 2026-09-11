const mongoose = require("mongoose");
const Enquiry = require("../models/Enquiry");
const Service = require("../models/Service");

// =========================================
// CREATE ENQUIRY
// =========================================

const createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, message, source, service } = req.body;

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    if (!source || !["service", "contact"].includes(source)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry source.",
      });
    }

    // =========================================
    // PHONE VALIDATION
    // =========================================

    const cleanPhone = phone.replace(/\s+/g, "");

    if (!/^[0-9+()-]{7,20}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number.",
      });
    }

    // =========================================
    // EMAIL VALIDATION
    // =========================================

    let cleanEmail = "";

    if (email?.trim()) {
      cleanEmail = email.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }
    }

    // =========================================
    // SERVICE VALIDATION
    // =========================================

    let serviceId = null;
    let serviceTitle = "";

    if (source === "service") {
      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Service is required.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(service)) {
        return res.status(400).json({
          success: false,
          message: "Invalid service.",
        });
      }

      const serviceExists = await Service.findById(service)
        .select("_id title")
        .lean();

      if (!serviceExists) {
        return res.status(404).json({
          success: false,
          message: "Service not found.",
        });
      }

      serviceId = serviceExists._id;
      serviceTitle = serviceExists.title || "";
    }

    // =========================================
    // CREATE ENQUIRY
    // =========================================

    const enquiry = await Enquiry.create({
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      message: message?.trim() || "",
      source,
      service: serviceId,
      status: "new",
    });

    // =========================================
    // WHATSAPP MESSAGE
    // =========================================

    const whatsappNumber = 919567566893;

    if (!whatsappNumber) {
      console.error("WHATSAPP_NUMBER is not configured in .env");
    }

    let whatsappMessage = `Hello Metro Cool, I would like to enquire about your service.

Name: ${name.trim()}
Phone: ${cleanPhone}`;

    if (cleanEmail) {
      whatsappMessage += `\nEmail: ${cleanEmail}`;
    }

    if (source === "service" && serviceTitle) {
      whatsappMessage += `\nService: ${serviceTitle}`;
    }

    if (message?.trim()) {
      whatsappMessage += `\nMessage: ${message.trim()}`;
    }

    const whatsappUrl = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          whatsappMessage,
        )}`
      : null;

    // =========================================
    // RESPONSE
    // =========================================

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      enquiry,
      whatsappUrl,
    });
  } catch (error) {
    console.error("Create enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry.",
    });
  }
};

// =========================================
// GET ALL ENQUIRIES
// =========================================

const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate("service", "title slug")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      enquiries,
    });
  } catch (error) {
    console.error("Get enquiries error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries.",
    });
  }
};

// =========================================
// GET SINGLE ENQUIRY
// =========================================

const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry = await Enquiry.findById(id)
      .populate("service", "title slug")
      .lean();

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      enquiry,
    });
  } catch (error) {
    console.error("Get enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry.",
    });
  }
};

// =========================================
// UPDATE STATUS
// =========================================

const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "new",
      "contacted",
      "in-progress",
      "completed",
      "cancelled",
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry status.",
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    )
      .populate("service", "title slug")
      .lean();

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Update enquiry status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update enquiry status.",
    });
  }
};

// =========================================
// DELETE ENQUIRY
// =========================================

const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry = await Enquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    console.error("Delete enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete enquiry.",
    });
  }
};

module.exports = {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry,
};
