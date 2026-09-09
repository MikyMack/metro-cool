document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // CONFIG
  // ============================================================

  const API_URL = "/api/mobile-banners";

  // Change these only if your admin routes are different
  const LIST_PAGE_URL = "/admin/mobile-banners";
  const FORM_PAGE_URL = "/admin/mobile-banner-form";

  const ITEMS_PER_PAGE = 6;
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // ============================================================
  // COMMON HELPERS
  // ============================================================

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getErrorMessage(error, fallback = "Something went wrong.") {
    return error?.message || fallback;
  }

  // ============================================================
  // LISTING PAGE
  // ============================================================

  const bannersGrid = document.getElementById("bannersGrid");

  if (bannersGrid) {
    initBannerListing();
  }

  function initBannerListing() {
    const statusFilter = document.getElementById("bannerStatusFilter");

    const emptyState = document.getElementById("bannersEmpty");

    const pagination =
      document.getElementById("bannerPagination") ||
      document.querySelector(".services-pagination");

    let banners = [];
    let currentPage = 1;

    // ----------------------------------------------------------
    // Initial load
    // ----------------------------------------------------------

    loadBanners();

    // ----------------------------------------------------------
    // Filter
    // ----------------------------------------------------------

    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        currentPage = 1;
        renderBanners();
      });
    }

    // ----------------------------------------------------------
    // Fetch banners
    // ----------------------------------------------------------

    async function loadBanners() {
      showLoading();

      try {
        const response = await fetch(API_URL);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load mobile banners.");
        }

        banners = Array.isArray(data.banners) ? data.banners : [];

        renderBanners();
      } catch (error) {
        console.error("Load mobile banners error:", error);

        bannersGrid.innerHTML = `
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-exclamation-circle fs-3"></i>
              <h5 class="mt-3">Unable to load banners</h5>
              <p class="text-muted mb-3">
                ${escapeHtml(getErrorMessage(error))}
              </p>

              <button
                type="button"
                class="btn btn-dark"
                id="retryBannerBtn"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Try Again
              </button>
            </div>
          </div>
        `;

        if (emptyState) {
          emptyState.style.display = "none";
        }

        if (pagination) {
          pagination.innerHTML = "";
        }

        const retryBtn = document.getElementById("retryBannerBtn");

        if (retryBtn) {
          retryBtn.addEventListener("click", loadBanners);
        }
      }
    }

    // ----------------------------------------------------------
    // Loading
    // ----------------------------------------------------------

    function showLoading() {
      bannersGrid.innerHTML = `
        <div class="col-12">
          <div class="text-center py-5">
            <div
              class="spinner-border"
              role="status"
              aria-hidden="true"
            ></div>

            <p class="text-muted mt-3 mb-0">
              Loading mobile banners...
            </p>
          </div>
        </div>
      `;

      if (emptyState) {
        emptyState.style.display = "none";
      }
    }

    // ----------------------------------------------------------
    // Filtered banners
    // ----------------------------------------------------------

    function getFilteredBanners() {
      const filterValue = statusFilter ? statusFilter.value : "";

      if (!filterValue) {
        return banners;
      }

      return banners.filter((banner) => {
        if (filterValue === "active") {
          return banner.isActive === true;
        }

        if (filterValue === "inactive") {
          return banner.isActive === false;
        }

        return true;
      });
    }

    // ----------------------------------------------------------
    // Render banners
    // ----------------------------------------------------------

    function renderBanners() {
      const filteredBanners = getFilteredBanners();

      const totalPages = Math.max(
        1,
        Math.ceil(filteredBanners.length / ITEMS_PER_PAGE),
      );

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      // Empty
      if (filteredBanners.length === 0) {
        bannersGrid.innerHTML = "";

        if (emptyState) {
          emptyState.style.display = "block";
        }

        if (pagination) {
          pagination.innerHTML = "";
        }

        return;
      }

      if (emptyState) {
        emptyState.style.display = "none";
      }

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

      const endIndex = startIndex + ITEMS_PER_PAGE;

      const pageBanners = filteredBanners.slice(startIndex, endIndex);

      bannersGrid.innerHTML = pageBanners.map(createBannerCard).join("");

      renderPagination(totalPages);

      attachCardEvents();
    }

    // ----------------------------------------------------------
    // Banner card
    // ----------------------------------------------------------

    function createBannerCard(banner) {
      const isActive = banner.isActive === true;

      const statusText = isActive ? "Active" : "Inactive";

      const statusClass = isActive ? "published" : "draft";

      const image = banner.image || "/assets/images/placeholder.jpg";

      const title = banner.title || "Untitled Banner";

      const subtitle = banner.subtitle || "";

      const description = banner.description || "";

      const link = banner.link || "";

      return `
        <div
          class="col-12 col-md-6 col-xl-4"
          data-banner-id="${escapeHtml(banner._id)}"
        >
          <div class="banner-card">

            <!-- IMAGE -->
            <div class="banner-image">

              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(title)}"
                loading="lazy"
                onerror="this.src='/assets/images/placeholder.jpg'"
              />

              <div class="banner-overlay"></div>

              <div class="banner-content">

                ${
                  subtitle
                    ? `
                      <p>
                        ${escapeHtml(subtitle)}
                      </p>
                    `
                    : ""
                }

                <h3>
                  ${escapeHtml(title)}
                </h3>

              </div>
            </div>

            <!-- FOOTER -->
            <div class="banner-card-footer">

              <div class="banner-footer-info">

                <span
                  class="banner-status ${statusClass}"
                >
                  ${statusText}
                </span>

                ${
                  link
                    ? `
                      <span
                        class="banner-route"
                        title="${escapeHtml(link)}"
                      >
                        ${escapeHtml(link)}
                      </span>
                    `
                    : ""
                }

              </div>

              <div class="banner-footer-right">

                <!-- STATUS TOGGLE -->
                <button
                  type="button"
                  class="service-status-toggle banner-status-toggle ${
                    isActive ? "active" : ""
                  }"
                  data-id="${escapeHtml(banner._id)}"
                  title="${isActive ? "Make inactive" : "Make active"}"
                  aria-label="${isActive ? "Make inactive" : "Make active"}"
                >
                  <i
                    class="fa-solid ${
                      isActive ? "fa-toggle-on" : "fa-toggle-off"
                    }"
                  ></i>
                </button>

                <!-- EDIT -->
                <button
                  type="button"
                  class="service-action edit edit-banner-btn"
                  data-id="${escapeHtml(banner._id)}"
                  title="Edit banner"
                  aria-label="Edit banner"
                >
                  <i class="bi bi-pencil"></i>
                </button>

                <!-- DELETE -->
                <button
                  type="button"
                  class="service-action delete delete-banner-btn"
                  data-id="${escapeHtml(banner._id)}"
                  title="Delete banner"
                  aria-label="Delete banner"
                >
                  <i class="bi bi-trash3"></i>
                </button>

              </div>
            </div>

          </div>
        </div>
      `;
    }

    // ----------------------------------------------------------
    // Card events
    // ----------------------------------------------------------

    function attachCardEvents() {
      // Edit
      document.querySelectorAll(".edit-banner-btn").forEach((button) => {
        button.addEventListener("click", () => {
          const id = button.dataset.id;

          if (!id) return;

          window.location.href = `${FORM_PAGE_URL}?id=${encodeURIComponent(id)}`;
        });
      });

      // Delete
      document.querySelectorAll(".delete-banner-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const id = button.dataset.id;

          if (!id) return;

          await deleteBanner(id, button);
        });
      });

      // Toggle
      document.querySelectorAll(".banner-status-toggle").forEach((button) => {
        button.addEventListener("click", async () => {
          const id = button.dataset.id;

          if (!id) return;

          await toggleBannerStatus(id, button);
        });
      });
    }

    // ----------------------------------------------------------
    // Delete
    // ----------------------------------------------------------

    async function deleteBanner(id, button) {
      const banner = banners.find((item) => item._id === id);

      const bannerTitle = banner?.title || "this banner";

      const confirmed = confirm(
        `Are you sure you want to delete "${bannerTitle}"?\n\nThis action cannot be undone.`,
      );

      if (!confirmed) return;

      const originalHTML = button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <span
          class="spinner-border spinner-border-sm"
          aria-hidden="true"
        ></span>
      `;

      try {
        const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to delete banner.");
        }

        banners = banners.filter((item) => item._id !== id);

        renderBanners();
      } catch (error) {
        console.error("Delete banner error:", error);

        alert(getErrorMessage(error, "Failed to delete banner."));

        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    }

    // ----------------------------------------------------------
    // Toggle status
    // ----------------------------------------------------------

    async function toggleBannerStatus(id, button) {
      const banner = banners.find((item) => item._id === id);

      if (!banner) return;

      const originalHTML = button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <span
          class="spinner-border spinner-border-sm"
          aria-hidden="true"
        ></span>
      `;

      try {
        const response = await fetch(
          `${API_URL}/${encodeURIComponent(id)}/toggle-status`,
          {
            method: "PATCH",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to update banner status.");
        }

        banner.isActive = data.isActive;

        renderBanners();
      } catch (error) {
        console.error("Toggle banner status error:", error);

        alert(getErrorMessage(error, "Failed to update banner status."));

        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    }

    // ----------------------------------------------------------
    // Pagination
    // ----------------------------------------------------------

    function renderPagination(totalPages) {
      if (!pagination) return;

      if (totalPages <= 1) {
        pagination.innerHTML = "";
        return;
      }

      let html = "";

      // Previous
      html += `
        <button
          type="button"
          class="pagination-btn ${currentPage === 1 ? "disabled" : ""}"
          data-page="prev"
          ${currentPage === 1 ? "disabled" : ""}
          aria-label="Previous page"
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

      // Next
      html += `
        <button
          type="button"
          class="pagination-btn ${currentPage === totalPages ? "disabled" : ""}"
          data-page="next"
          ${currentPage === totalPages ? "disabled" : ""}
          aria-label="Next page"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      `;

      pagination.innerHTML = html;

      pagination
        .querySelectorAll(".pagination-btn:not(.disabled)")
        .forEach((button) => {
          button.addEventListener("click", () => {
            const page = button.dataset.page;

            if (page === "prev") {
              currentPage--;
            } else if (page === "next") {
              currentPage++;
            } else {
              currentPage = Number(page);
            }

            renderBanners();

            // Smooth scroll back to banner section
            bannersGrid.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        });
    }

    // ----------------------------------------------------------
    // Pagination page numbers
    // ----------------------------------------------------------

    function getPaginationPages(current, total) {
      if (total <= 5) {
        return Array.from({ length: total }, (_, index) => index + 1);
      }

      if (current <= 3) {
        return [1, 2, 3, "...", total];
      }

      if (current >= total - 2) {
        return [1, "...", total - 2, total - 1, total];
      }

      return [1, "...", current - 1, current, current + 1, "...", total];
    }
  }

  // ============================================================
  // FORM PAGE
  // ============================================================

  const bannerForm = document.getElementById("bannerForm");

  if (bannerForm) {
    initBannerForm();
  }

  function initBannerForm() {
    const titleInput = document.getElementById("bannerTitle");

    const subtitleInput = document.getElementById("bannerSubtitle");

    const descriptionInput = document.getElementById("bannerDescription");

    const linkInput = document.getElementById("bannerLink");

    const statusInput = document.getElementById("bannerStatus");

    const imageInput = document.getElementById("bannerImage");

    const imagePreview = document.getElementById("bannerImagePreview");

    const saveButton = document.getElementById("saveBannerBtn");

    const saveButtonText = document.getElementById("saveButtonText");

    if (!titleInput || !imageInput || !imagePreview) {
      console.error("Required mobile banner form elements are missing.");

      return;
    }

    // ----------------------------------------------------------
    // Edit mode
    // ----------------------------------------------------------

    const params = new URLSearchParams(window.location.search);

    const bannerId = params.get("id");

    const isEditMode = Boolean(bannerId);

    let selectedImage = null;
    let previewObjectUrl = null;

    // ----------------------------------------------------------
    // Setup form
    // ----------------------------------------------------------

    if (isEditMode) {
      if (saveButtonText) {
        saveButtonText.textContent = "Update Banner";
      }

      loadBannerForEdit();
    } else {
      if (saveButtonText) {
        saveButtonText.textContent = "Save Banner";
      }

      showImagePlaceholder();
    }

    // ----------------------------------------------------------
    // Image selection
    // ----------------------------------------------------------

    imageInput.addEventListener("change", () => {
      const file = imageInput.files?.[0];

      if (!file) return;

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("Please select a JPG, PNG, or WebP image.");

        imageInput.value = "";
        selectedImage = null;

        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        alert("Image size must be 2MB or smaller.");

        imageInput.value = "";
        selectedImage = null;

        return;
      }

      selectedImage = file;

      showNewImagePreview(file);
    });

    // ----------------------------------------------------------
    // Load existing banner
    // ----------------------------------------------------------

    async function loadBannerForEdit() {
      showFormLoading();

      try {
        const response = await fetch(
          `${API_URL}/${encodeURIComponent(bannerId)}`,
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load banner.");
        }

        const banner = data.banner;

        // Populate fields
        titleInput.value = banner.title || "";

        if (subtitleInput) {
          subtitleInput.value = banner.subtitle || "";
        }

        if (descriptionInput) {
          descriptionInput.value = banner.description || "";
        }

        if (linkInput) {
          linkInput.value = banner.link || "";
        }

        if (statusInput) {
          statusInput.value = banner.isActive === true ? "active" : "inactive";
        }

        // Existing image
        if (banner.image) {
          showExistingImage(banner.image);
        } else {
          showImagePlaceholder();
        }
      } catch (error) {
        console.error("Load mobile banner error:", error);

        imagePreview.innerHTML = `
          <div class="image-placeholder">
            <i class="bi bi-exclamation-circle"></i>

            <strong>
              Unable to load banner
            </strong>

            <span>
              ${escapeHtml(getErrorMessage(error))}
            </span>
          </div>
        `;

        alert(getErrorMessage(error, "Failed to load banner."));
      }
    }

    // ----------------------------------------------------------
    // Form loading state
    // ----------------------------------------------------------

    function showFormLoading() {
      imagePreview.innerHTML = `
        <div class="image-placeholder">
          <span
            class="spinner-border spinner-border-sm"
            aria-hidden="true"
          ></span>

          <strong>
            Loading banner...
          </strong>
        </div>
      `;

      if (saveButton) {
        saveButton.disabled = true;
      }
    }

    // ----------------------------------------------------------
    // Existing image preview
    // ----------------------------------------------------------

    function showExistingImage(image) {
      imagePreview.innerHTML = `
        <div
          class="service-preview-item banner-preview-item"
          style="width: 100%; height: 180px;"
        >
          <img
            src="${escapeHtml(image)}"
            alt="Current banner image"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            "
            onerror="this.style.display='none'"
          />

          <div
            style="
              position: absolute;
              left: 8px;
              bottom: 8px;
              background: rgba(0,0,0,.7);
              color: #fff;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
            "
          >
            Current image
          </div>
        </div>
      `;

      if (saveButton) {
        saveButton.disabled = false;
      }
    }

    // ----------------------------------------------------------
    // New image preview
    // ----------------------------------------------------------

    function showNewImagePreview(file) {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }

      previewObjectUrl = URL.createObjectURL(file);

      imagePreview.innerHTML = `
        <div
          class="service-preview-item banner-preview-item"
          style="width: 100%; height: 180px;"
        >
          <img
            src="${previewObjectUrl}"
            alt="New banner image"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            "
          />

          <div
            style="
              position: absolute;
              left: 8px;
              bottom: 8px;
              background: rgba(0,0,0,.75);
              color: #fff;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
            "
          >
            New image
          </div>
        </div>
      `;
    }

    // ----------------------------------------------------------
    // Placeholder
    // ----------------------------------------------------------

    function showImagePlaceholder() {
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

    // ----------------------------------------------------------
    // Submit
    // ----------------------------------------------------------

    bannerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const title = titleInput.value.trim();


      // Image is mandatory only when creating
      if (!isEditMode && !selectedImage) {
        alert("Please select a banner image.");

        imageInput.click();
        return;
      }

      const formData = new FormData();

      formData.append("title", title);

      if (subtitleInput) {
        formData.append("subtitle", subtitleInput.value.trim());
      }

      if (descriptionInput) {
        formData.append("description", descriptionInput.value.trim());
      }

      if (linkInput) {
        formData.append("link", linkInput.value.trim());
      }

      // IMPORTANT:
      // Backend expects isActive, not status
      formData.append(
        "isActive",
        statusInput?.value === "active" ? "true" : "false",
      );

      // Only append image when a NEW image is selected
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      setSavingState(true);

      try {
        const url = isEditMode
          ? `${API_URL}/${encodeURIComponent(bannerId)}`
          : API_URL;

        const method = isEditMode ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              `Failed to ${isEditMode ? "update" : "create"} banner.`,
          );
        }

        alert(
          isEditMode
            ? "Mobile banner updated successfully."
            : "Mobile banner created successfully.",
        );

        window.location.href = LIST_PAGE_URL;
      } catch (error) {
        console.error("Save mobile banner error:", error);

        alert(
          getErrorMessage(
            error,
            `Failed to ${isEditMode ? "update" : "save"} banner.`,
          ),
        );

        setSavingState(false);
      }
    });

    // ----------------------------------------------------------
    // Save button state
    // ----------------------------------------------------------

    function setSavingState(isSaving) {
      if (!saveButton) return;

      saveButton.disabled = isSaving;

      if (isSaving) {
        saveButton.innerHTML = `
          <span
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          ></span>

          <span>
            ${isEditMode ? "Updating..." : "Saving..."}
          </span>
        `;
      } else {
        saveButton.innerHTML = `
          <i class="bi bi-check-lg"></i>

          <span>
            ${isEditMode ? "Update Banner" : "Save Banner"}
          </span>
        `;
      }
    }

    // ----------------------------------------------------------
    // Cleanup preview URL
    // ----------------------------------------------------------

    window.addEventListener("beforeunload", () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    });
  }
});
