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

const {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialStatus,
} = require("../controllers/testimonialController");

const {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
} = require("../controllers/blogController");

const {
  createGallery,
  getAllGallery,
  getGalleryById,
  updateGallery,
  deleteGallery,
  toggleGalleryStatus,
  updateGallerySortOrder,
} = require("../controllers/galleryController");

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

// testimonial Routes
router.post("/testimonials", upload.single("image"), createTestimonial);
router.get("/testimonials", getAllTestimonials);
router.get("/testimonials/:id", getTestimonialById);
router.put("/testimonials/:id", upload.single("image"), updateTestimonial);
router.patch("/testimonials/:id/toggle-status", toggleTestimonialStatus);
router.delete("/testimonials/:id", deleteTestimonial);

// Blog Routes
router.post("/blogs", upload.single("image"), createBlog);
router.get("/blogs", getAllBlogs);
router.get("/blogs/slug/:slug", getBlogBySlug);
router.get("/blogs/:id", getBlogById);
router.put("/blogs/:id", upload.single("image"), updateBlog);
router.patch("/blogs/:id/toggle-status", toggleBlogStatus);
router.delete("/blogs/:id", deleteBlog);

// GALLERY ROUTES
router.post("/gallery", upload.single("image"), createGallery);
router.get("/gallery", getAllGallery);
router.get("/gallery/:id", getGalleryById);
router.put("/gallery/:id", upload.single("image"), updateGallery);
router.patch("/gallery/:id/toggle-status", toggleGalleryStatus);
router.patch("/gallery/:id/sort-order", updateGallerySortOrder);
router.delete("/gallery/:id", deleteGallery);

module.exports = router;
