const Blog = require("../models/Blog");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

/* =========================================================
   HELPERS
========================================================= */

function deleteImageFile(imagePath) {
  if (!imagePath) return;

  try {
    const cleanPath = imagePath.replace(/^[/\\]+/, "");

    const filePath = path.join(__dirname, "..", cleanPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting blog image:", error.message);
  }
}

/* =========================================================
   CREATE BLOG
========================================================= */

const createBlog = async (req, res) => {
  let uploadedFilePath = null;

  try {
    uploadedFilePath = req.file?.path || null;

    const {
      title,
      metaTitle,
      metaDescription,
      metaKeywords,
      content,
      author,
      status,
    } = req.body;

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!title?.trim()) {
      if (uploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Blog title is required.",
      });
    }

    if (!metaTitle?.trim()) {
      if (uploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Meta title is required.",
      });
    }

    if (!metaDescription?.trim()) {
      if (uploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Meta description is required.",
      });
    }

    if (!content?.trim()) {
      if (uploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Blog content is required.",
      });
    }

    if (!author?.trim()) {
      if (uploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Author is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Blog image is required.",
      });
    }

    /* -------------------------------------------------------
       KEYWORDS
    ------------------------------------------------------- */

    let keywords = [];

    if (Array.isArray(metaKeywords)) {
      keywords = metaKeywords.map((keyword) => keyword.trim()).filter(Boolean);
    } else if (typeof metaKeywords === "string") {
      keywords = metaKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
    }

    /* -------------------------------------------------------
       STATUS
    ------------------------------------------------------- */

    const blogStatus = status === "published" ? "published" : "draft";

    /* -------------------------------------------------------
       IMAGE
    ------------------------------------------------------- */

    const imageUrl = `/uploads/${req.file.filename}`;

    /* -------------------------------------------------------
       SLUG
    ------------------------------------------------------- */

    const slug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    /* -------------------------------------------------------
       CREATE
    ------------------------------------------------------- */

    const blog = await Blog.create({
      title: title.trim(),
      slug,
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      metaKeywords: keywords,
      content,
      author: author.trim(),
      imageUrl,
      status: blogStatus,
    });

    return res.status(201).json({
      success: true,
      message: "Blog created successfully.",
      blog,
    });
  } catch (error) {
    if (uploadedFilePath) {
      deleteImageFile(`/uploads/${req.file.filename}`);
    }

    console.error("Create blog error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A blog with this title already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create blog.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET ALL BLOGS
========================================================= */

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    console.error("Get all blogs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET BLOG BY ID
========================================================= */

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("Get blog error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET BLOG BY SLUG
========================================================= */

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({
      slug: slug.toLowerCase(),
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    return res.status(200).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error("Get blog by slug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog.",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE BLOG
========================================================= */

const updateBlog = async (req, res) => {
  let newUploadedFilePath = null;

  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    newUploadedFilePath = req.file?.path || null;

    const {
      title,
      metaTitle,
      metaDescription,
      metaKeywords,
      content,
      author,
      status,
    } = req.body;

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!title?.trim()) {
      if (newUploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Blog title is required.",
      });
    }

    if (!metaTitle?.trim()) {
      if (newUploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Meta title is required.",
      });
    }

    if (!metaDescription?.trim()) {
      if (newUploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Meta description is required.",
      });
    }

    if (!content?.trim()) {
      if (newUploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Blog content is required.",
      });
    }

    if (!author?.trim()) {
      if (newUploadedFilePath) {
        deleteImageFile(`/uploads/${req.file.filename}`);
      }

      return res.status(400).json({
        success: false,
        message: "Author is required.",
      });
    }

    /* -------------------------------------------------------
       KEYWORDS
    ------------------------------------------------------- */

    let keywords = [];

    if (Array.isArray(metaKeywords)) {
      keywords = metaKeywords.map((keyword) => keyword.trim()).filter(Boolean);
    } else if (typeof metaKeywords === "string") {
      keywords = metaKeywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
    }

    /* -------------------------------------------------------
       SAVE OLD IMAGE
    ------------------------------------------------------- */

    const oldImageUrl = blog.imageUrl;

    /* -------------------------------------------------------
       UPDATE FIELDS
    ------------------------------------------------------- */

    blog.title = title.trim();

    blog.slug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    blog.metaTitle = metaTitle.trim();

    blog.metaDescription = metaDescription.trim();

    blog.metaKeywords = keywords;

    blog.content = content;

    blog.author = author.trim();

    blog.status = status === "published" ? "published" : "draft";

    /* -------------------------------------------------------
       REPLACE IMAGE ONLY IF NEW IMAGE EXISTS
    ------------------------------------------------------- */

    if (req.file) {
      blog.imageUrl = `/uploads/${req.file.filename}`;
    }

    await blog.save();

    /* -------------------------------------------------------
       DELETE OLD IMAGE AFTER SUCCESSFUL SAVE
    ------------------------------------------------------- */

    if (req.file && oldImageUrl && oldImageUrl !== blog.imageUrl) {
      deleteImageFile(oldImageUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully.",
      blog,
    });
  } catch (error) {
    if (newUploadedFilePath && req.file) {
      deleteImageFile(`/uploads/${req.file.filename}`);
    }

    console.error("Update blog error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A blog with this title already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update blog.",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE BLOG
========================================================= */

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    const imageUrl = blog.imageUrl;

    await Blog.findByIdAndDelete(id);

    if (imageUrl) {
      deleteImageFile(imageUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully.",
    });
  } catch (error) {
    console.error("Delete blog error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete blog.",
      error: error.message,
    });
  }
};

/* =========================================================
   TOGGLE STATUS
========================================================= */

const toggleBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    blog.status = blog.status === "published" ? "draft" : "published";

    await blog.save();

    return res.status(200).json({
      success: true,
      message: `Blog ${
        blog.status === "published" ? "published" : "moved to draft"
      } successfully.`,
      blog,
    });
  } catch (error) {
    console.error("Toggle blog status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update blog status.",
      error: error.message,
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
};
