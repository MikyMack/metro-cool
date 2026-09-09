const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createService,
  getAllServices,
  getServiceById,
  getServiceBySlug,
  updateService,
  deleteService,
  toggleServiceStatus,
} = require("../controllers/serviceController");

// Service Routes
router.post("/services", upload.array("images", 10), createService);
router.get("/services", getAllServices);
router.get("/services/slug/:slug", getServiceBySlug);
router.get("/services/:id", getServiceById);
router.put("/services/:id", upload.array("images", 10), updateService);
router.delete("/services/:id", deleteService);
router.patch("/services/:id/toggle-status", toggleServiceStatus);

module.exports = router;
