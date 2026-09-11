const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    // =========================================
    // CUSTOMER DETAILS
    // =========================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================================
    // ENQUIRY SOURCE
    // =========================================

    source: {
      type: String,
      enum: ["service", "contact"],
      required: true,
      index: true,
    },

    // =========================================
    // SERVICE REFERENCE
    // Required only for service enquiries
    // =========================================

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
      index: true,
      validate: {
        validator: function (value) {
          if (this.source === "service") {
            return !!value;
          }

          return true;
        },
        message: "Service is required for service enquiries.",
      },
    },

    // =========================================
    // STATUS
    // =========================================

    status: {
      type: String,
      enum: ["new", "contacted", "in-progress", "completed", "cancelled"],
      default: "new",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// =========================================
// SOURCE / SERVICE RELATIONSHIP
// =========================================

enquirySchema.pre("validate", function () {
  if (this.source === "contact") {
    this.service = null;
  }

  if (this.source === "service" && !this.service) {
    this.invalidate("service", "Service is required for service enquiries.");
  }
});

module.exports = mongoose.model("Enquiry", enquirySchema);
