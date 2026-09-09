document.addEventListener("DOMContentLoaded", () => {
  // ========================================
  // PAGE DETECTION
  // ========================================

  const bannersGrid = document.getElementById("bannersGrid");

  const bannerForm = document.getElementById("bannerForm");

  // ========================================
  // RUN LIST PAGE
  // ========================================

  if (bannersGrid) {
    initBannerList();
  }

  // ========================================
  // RUN FORM PAGE
  // ========================================

  if (bannerForm) {
    initBannerForm();
  }
});

// ============================================================
// BANNER LIST PAGE
// ============================================================

function initBannerList() {
  const bannersGrid = document.getElementById("bannersGrid");

  const statusFilter = document.getElementById("bannerStatusFilter");

  const emptyState = document.getElementById("bannersEmpty");

  const paginationContainer = document.querySelector(".services-pagination");

  let banners = [];

  let currentPage = 1;

  const itemsPerPage = 8;

  // ==========================================================
  // LOAD BANNERS
  // ==========================================================

  async function loadBanners() {
    try {
      bannersGrid.innerHTML = `
        <div class="col-12">
          <div class="banner-loading">
            <i class="bi bi-arrow-repeat"></i>
            <span>Loading banners...</span>
          </div>
        </div>
      `;

      const response = await fetch("/api/main-banners");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch banners.");
      }

      banners = data.banners || [];

      currentPage = 1;

      renderBanners();
    } catch (error) {
      console.error("Load banners error:", error);

      bannersGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">
            Failed to load banners.
          </div>
        </div>
      `;

      if (paginationContainer) {
        paginationContainer.style.display = "none";
      }
    }
  }

  // ==========================================================
  // FILTER
  // ==========================================================

  function getFilteredBanners() {
    const filter = statusFilter ? statusFilter.value : "";

    return banners.filter((banner) => {
      if (!filter) {
        return true;
      }

      if (filter === "active") {
        return banner.isActive === true;
      }

      if (filter === "inactive") {
        return banner.isActive === false;
      }

      return true;
    });
  }

  // ==========================================================
  // RENDER BANNERS
  // ==========================================================

  function renderBanners() {
    const filteredBanners = getFilteredBanners();

    bannersGrid.innerHTML = "";

    // ========================================================
    // EMPTY STATE
    // ========================================================

    if (filteredBanners.length === 0) {
      emptyState.style.display = "block";

      if (paginationContainer) {
        paginationContainer.style.display = "none";
      }

      return;
    }

    emptyState.style.display = "none";

    // ========================================================
    // PAGINATION
    // ========================================================

    const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;

    const endIndex = startIndex + itemsPerPage;

    const paginatedBanners = filteredBanners.slice(startIndex, endIndex);

    // ========================================================
    // CREATE CARDS
    // ========================================================

    paginatedBanners.forEach((banner) => {
      bannersGrid.insertAdjacentHTML("beforeend", createBannerCard(banner));
    });

    // ========================================================
    // PAGINATION UI
    // ========================================================

    renderPagination(totalPages);
  }

  // ==========================================================
  // CREATE BANNER CARD
  // ==========================================================

  function createBannerCard(banner) {
    const isActive = banner.isActive === true;

    const title = banner.title || "Untitled Banner";

    const subtitle = banner.subtitle || "";

    const description = banner.description || "";

    const image = banner.image || "/images/banner-placeholder.jpg";

    const link = banner.link || "";

    return `
      <div
        class="col-12 col-md-6 col-xl-4 banner-column"
        data-id="${banner._id}"
      >

        <div class="banner-card">

          <!-- IMAGE -->

          <div class="banner-image">

            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(title)}"
              onerror="this.src='/images/banner-placeholder.jpg'"
            />

            <div class="banner-overlay"></div>


            <!-- BANNER CONTENT -->

            <div class="banner-content">

              ${
                subtitle
                  ? `
                    <span class="banner-subtitle">
                      ${escapeHtml(subtitle)}
                    </span>
                  `
                  : ""
              }

              <h3>
                ${escapeHtml(title)}
              </h3>

              ${
                description
                  ? `
                    <p>
                      ${escapeHtml(description)}
                    </p>
                  `
                  : ""
              }

            </div>

          </div>


          <!-- FOOTER -->

          <div class="banner-card-footer">

            ${
              link
                ? `
      <span class="banner-route">
        ${escapeHtml(link)}
      </span>
    `
                : ""
            }


            <div class="banner-footer-right">

              <!-- STATUS -->

              <button
                type="button"
                class="banner-status-toggle ${isActive ? "active" : ""}"
                data-id="${banner._id}"
                title="${isActive ? "Deactivate banner" : "Activate banner"}"
                aria-label="${
                  isActive ? "Deactivate banner" : "Activate banner"
                }"
              >

                <i class="fa-solid ${
                  isActive ? "fa-toggle-on" : "fa-toggle-off"
                }"></i>

              </button>


              <span
                class="banner-status ${isActive ? "active" : "inactive"}"
              >

                <i class="bi bi-circle-fill"></i>

                ${isActive ? "Active" : "Inactive"}

              </span>


              <!-- ACTIONS -->

              <div class="service-actions">

                <button
                  type="button"
                  class="service-action edit"
                  data-id="${banner._id}"
                  title="Edit"
                >
                  <i class="bi bi-pencil"></i>
                </button>


                <button
                  type="button"
                  class="service-action delete"
                  data-id="${banner._id}"
                  title="Delete"
                >
                  <i class="bi bi-trash3"></i>
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    `;
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  function renderPagination(totalPages) {
    if (!paginationContainer) {
      return;
    }

    if (totalPages <= 1) {
      paginationContainer.style.display = "none";

      return;
    }

    paginationContainer.style.display = "flex";

    let html = "";

    // ========================================================
    // PREVIOUS
    // ========================================================

    html += `
      <button
        type="button"
        class="pagination-btn ${currentPage === 1 ? "disabled" : ""}"
        data-page="${currentPage - 1}"
        ${currentPage === 1 ? "disabled" : ""}
      >
        <i class="bi bi-chevron-left"></i>
      </button>
    `;

    // ========================================================
    // PAGE NUMBERS
    // ========================================================

    const pages = getPaginationPages(currentPage, totalPages);

    pages.forEach((page) => {
      if (page === "...") {
        html += `
            <span class="pagination-dots">
              ...
            </span>
          `;
      } else {
        html += `
            <button
              type="button"
              class="pagination-btn ${page === currentPage ? "active" : ""}"
              data-page="${page}"
            >
              ${page}
            </button>
          `;
      }
    });

    // ========================================================
    // NEXT
    // ========================================================

    html += `
      <button
        type="button"
        class="pagination-btn ${currentPage === totalPages ? "disabled" : ""}"
        data-page="${currentPage + 1}"
        ${currentPage === totalPages ? "disabled" : ""}
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    `;

    paginationContainer.innerHTML = html;
  }

  // ==========================================================
  // PAGINATION PAGE LOGIC
  // ==========================================================

  function getPaginationPages(current, total) {
    if (total <= 5) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, "...", total];
    }

    if (current >= total - 2) {
      return [1, "...", total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  }

  // ==========================================================
  // PAGINATION CLICK
  // ==========================================================

  paginationContainer?.addEventListener("click", (event) => {
    const button = event.target.closest(".pagination-btn");

    if (!button) return;

    if (button.disabled) {
      return;
    }

    const page = Number(button.dataset.page);

    if (!page) return;

    currentPage = page;

    renderBanners();

    document.querySelector(".banners-page")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  // ==========================================================
  // FILTER CHANGE
  // ==========================================================

  statusFilter?.addEventListener("change", () => {
    currentPage = 1;

    renderBanners();
  });

  // ==========================================================
  // EDIT / DELETE / TOGGLE
  // ==========================================================

  bannersGrid.addEventListener("click", async (event) => {
    // ======================================================
    // TOGGLE
    // ======================================================

    const toggleButton = event.target.closest(".banner-status-toggle");

    if (toggleButton) {
      await toggleBanner(toggleButton.dataset.id, toggleButton);

      return;
    }

    // ======================================================
    // EDIT
    // ======================================================

    const editButton = event.target.closest(".service-action.edit");

    if (editButton) {
      const id = editButton.dataset.id;

      window.location.href = `/admin/main-banner-form?id=${id}`;

      return;
    }

    // ======================================================
    // DELETE
    // ======================================================

    const deleteButton = event.target.closest(".service-action.delete");

    if (deleteButton) {
      const id = deleteButton.dataset.id;

      await deleteBanner(id);

      return;
    }
  });

  // ==========================================================
  // TOGGLE BANNER
  // ==========================================================

  async function toggleBanner(id, button) {
    button.disabled = true;

    try {
      const response = await fetch(`/api/main-banners/${id}/toggle-status`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update banner status.");
      }

      const banner = banners.find((item) => item._id === id);

      if (banner) {
        banner.isActive = data.isActive;
      }

      renderBanners();
    } catch (error) {
      console.error("Toggle banner error:", error);

      alert(error.message);

      button.disabled = false;
    }
  }

  // ==========================================================
  // DELETE BANNER
  // ==========================================================

  async function deleteBanner(id) {
    const banner = banners.find((item) => item._id === id);

    if (!banner) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${banner.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/main-banners/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete banner.");
      }

      banners = banners.filter((item) => item._id !== id);

      renderBanners();
    } catch (error) {
      console.error("Delete banner error:", error);

      alert(error.message);
    }
  }

  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  loadBanners();
}

// ============================================================
// BANNER FORM PAGE
// ============================================================

function initBannerForm() {
  const bannerForm = document.getElementById("bannerForm");

  const titleInput = document.getElementById("bannerTitle");

  const subtitleInput = document.getElementById("bannerSubtitle");

  const descriptionInput = document.getElementById("bannerDescription");

  const linkInput = document.getElementById("bannerLink");

  const statusInput = document.getElementById("bannerStatus");

  const imageInput = document.getElementById("bannerImage");

  const imagePreview = document.getElementById("bannerImagePreview");

  const saveButton = document.getElementById("saveBannerBtn");

  const saveButtonText = document.getElementById("saveButtonText");

  // ==========================================================
  // EDIT MODE
  // ==========================================================

  const params = new URLSearchParams(window.location.search);

  const bannerId = params.get("id");

  const isEditMode = Boolean(bannerId);

  // ==========================================================
  // PAGE TEXT
  // ==========================================================

  if (isEditMode) {
    const pageTitle = document.getElementById("formPageTitle");

    const breadcrumb = document.getElementById("breadcrumbCurrent");

    if (pageTitle) {
      pageTitle.textContent = "Edit Banner";
    }

    if (breadcrumb) {
      breadcrumb.textContent = "Edit Banner";
    }

    if (saveButtonText) {
      saveButtonText.textContent = "Update Banner";
    }

    loadBanner(bannerId);
  }

  // ==========================================================
  // IMAGE PREVIEW
  // ==========================================================

  imageInput?.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) {
      resetBannerPreview();
      return;
    }

    // ====================================
    // MAX SIZE
    // ====================================

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Image must be smaller than 2MB.");

      imageInput.value = "";

      resetBannerPreview();

      return;
    }

    // ====================================
    // FILE TYPE
    // ====================================

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG or WebP images are allowed.");

      imageInput.value = "";

      resetBannerPreview();

      return;
    }

    // ====================================
    // PREVIEW
    // ====================================

    const reader = new FileReader();

    reader.onload = (event) => {
      imagePreview.innerHTML = `
            <div class="banner-preview-item">

              <img
                src="${event.target.result}"
                alt="Banner preview"
              />

              <button
                type="button"
                class="banner-preview-remove"
                title="Remove image"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>

            </div>
          `;
    };

    reader.readAsDataURL(file);
  });

  // ==========================================================
  // REMOVE IMAGE PREVIEW
  // ==========================================================

  imagePreview?.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".banner-preview-remove");

    if (!removeButton) {
      return;
    }

    imageInput.value = "";

    resetBannerPreview();
  });

  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  bannerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      // ==================================
      // IMAGE VALIDATION
      // ==================================

      if (!isEditMode && !imageInput.files.length) {
        alert("Please select a banner image.");

        return;
      }

      // ==================================
      // FORMDATA
      // ==================================

      const formData = new FormData();

      formData.append("title", titleInput.value.trim());

      formData.append("subtitle", subtitleInput.value.trim());

      formData.append("description", descriptionInput.value.trim());

      formData.append("link", linkInput.value.trim());

      formData.append(
        "isActive",
        statusInput.value === "active" ? "true" : "false",
      );

      // ==================================
      // IMAGE
      // ==================================

      if (imageInput.files.length) {
        formData.append("image", imageInput.files[0]);
      }

      // ==================================
      // URL
      // ==================================

      let url = "/api/main-banners";

      let method = "POST";

      if (isEditMode) {
        url = `/api/main-banners/${bannerId}`;

        method = "PUT";
      }

      // ==================================
      // BUTTON
      // ==================================

      saveButton.disabled = true;

      saveButtonText.textContent = isEditMode ? "Updating..." : "Saving...";

      // ==================================
      // REQUEST
      // ==================================

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      // ==================================
      // SUCCESS
      // ==================================

      alert(
        data.message ||
          (isEditMode
            ? "Banner updated successfully."
            : "Banner created successfully."),
      );

      window.location.href = "/admin/main-banners";
    } catch (error) {
      console.error("Banner form error:", error);

      alert(error.message);

      saveButton.disabled = false;

      saveButtonText.textContent = isEditMode ? "Update Banner" : "Save Banner";
    }
  });

  // ==========================================================
  // LOAD BANNER
  // ==========================================================

  async function loadBanner(id) {
    try {
      const response = await fetch(`/api/main-banners/${id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load banner.");
      }

      const banner = data.banner;

      // ==================================
      // FORM VALUES
      // ==================================

      titleInput.value = banner.title || "";

      subtitleInput.value = banner.subtitle || "";

      descriptionInput.value = banner.description || "";

      linkInput.value = banner.link || "";

      // ==================================
      // STATUS
      // ==================================

      statusInput.value = banner.isActive ? "active" : "inactive";

      // ==================================
      // EXISTING IMAGE
      // ==================================

      if (banner.image) {
        imagePreview.innerHTML = `
          <div class="banner-preview-item">

            <img
              src="${escapeHtml(banner.image)}"
              alt="${escapeHtml(banner.title)}"
            />

            <span class="existing-image-label">
              Current image
            </span>

          </div>
        `;
      } else {
        resetBannerPreview();
      }
    } catch (error) {
      console.error("Load banner error:", error);

      alert(error.message);

      window.location.href = "/admin/main-banners";
    }
  }

  // ==========================================================
  // RESET IMAGE PREVIEW
  // ==========================================================

  function resetBannerPreview() {
    imagePreview.innerHTML = `
      <div class="image-placeholder">

        <i class="bi bi-image"></i>

        <strong>
          No image selected
        </strong>

        <span>
          JPG, PNG or WebP
        </span>

      </div>
    `;
  }

  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
  }
}
