const express = require("express");
const path = require("path");
const session = require("express-session");

const loadGlobalData = require("./middleware/globalData");

const app = express();



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));




app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);




app.use(
  session({
    secret: process.env.SESSION_SECRET || "admin_secret_key",
    resave: false,
    saveUninitialized: false,

    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);


app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);



app.use((req, res, next) => {
  res.locals.currentUrl = req.path;
  next();
});



app.use(loadGlobalData);




const userRoutes = require("./routes/userRoutes");

app.use("/", userRoutes);


const adminRoutes = require("./routes/adminRoutes");

app.use("/admin", adminRoutes);


const apiRoutes = require("./routes/apiRoutes");

app.use("/api", apiRoutes);



app.use((req, res, next) => {
  res.status(404);

  if (req.originalUrl.startsWith("/api")) {
    return res.json({
      success: false,
      message: "Route not found",
    });
  }

  return res.render("user/error", {
    message: "Page Not Found",
  });
});



app.use((err, req, res, next) => {
  console.error("ERROR:", err);

  const statusCode = err.statusCode || 500;

  // API error
  if (req.originalUrl.startsWith("/api")) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }

  // Website error
  return res.status(statusCode).render("user/error", {
    message: err.message || "Something went wrong",
  });
});


module.exports = app;