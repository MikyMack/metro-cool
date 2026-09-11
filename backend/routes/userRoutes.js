const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const MainBanner = require("../models/MainBanner");
const MobileBanner = require("../models/MobileBanner");
const Testimonial = require("../models/Testimonial");
const Gallery = require("../models/Gallery");
const Blog = require("../models/Blog");

// Home Page
router.get("/", async (req, res, next) => {
  try {
    const [
      services,
      desktopBanners,
      mobileBanners,
      testimonials,
      gallery,
      blogs,
    ] = await Promise.all([
      Service.find({
        status: "published",
      })
        .select("title slug shortDescription images category")
        .sort({ createdAt: -1 })
        .lean(),

      MainBanner.find({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .lean(),

      MobileBanner.find({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .lean(),

      Testimonial.find({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .lean(),

      Gallery.find({
        is_active: true,
      })
        .sort({ sort_order: 1, createdAt: -1 })
        .lean(),

      Blog.find({
        status: "published",
      })
        .select("title slug content imageUrl createdAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    res.render("user/home", {
      services,
      desktopBanners,
      mobileBanners,
      testimonials,
      gallery,
      blogs,
    });
  } catch (error) {
    console.error("HOME PAGE ERROR:", error);
    next(error);
  }
});

// About Page
router.get("/about", async (req, res, next) => {
  try {
    const [testimonials, gallery, blogs] = await Promise.all([
      Testimonial.find({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .lean(),

      Gallery.find({
        is_active: true,
      })
        .sort({ sort_order: 1, createdAt: -1 })
        .lean(),

      Blog.find({
        status: "published",
      })
        .select("title slug content imageUrl createdAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    res.render("user/about", {
      testimonials,
      gallery,
      blogs,
    });
  } catch (error) {
    console.error("ABOUT PAGE ERROR:", error);
    next(error);
  }
});

// Services Page
router.get("/services", async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();
    const limit = 8;

    let page = parseInt(req.query.page, 10) || 1;

    if (page < 1) {
      page = 1;
    }

    const skip = (page - 1) * limit;

    const totalServices = await Service.countDocuments({
      status: "published",
    });

    const services = await Service.find({
      status: "published",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalServices / limit);

    res.render("user/services", {
      services,
      currentPage: page,
      totalPages,
      totalServices,
      testimonials,
    });
  } catch (error) {
    next(error);
  }
});

// Service Details Page
router.get("/services/:slug", async (req, res, next) => {
  try {
    const [service, services] = await Promise.all([
      Service.findOne({
        slug: req.params.slug,
        status: "published",
      }).lean(),

      Service.find({
        status: "published",
      })
        .select("title slug category")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!service) {
      return res.status(404).render("user/error", {
        message: "Service not found.",
      });
    }

    res.render("user/serviceDetails", {
      service,
      services,
    });
  } catch (error) {
    next(error);
  }
});

// Gallery Page
router.get("/gallery", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 9;
    const skip = (page - 1) * limit;

    const [gallery, totalGallery] = await Promise.all([
      Gallery.find({
        is_active: true,
      })
        .sort({ sort_order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Gallery.countDocuments({
        is_active: true,
      }),
    ]);

    const totalPages = Math.ceil(totalGallery / limit);

    // If requested page does not exist
    if (page > totalPages && totalPages > 0) {
      return res.redirect("/gallery?page=" + totalPages);
    }

    res.render("user/gallery", {
      gallery,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("GALLERY PAGE ERROR:", error);
    next(error);
  }
});

router.get("/contact", (req, res) => {
  res.render("user/contact");
});

// Blog Page
router.get("/blog", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 6;
    const skip = (page - 1) * limit;

    const [blogs, totalBlogs] = await Promise.all([
      Blog.find({
        status: "published",
      })
        .select("title slug content imageUrl author createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Blog.countDocuments({
        status: "published",
      }),
    ]);

    const totalPages = Math.ceil(totalBlogs / limit);

    // If someone enters a page number that doesn't exist
    if (page > totalPages && totalPages > 0) {
      return res.redirect("/blog?page=" + totalPages);
    }

    res.render("user/blog", {
      blogs,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("BLOG PAGE ERROR:", error);
    next(error);
  }
});

// Blog Details Page
router.get("/blog/:slug", async (req, res, next) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    }).lean();

    if (!blog) {
      return res.status(404).render("user/error", {
        message: "Blog not found.",
      });
    }

    res.render("user/blogDetails", {
      blog,
    });
  } catch (error) {
    console.error("BLOG DETAILS ERROR:", error);
    next(error);
  }
});

module.exports = router;
