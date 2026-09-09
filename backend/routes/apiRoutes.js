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

const {
  createMainBanner,
  getAllMainBanners,
  getMainBannerById,
  updateMainBanner,
  deleteMainBanner,
  toggleMainBannerStatus,
} = require("../controllers/mainBannerController");

const {
  createMobileBanner,
  getAllMobileBanners,
  getMobileBannerById,
  updateMobileBanner,
  deleteMobileBanner,
  toggleMobileBannerStatus,
} = require("../controllers/mobileBannerController");

// Service Routes
router.post("/services", upload.array("images", 10), createService);
router.get("/services", getAllServices);
router.get("/services/slug/:slug", getServiceBySlug);
router.get("/services/:id", getServiceById);
router.put("/services/:id", upload.array("images", 10), updateService);
router.delete("/services/:id", deleteService);
router.patch("/services/:id/toggle-status", toggleServiceStatus);

// Main Banner Routes

router.post("/main-banners", upload.single("image"), createMainBanner);
router.get("/main-banners", getAllMainBanners);
router.get("/main-banners/:id", getMainBannerById);
router.put("/main-banners/:id", upload.single("image"), updateMainBanner);
router.patch("/main-banners/:id/toggle-status", toggleMainBannerStatus);
router.delete("/main-banners/:id", deleteMainBanner);

// mobile Banner Routes
router.post("/mobile-banners", upload.single("image"), createMobileBanner);
router.get("/mobile-banners", getAllMobileBanners);
router.get("/mobile-banners/:id", getMobileBannerById);
router.put("/mobile-banners/:id", upload.single("image"), updateMobileBanner);
router.patch("/mobile-banners/:id/toggle-status", toggleMobileBannerStatus);
router.delete("/mobile-banners/:id", deleteMobileBanner);

module.exports = router;
