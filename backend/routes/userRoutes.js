const express = require("express");
const router = express.Router();
const Service = require("../models/Service");

router.get("/", async (req, res, next) => {
  try {
    const services = await Service.find({
      status: "published",
    })
      .select("title slug shortDescription images category")
      .sort({ createdAt: -1 })
      
      .lean();

    res.render("user/home", {
      services,
    });
  } catch (error) {
    console.error("HOME PAGE ERROR:", error);
    next(error);
  }
});

router.get("/about", (req, res) => {
  res.render("user/about");
});

router.get("/services", async (req, res, next) => {
  try {


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
    });

  } catch (error) {
    next(error);
  }
});

router.get("/services/:slug", async (req, res, next) => {
  try {
    const service = await Service.findOne({
      slug: req.params.slug,
      status: "published",
    }).lean();

    if (!service) {
      return res.status(404).render("user/error", {
        message: "Service not found.",
      });
    }

    res.render("user/serviceDetails", { service });
  } catch (error) {
    next(error);
  }
});

router.get("/gallery", (req, res) => {
  res.render("user/gallery");
});

router.get("/contact", (req, res) => {
  res.render("user/contact");
});

router.get("/blog", (req, res) => {
  res.render("user/blog");
});

router.get("/blog/:slug", (req, res) => {
  res.render("user/blogDetails", { slug: req.params.slug });
});

module.exports = router;
