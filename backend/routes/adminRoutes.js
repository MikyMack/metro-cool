require("dotenv").config();
const express = require("express");
const router = express.Router();
const isAdmin = require("../middleware/isAdmin");

router.get("/login", (req, res) => {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", { error: req.query.error || null });
});

router.post("/login", (req, res) => {
  const username = (req.body.username || "").trim();
  const password = (req.body.password || "").trim();
  if (
    username === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.user = { username, isAdmin: true };
    req.session.save((err) => {
      if (err) {
        return res.render("admin/login", {
          error: "Session error. Please try again.",
        });
      }
      return res.redirect("/admin/dashboard");
    });
    return;
  }
  res.render("admin/login", {
    error: "Invalid credentials. Please check your email and password.",
  });
});

router.get("/dashboard", isAdmin, (req, res) => {
  res.render("admin/dashboard");
});

router.get("/services", isAdmin, (req, res) => {
  res.render("admin/services");
});

router.get("/service-form", isAdmin, (req, res) => {
  res.render("admin/service-form");
});

router.get("/main-banners", isAdmin, (req, res) => {
  res.render("admin/main-banner");
});

router.get("/main-banner-form", isAdmin, (req, res) => {
  res.render("admin/main-banner-form");
});

router.get("/mobile-banners", isAdmin, (req, res) => {
  res.render("admin/mobile-banner");
});

router.get("/mobile-banner-form", isAdmin, (req, res) => {
  res.render("admin/mobile-banner-form");
});

router.get("/testimonials", isAdmin, (req, res) => {
  res.render("admin/testimonials");
});

router.get("/mobile-banner-form", isAdmin, (req, res) => {
  res.render("admin/mobile-banner-form");
});

router.get("/testimonial-form", isAdmin, (req, res) => {
  res.render("admin/testimonial-form");
});

router.get("/blogs", isAdmin, (req, res) => {
  res.render("admin/blog");
});

router.get("/blog-form", isAdmin, (req, res) => {
  res.render("admin/blog-form");
});

module.exports = router;
