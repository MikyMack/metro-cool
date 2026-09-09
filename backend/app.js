const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "admin_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
  }),
);

app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// app.use(async (req, res, next) => {
//   try {
//     const headerProducts = await Product.find({ isActive: true })
//       .select("name slug")
//       .sort({ createdAt: -1 }) // or featured first
//       .limit(8)
//       .lean();

//     res.locals.headerProducts = headerProducts;

//     next();
//   } catch (err) {
//     console.error(err);
//     res.locals.headerProducts = [];
//     next();
//   }
// });

app.use((req, res, next) => {
  res.locals.currentUrl = req.path;
  next();
});


app.use(async (req, res, next) => {
  try {
    res.locals.footerProducts = await Product.find({ isActive: true })
      .select("name slug")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    next();
  } catch (err) {
    console.error(err);
    res.locals.footerProducts = [];
    next();
  }
});

// Routes
const userRoutes = require("./routes/userRoutes");
app.use("/", userRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

const apiRoutes = require("./routes/apiRoutes");
// const Product = require("./models/Product");
app.use("/api", apiRoutes);

// app.use((req, res, next) => {
//   res.status(404);

//   if (req.originalUrl.startsWith("/api")) {
//     return res.json({ success: false, message: "Route not found" });
//   }
//   return res.render("404", { message: "Page Not Found" });
// });

// Error handler
app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  const statusCode = err.statusCode || 500;

  if (req.originalUrl.startsWith("/api")) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }

  res.status(statusCode).render("user/error", {
    message: err.message || "Something went wrong",
  });
});

module.exports = app;
