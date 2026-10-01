const Service = require("../models/Service");

const loadGlobalData = async (req, res, next) => {
  // Shared partials read these on every page, including error pages rendered for /admin and /api
  res.locals.headerServices = [];
  res.locals.footerServices = [];
  res.locals.services = [];

  try {
    // Skip loading public website data for API and admin requests
    if (
      req.originalUrl.startsWith("/api") ||
      req.originalUrl.startsWith("/admin")
    ) {
      return next();
    }

    const services = await Service.find({
      status: "published",
    })
      .select("title slug shortDescription images")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Make services available to all EJS views
    res.locals.headerServices = services;
    res.locals.footerServices = services;

    next();
  } catch (err) {
    console.error("GLOBAL DATA ERROR:", err);
    next();
  }
};

module.exports = loadGlobalData;