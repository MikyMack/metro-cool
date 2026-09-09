const Service = require("../models/Service");

const loadGlobalData = async (req, res, next) => {
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

    // Prevent the website from breaking if service loading fails
    res.locals.headerServices = [];
    res.locals.footerServices = [];

    next();
  }
};

module.exports = loadGlobalData;