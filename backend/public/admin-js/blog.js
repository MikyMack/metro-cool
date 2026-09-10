document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/blogs";

  const BLOG_LIST_PAGE = "/admin/blogs";
  const BLOG_FORM_PAGE = "/admin/blog-form";

  const ITEMS_PER_PAGE = 6;
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  /* =========================================================
     GLOBAL STATE
  ========================================================= */

  let blogs = [];
  let filteredBlogs = [];

  let currentPage = 1;

  let selectedImage = null;
  let previewObjectUrl = null;

  let quill = null;

  /* =========================================================
     COMMON HELPERS
  ========================================================= */

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getImageUrl(imageUrl) {
    if (!imageUrl) {
      return "/assets/images/placeholder.jpg";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    return imageUrl;
  }

  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function showMessage(message) {
    alert(message);
  }

  /* =========================================================
     LISTING PAGE
  ========================================================= */

  const blogsTableBody = document.getElementById("blogsTableBody");

  if (blogsTableBody) {
    initializeBlogListing();
  }

  async function initializeBlogListing() {
    setupListingEvents();

    await loadBlogs();
  }

  /* =========================================================
     LOAD BLOGS
  ========================================================= */

  async function loadBlogs() {
    try {
      blogsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:40px;">
            Loading blogs...
          </td>
        </tr>
      `;

      const response = await fetch(API_URL);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch blogs.");
      }

      blogs = Array.isArray(data.blogs) ? data.blogs : [];

      applyFilters();
    } catch (error) {
      console.error("Load blogs error:", error);

      blogsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:40px;">
            Failed to load blogs.
          </td>
        </tr>
      `;

      showMessage(error.message || "Failed to load blogs.");
    }
  }

  /* =========================================================
     LISTING EVENTS
  ========================================================= */

  function setupListingEvents() {
    const searchInput = document.getElementById("blogSearch");

    const categoryFilter = document.getElementById("blogCategoryFilter");

    const statusFilter = document.getElementById("blogStatusFilter");

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentPage = 1;
        applyFilters();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener("change", () => {
        currentPage = 1;
        applyFilters();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        currentPage = 1;
        applyFilters();
      });
    }

    blogsTableBody.addEventListener("click", handleTableClick);
  }

  /* =========================================================
     FILTER
  ========================================================= */

  function applyFilters() {
    const searchInput = document.getElementById("blogSearch");

    const categoryFilter = document.getElementById("blogCategoryFilter");

    const statusFilter = document.getElementById("blogStatusFilter");

    const searchValue = searchInput?.value?.trim().toLowerCase() || "";

    const categoryValue = categoryFilter?.value || "";

    const statusValue = statusFilter?.value || "";

    filteredBlogs = blogs.filter((blog) => {
      const title = blog.title?.toLowerCase() || "";

      String(blog.author || "").toLowerCase()

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        author.includes(searchValue);

      /*
       * Your current model DOES NOT contain category.
       *
       * Therefore category filtering cannot actually
       * work with the current model.
       *
       * We leave it disabled automatically.
       */

      const matchesCategory = !categoryValue;

      const matchesStatus = !statusValue || blog.status === statusValue;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    const totalPages = Math.max(
      1,
      Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE),
    );

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    renderBlogs();
    renderPagination();
    updateCount();
  }

  /* =========================================================
     RENDER BLOGS
  ========================================================= */

  function renderBlogs() {
    const emptyState = document.getElementById("blogsEmpty");

    const tableWrapper = document.querySelector(".blogs-table-wrapper");

    if (!filteredBlogs.length) {
      blogsTableBody.innerHTML = "";

      if (emptyState) {
        emptyState.style.display = "block";
      }

      if (tableWrapper) {
        tableWrapper.style.display = "none";
      }

      return;
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    if (tableWrapper) {
      tableWrapper.style.display = "block";
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    const end = start + ITEMS_PER_PAGE;

    const pageBlogs = filteredBlogs.slice(start, end);

    blogsTableBody.innerHTML = pageBlogs
      .map((blog) => createBlogRow(blog))
      .join("");
  }

  /* =========================================================
     CREATE BLOG ROW
  ========================================================= */

  function createBlogRow(blog) {
    const isPublished = blog.status === "published";

    const image = getImageUrl(blog.imageUrl);

    return `
      <tr
        class="blog-row"
        data-id="${escapeHtml(blog._id)}"
      >

        <!-- BLOG -->

        <td class="blog-info-cell">

          <div class="blog-thumbnail">
            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(blog.title)}"
              onerror="this.src='/assets/images/placeholder.jpg'"
            />
          </div>

          <div class="blog-title">
            <span>
              ${escapeHtml(blog.title)}
            </span>

            <small>
              By ${escapeHtml(blog.author || "-")}
            </small>
          </div>

        </td>


        


        <!-- STATUS -->

        <td>

          <div class="blog-status-wrapper">

            <button
              type="button"
              class="blog-status-toggle ${isPublished ? "active" : ""}"
              data-action="toggle"
              data-id="${escapeHtml(blog._id)}"
              title="${isPublished ? "Move to draft" : "Publish blog"}"
              aria-label="${isPublished ? "Move to draft" : "Publish blog"}"
            >
              <i class="bi ${
                isPublished ? "bi-toggle-on" : "bi-toggle-off"
              }"></i>
            </button>

            <span
              class="blog-status ${isPublished ? "published" : "draft"}"
            >
              ${isPublished ? "Published" : "Draft"}
            </span>

          </div>

        </td>


        <!-- DATE -->

        <td>
          <span class="blog-date">
            ${formatDate(blog.createdAt)}
          </span>
        </td>


        <!-- ACTIONS -->

        <td>

          <div class="blog-actions">

            <button
              type="button"
              class="blog-action edit"
              data-action="edit"
              data-id="${escapeHtml(blog._id)}"
              title="Edit blog"
            >
              <i class="bi bi-pencil"></i>
            </button>


            <button
              type="button"
              class="blog-action delete"
              data-action="delete"
              data-id="${escapeHtml(blog._id)}"
              title="Delete blog"
            >
              <i class="bi bi-trash3"></i>
            </button>

          </div>

        </td>

      </tr>
    `;
  }

  /* =========================================================
     TABLE CLICK HANDLER
  ========================================================= */

  async function handleTableClick(event) {
    const button = event.target.closest("button");

    if (!button) return;

    const action = button.dataset.action;

    const id = button.dataset.id;

    if (!id) return;

    if (action === "edit") {
      window.location.href = `${BLOG_FORM_PAGE}?id=${encodeURIComponent(id)}`;

      return;
    }

    if (action === "delete") {
      await deleteBlog(id, button);

      return;
    }

    if (action === "toggle") {
      await toggleBlogStatus(id, button);

      return;
    }
  }

  /* =========================================================
     TOGGLE STATUS
  ========================================================= */

  async function toggleBlogStatus(id, button) {
    try {
      button.disabled = true;

      const response = await fetch(`${API_URL}/${id}/toggle-status`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status.");
      }

      /*
       * IMPORTANT:
       *
       * Update the local object immediately.
       * This makes the toggle UI change without
       * requiring another GET request.
       */

      const blog = blogs.find((item) => item._id === id);

      if (blog) {
        if (data.blog?.status) {
          blog.status = data.blog.status;
        } else {
          blog.status = blog.status === "published" ? "draft" : "published";
        }
      }

      applyFilters();
    } catch (error) {
      console.error("Toggle blog status error:", error);

      showMessage(error.message || "Failed to update status.");

      button.disabled = false;
    }
  }

  /* =========================================================
     DELETE BLOG
  ========================================================= */

  async function deleteBlog(id, button) {
    const blog = blogs.find((item) => item._id === id);

    if (!blog) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${blog.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      button.disabled = true;

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete blog.");
      }

      blogs = blogs.filter((item) => item._id !== id);

      applyFilters();
    } catch (error) {
      console.error("Delete blog error:", error);

      button.disabled = false;

      showMessage(error.message || "Failed to delete blog.");
    }
  }

  /* =========================================================
     PAGINATION
  ========================================================= */

  function renderPagination() {
    const pagination = document.getElementById("blogsPagination");

    if (!pagination) return;

    const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let html = "";

    /* Previous */

    html += `
      <button
        type="button"
        class="pagination-btn ${currentPage === 1 ? "disabled" : ""}"
        data-page="prev"
        ${currentPage === 1 ? "disabled" : ""}
      >
        <i class="bi bi-chevron-left"></i>
      </button>
    `;

    const pages = getPaginationPages(currentPage, totalPages);

    pages.forEach((page) => {
      if (page === "...") {
        html += `
          <span class="pagination-dots">
            ...
          </span>
        `;

        return;
      }

      html += `
        <button
          type="button"
          class="pagination-btn ${page === currentPage ? "active" : ""}"
          data-page="${page}"
        >
          ${page}
        </button>
      `;
    });

    /* Next */

    html += `
      <button
        type="button"
        class="pagination-btn ${currentPage === totalPages ? "disabled" : ""}"
        data-page="next"
        ${currentPage === totalPages ? "disabled" : ""}
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    `;

    pagination.innerHTML = html;

    pagination.onclick = handlePaginationClick;
  }

  function getPaginationPages(current, total) {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, "...", total];
    }

    if (current >= total - 2) {
      return [1, "...", total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  }

  function handlePaginationClick(event) {
    const button = event.target.closest("[data-page]");

    if (!button) return;

    const value = button.dataset.page;

    const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);

    if (value === "prev") {
      if (currentPage > 1) {
        currentPage--;
      }
    } else if (value === "next") {
      if (currentPage < totalPages) {
        currentPage++;
      }
    } else {
      currentPage = Number(value);
    }

    renderBlogs();
    renderPagination();
    updateCount();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =========================================================
     COUNT
  ========================================================= */

  function updateCount() {
    const visibleCount = document.getElementById("visibleBlogCount");

    const totalVisible = document.getElementById("totalVisibleBlogCount");

    const totalCount = document.getElementById("totalBlogCount");

    const total = filteredBlogs.length;

    const start = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

    const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

    if (visibleCount) {
      visibleCount.textContent = start;
    }

    if (totalVisible) {
      totalVisible.textContent = end;
    }

    if (totalCount) {
      totalCount.textContent = total;
    }
  }

  /* =========================================================
     FORM PAGE
  ========================================================= */

  const blogForm = document.getElementById("blogForm");

  if (blogForm) {
    initializeBlogForm();
  }

  /* =========================================================
     INITIALIZE FORM
  ========================================================= */

  async function initializeBlogForm() {
    initializeQuill();

    initializeFormEvents();

    initializeCharacterCounters();

    showImagePlaceholder();

    const params = new URLSearchParams(window.location.search);

    const blogId = params.get("id");

    if (blogId) {
      await loadBlogForEdit(blogId);
    }
  }

  /* =========================================================
     QUILL
  ========================================================= */

  function initializeQuill() {
    if (typeof Quill === "undefined") {
      console.error("Quill is not loaded.");

      return;
    }

    const editor = document.getElementById("blogContentEditor");

    if (!editor) return;

    quill = new Quill("#blogContentEditor", {
      theme: "snow",

      placeholder: "Write your blog content here...",

      modules: {
        toolbar: [
          [
            {
              header: [1, 2, 3, false],
            },
          ],

          ["bold", "italic", "underline", "strike"],

          [
            {
              color: [],
            },
            {
              background: [],
            },
          ],

          [
            {
              list: "ordered",
            },
            {
              list: "bullet",
            },
          ],

          [
            {
              indent: "-1",
            },
            {
              indent: "+1",
            },
          ],

          [
            {
              align: [],
            },
          ],

          ["link"],

          ["blockquote"],

          ["clean"],
        ],
      },
    });
  }

  /* =========================================================
     FORM EVENTS
  ========================================================= */

  function initializeFormEvents() {
    const titleInput = document.getElementById("blogTitle");

    const slugInput = document.getElementById("blogSlug");

    if (titleInput && slugInput) {
      titleInput.addEventListener("input", () => {
        const params = new URLSearchParams(window.location.search);

        /*
         * Don't overwrite the existing
         * slug while editing.
         */

        if (params.get("id")) {
          return;
        }

        slugInput.value = titleInput.value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      });
    }
    const imageInput = document.getElementById("blogImage");

    if (imageInput) {
      imageInput.addEventListener("change", handleImageSelection);
    }

    blogForm.addEventListener("submit", handleBlogSubmit);
  }

  /* =========================================================
     IMAGE SELECTION
  ========================================================= */

  function handleImageSelection(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showMessage("Please select a JPG, PNG or WebP image.");

      event.target.value = "";

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showMessage("Image size must be less than 2MB.");

      event.target.value = "";

      return;
    }

    selectedImage = file;

    showNewImagePreview(file);
  }

  /* =========================================================
     NEW IMAGE PREVIEW
  ========================================================= */

  function showNewImagePreview(file) {
    const preview = document.getElementById("blogImagePreview");

    if (!preview) return;

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(file);

    preview.innerHTML = `
      <div class="blog-preview">

        <div class="blog-preview-box">

          <img
            src="${previewObjectUrl}"
            alt="New blog image"
          />

          <span class="blog-preview-label">
            New image
          </span>

        </div>

      </div>
    `;
  }

  /* =========================================================
     EXISTING IMAGE
  ========================================================= */

  function showExistingImage(imageUrl) {
    const preview = document.getElementById("blogImagePreview");

    if (!preview) return;

    preview.innerHTML = `
      <div class="blog-preview">

        <div class="blog-preview-box">

          <img
            src="${escapeHtml(getImageUrl(imageUrl))}"
            alt="Current blog image"
            onerror="this.style.display='none'"
          />

          <span class="blog-preview-label">
            Current image
          </span>

        </div>

      </div>
    `;
  }

  /* =========================================================
     IMAGE PLACEHOLDER
  ========================================================= */

  function showImagePlaceholder() {
    const preview = document.getElementById("blogImagePreview");

    if (!preview) return;

    preview.innerHTML = `
      <div class="blog-preview">

        <div class="blog-preview-placeholder">

          <i class="bi bi-image"></i>

          <strong>
            No image selected
          </strong>

          <span>
            JPG, PNG or WebP
          </span>

        </div>

      </div>
    `;
  }

  /* =========================================================
     LOAD BLOG FOR EDIT
  ========================================================= */

  async function loadBlogForEdit(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load blog.");
      }

      const blog = data.blog;

      if (!blog) {
        throw new Error("Blog data not found.");
      }

      /* Page title */

      const formTitle = document.getElementById("formPageTitle");

      if (formTitle) {
        formTitle.textContent = "Edit Blog";
      }

      const breadcrumb = document.getElementById("breadcrumbCurrent");

      if (breadcrumb) {
        breadcrumb.textContent = "Edit Blog";
      }

      /* Title */

      setValue("blogTitle", blog.title);

      /* Slug */

      setValue("blogSlug", blog.slug || "");

      /* Author */

      setValue("blogAuthor", blog.author || "");

      /* SEO */

      setValue("metaTitle", blog.metaTitle || "");

      setValue("metaDescription", blog.metaDescription || "");

      setValue(
        "metaKeywords",
        Array.isArray(blog.metaKeywords)
          ? blog.metaKeywords.join(", ")
          : blog.metaKeywords || "",
      );

      /* Content */

      if (quill) {
        quill.root.innerHTML = blog.content || "";
      } else {
        setValue("blogContent", blog.content || "");
      }

      /* Status */

      const status = document.getElementById("blogStatus");

      if (status) {
        status.value = blog.status === "published" ? "published" : "draft";
      }

      /* Image */

      if (blog.imageUrl) {
        showExistingImage(blog.imageUrl);
      }

      /* Button */

      const saveText = document.getElementById("saveButtonText");

      if (saveText) {
        saveText.textContent = "Update Blog";
      }

      updateCharacterCounters();
    } catch (error) {
      console.error("Load blog for edit error:", error);

      showMessage(error.message || "Failed to load blog.");
    }
  }

  /* =========================================================
     SET VALUE
  ========================================================= */

  function setValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.value = value ?? "";
    }
  }

  /* =========================================================
     CHARACTER COUNTERS
  ========================================================= */

  function initializeCharacterCounters() {
    const fields = [
      {
        input: "metaTitle",
        counter: "metaTitleCount",
        max: 60,
      },

      {
        input: "metaDescription",
        counter: "metaDescriptionCount",
        max: 160,
      },
    ];

    fields.forEach(({ input, counter, max }) => {
      const element = document.getElementById(input);

      if (!element) return;

      element.addEventListener("input", () => {
        const count = document.getElementById(counter);

        if (count) {
          count.textContent = `${element.value.length} / ${max}`;
        }
      });
    });
  }

  function updateCharacterCounters() {
    const fields = [
      {
        input: "metaTitle",
        counter: "metaTitleCount",
        max: 60,
      },

      {
        input: "metaDescription",
        counter: "metaDescriptionCount",
        max: 160,
      },
    ];

    fields.forEach(({ input, counter, max }) => {
      const element = document.getElementById(input);

      const count = document.getElementById(counter);

      if (element && count) {
        count.textContent = `${element.value.length} / ${max}`;
      }
    });
  }

  /* =========================================================
     SUBMIT BLOG
  ========================================================= */

  async function handleBlogSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);

    const blogId = params.get("id");

    const title = document.getElementById("blogTitle")?.value.trim();

    const author = document.getElementById("blogAuthor")?.value.trim();

    const metaTitle = document.getElementById("metaTitle")?.value.trim();

    const metaDescription = document
      .getElementById("metaDescription")
      ?.value.trim();

    const metaKeywords = document.getElementById("metaKeywords")?.value.trim();

    const status = document.getElementById("blogStatus")?.value || "draft";

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!title) {
      showMessage("Please enter the blog title.");

      return;
    }

    if (!author) {
      showMessage("Please enter the author name.");

      return;
    }

    if (!metaTitle) {
      showMessage("Please enter the meta title.");

      return;
    }

    if (!metaDescription) {
      showMessage("Please enter the meta description.");

      return;
    }

    if (!metaKeywords) {
      showMessage("Please enter meta keywords.");

      return;
    }

    let content = "";

    if (quill) {
      content = quill.root.innerHTML.trim();
    } else {
      content = document.getElementById("blogContent")?.value.trim() || "";
    }

    /* Quill empty content check */

    const plainText = quill ? quill.getText().trim() : content;

    if (!plainText) {
      showMessage("Please enter the blog content.");

      return;
    }

    /* Image required only when creating */

    if (!blogId && !selectedImage) {
      showMessage("Please select a blog image.");

      return;
    }

    /* =====================================================
       FORM DATA
    ===================================================== */

    const formData = new FormData();

    formData.append("title", title);

    formData.append("metaTitle", metaTitle);

    formData.append("metaDescription", metaDescription);

    formData.append("metaKeywords", metaKeywords);

    formData.append("content", content);

    formData.append("author", author);

    formData.append("status", status);

    /*
     * IMPORTANT:
     *
     * Only append image if a new image
     * was selected.
     *
     * During edit, the backend will
     * preserve the existing image.
     */

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    const saveButton = blogForm.querySelector('button[type="submit"]');

    const saveButtonText = document.getElementById("saveButtonText");

    if (saveButton) {
      saveButton.disabled = true;
    }

    if (saveButtonText) {
      saveButtonText.textContent = blogId ? "Updating..." : "Saving...";
    }

    try {
      const response = await fetch(blogId ? `${API_URL}/${blogId}` : API_URL, {
        method: blogId ? "PUT" : "POST",

        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save blog.");
      }

      showMessage(
        blogId ? "Blog updated successfully." : "Blog created successfully.",
      );

      window.location.href = BLOG_LIST_PAGE;
    } catch (error) {
      console.error("Save blog error:", error);

      showMessage(error.message || "Failed to save blog.");

      if (saveButton) {
        saveButton.disabled = false;
      }

      if (saveButtonText) {
        saveButtonText.textContent = blogId ? "Update Blog" : "Save Blog";
      }
    }
  }
});
