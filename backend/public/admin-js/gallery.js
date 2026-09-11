document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/gallery";

  const LIST_PAGE_URL = "/admin/gallery";
  const FORM_PAGE_URL = "/admin/gallery-form";

  const ITEMS_PER_PAGE = 8;

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // =========================================================
  // COMMON HELPERS
  // =========================================================

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getImageUrl(image) {
    if (!image) {
      return "/assets/images/placeholder.jpg";
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("/")) {
      return image;
    }

    return `/uploads/${image}`;
  }

  async function getErrorMessage(response) {
    try {
      const data = await response.json();

      return data.message || data.error || "Something went wrong.";
    } catch {
      return "Something went wrong.";
    }
  }

  function showError(message) {
    alert(message);
  }

  function showSuccess(message) {
    alert(message);
  }

  // =========================================================
  // LISTING PAGE
  // =========================================================

  const galleryGrid = document.getElementById("galleryGrid");

  if (galleryGrid) {
    initGalleryList();
  }

  async function initGalleryList() {
    const searchInput = document.getElementById("gallerySearch");

    const statusFilter = document.getElementById("galleryStatusFilter");

    const emptyState = document.getElementById("galleryEmpty");

    const pagination = document.getElementById("galleryPagination");

    let galleryItems = [];

    let filteredItems = [];

    let currentPage = 1;

    // ---------------------------------------------------------
    // LOAD GALLERY
    // ---------------------------------------------------------

    async function loadGallery() {
      galleryGrid.innerHTML = `
        <div class="col-12">
          <div class="text-center py-5">
            <div class="spinner-border"></div>
            <p class="mt-2 mb-0">
              Loading gallery...
            </p>
          </div>
        </div>
      `;

      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data = await response.json();

        galleryItems = Array.isArray(data)
          ? data
          : data.data || data.gallery || [];

        applyFilters();
      } catch (error) {
        console.error("Gallery loading error:", error);

        galleryGrid.innerHTML = `
          <div class="col-12">
            <div class="text-center py-5">
              <i class="bi bi-exclamation-circle fs-2"></i>

              <p class="mt-2 mb-0">
                Failed to load gallery images.
              </p>
            </div>
          </div>
        `;

        pagination.innerHTML = "";
      }
    }

    // ---------------------------------------------------------
    // FILTER
    // ---------------------------------------------------------

    function applyFilters() {
      const search = searchInput?.value?.trim().toLowerCase() || "";

      const status = statusFilter?.value || "";

      filteredItems = galleryItems.filter((item) => {
        const title = item.title?.toLowerCase() || "";

        const altText = item.alt_text?.toLowerCase() || "";

        const matchesSearch =
          !search || title.includes(search) || altText.includes(search);

        const itemStatus = item.is_active ? "active" : "inactive";

        const matchesStatus = !status || itemStatus === status;

        return matchesSearch && matchesStatus;
      });

      currentPage = 1;

      renderGallery();
      renderPagination();
    }

    // ---------------------------------------------------------
    // RENDER GALLERY
    // ---------------------------------------------------------

    function renderGallery() {
      if (!filteredItems.length) {
        galleryGrid.innerHTML = "";

        emptyState.style.display = "block";

        pagination.innerHTML = "";

        return;
      }

      emptyState.style.display = "none";

      const start = (currentPage - 1) * ITEMS_PER_PAGE;

      const end = start + ITEMS_PER_PAGE;

      const pageItems = filteredItems.slice(start, end);

      galleryGrid.innerHTML = pageItems.map(renderGalleryCard).join("");

      attachCardEvents();
    }

    // ---------------------------------------------------------
    // CARD
    // ---------------------------------------------------------

    function renderGalleryCard(item) {
      const imageUrl = getImageUrl(item.image);

      const isActive = Boolean(item.is_active);

      const statusText = isActive ? "Active" : "Inactive";

      return `
  <div class="col-12 col-sm-6 col-lg-4 col-xl-3">

    <div class="gallery-card">

      <div class="banner-card-image">

        <img
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(item.alt_text || item.title || "Gallery image")}"
          onerror="
            this.src='/assets/images/placeholder.jpg'
          "
        />

        <span class="banner-status ${isActive ? "active" : "inactive"}">
          ${statusText}
        </span>

      </div>


      <div class="banner-card-content">

        <div class="banner-card-title-row">
          <h4>
            ${escapeHtml(item.title || "Untitled Image")}
          </h4>
        </div>


        <div class="gallery-card-meta">

          <span>
            <i class="bi bi-sort-numeric-down"></i>
            Order: ${item.sort_order ?? 0}
          </span>

        </div>


        <div class="banner-card-actions">

          <button
            type="button"
            class="service-status-toggle ${isActive ? "active" : ""}"
            data-action="toggle"
            data-id="${item._id}"
            title="${isActive ? "Deactivate" : "Activate"}"
          >
            <i class="fa-solid ${
              isActive ? "fa-toggle-on" : "fa-toggle-off"
            }"></i>
          </button>


          <button
            type="button"
            class="banner-action-btn"
            data-action="edit"
            data-id="${item._id}"
            title="Edit"
          >
            <i class="bi bi-pencil"></i>
          </button>


          <button
            type="button"
            class="banner-action-btn delete"
            data-action="delete"
            data-id="${item._id}"
            title="Delete"
          >
            <i class="bi bi-trash"></i>
          </button>

        </div>

      </div>

    </div>

  </div>
`;
    }

    // ---------------------------------------------------------
    // CARD EVENTS
    // ---------------------------------------------------------

    function attachCardEvents() {
      galleryGrid.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", async () => {
          const action = button.dataset.action;

          const id = button.dataset.id;

          if (action === "edit") {
            window.location.href = `${FORM_PAGE_URL}?id=${id}`;

            return;
          }

          if (action === "delete") {
            await deleteGallery(id);

            return;
          }

          if (action === "toggle") {
            await toggleGallery(id, button);
          }
        });
      });
    }

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------

    async function deleteGallery(id) {
      const item = galleryItems.find((gallery) => gallery._id === id);

      const confirmed = confirm(
        `Are you sure you want to delete "${
          item?.title || "this gallery image"
        }"?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        showSuccess("Gallery image deleted successfully.");

        await loadGallery();
      } catch (error) {
        console.error("Delete gallery error:", error);

        showError(error.message || "Failed to delete gallery image.");
      }
    }

    // ---------------------------------------------------------
    // TOGGLE STATUS
    // ---------------------------------------------------------

    async function toggleGallery(id, button) {
      button.disabled = true;

      try {
        const response = await fetch(`${API_URL}/${id}/toggle-status`, {
          method: "PATCH",
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        await loadGallery();
      } catch (error) {
        console.error("Toggle status error:", error);

        showError(error.message || "Failed to update status.");

        button.disabled = false;
      }
    }

    // ---------------------------------------------------------
    // PAGINATION
    // ---------------------------------------------------------

    function renderPagination() {
      const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

      if (totalPages <= 1) {
        pagination.innerHTML = "";

        return;
      }

      let html = "";

      html += `
        <button
          type="button"
          class="pagination-btn"
          data-page="prev"
          ${currentPage === 1 ? "disabled" : ""}
        >
          <i class="bi bi-chevron-left"></i>
        </button>
      `;

      for (let page = 1; page <= totalPages; page++) {
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

      html += `
        <button
          type="button"
          class="pagination-btn"
          data-page="next"
          ${currentPage === totalPages ? "disabled" : ""}
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      `;

      pagination.innerHTML = html;

      pagination.querySelectorAll("[data-page]").forEach((button) => {
        button.addEventListener("click", () => {
          const value = button.dataset.page;

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

          renderGallery();
          renderPagination();

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        });
      });
    }

    // ---------------------------------------------------------
    // SEARCH
    // ---------------------------------------------------------

    searchInput?.addEventListener("input", applyFilters);

    statusFilter?.addEventListener("change", applyFilters);

    // INITIAL LOAD

    loadGallery();
  }

  // =========================================================
  // FORM PAGE
  // =========================================================

  const galleryForm = document.getElementById("galleryForm");

  if (galleryForm) {
    initGalleryForm();
  }

  function initGalleryForm() {
    const titleInput = document.getElementById("galleryTitle");

    const altTextInput = document.getElementById("galleryAltText");

    const sortOrderInput = document.getElementById("gallerySortOrder");

    const statusInput = document.getElementById("galleryStatus");

    const imageInput = document.getElementById("galleryImage");

    const imagePreview = document.getElementById("galleryImagePreview");

    const saveButton = document.getElementById("saveGalleryBtn");

    const saveButtonText = document.getElementById("saveGalleryButtonText");

    let selectedImage = null;

    let editingId = null;

    // ---------------------------------------------------------
    // CHECK EDIT MODE
    // ---------------------------------------------------------

    const params = new URLSearchParams(window.location.search);

    editingId = params.get("id");

    // ---------------------------------------------------------
    // IMAGE PREVIEW
    // ---------------------------------------------------------

    function renderImagePreview(src, label = "") {
      imagePreview.innerHTML = `
        <div
          class="gallery-preview-item"
          style="
            position:relative;
            width:100%;
            overflow:hidden;
            border-radius:10px;
          "
        >

          <img
            src="${escapeHtml(src)}"
            alt="Gallery preview"
            style="
              width:100%;
              height:220px;
              object-fit:cover;
              display:block;
            "
          >

          ${
            label
              ? `
                <span
                  style="
                    position:absolute;
                    left:10px;
                    bottom:10px;
                    background:rgba(0,0,0,.7);
                    color:#fff;
                    padding:5px 9px;
                    border-radius:5px;
                    font-size:11px;
                  "
                >
                  ${escapeHtml(label)}
                </span>
              `
              : ""
          }

        </div>
      `;
    }

    function renderPlaceholder() {
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

    // ---------------------------------------------------------
    // IMAGE SELECT
    // ---------------------------------------------------------

    imageInput?.addEventListener("change", () => {
      const file = imageInput.files?.[0];

      if (!file) {
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        showError("Please select a JPG, PNG or WebP image.");

        imageInput.value = "";

        selectedImage = null;

        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showError("Image size must be 2MB or less.");

        imageInput.value = "";

        selectedImage = null;

        return;
      }

      selectedImage = file;

      const reader = new FileReader();

      reader.onload = (event) => {
        renderImagePreview(event.target.result, "New Image");
      };

      reader.readAsDataURL(file);
    });

    // ---------------------------------------------------------
    // LOAD EXISTING GALLERY
    // ---------------------------------------------------------

    async function loadGalleryItem() {
      if (!editingId) {
        saveButtonText.textContent = "Save Image";

        return;
      }

      saveButtonText.textContent = "Loading...";

      saveButton.disabled = true;

      try {
        const response = await fetch(`${API_URL}/${editingId}`);

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const result = await response.json();

        const item = result.data || result.gallery || result;

        titleInput.value = item.title || "";

        altTextInput.value = item.alt_text || "";

        sortOrderInput.value = item.sort_order ?? 0;

        statusInput.value = item.is_active ? "active" : "inactive";

        if (item.image) {
          renderImagePreview(getImageUrl(item.image), "Current Image");
        } else {
          renderPlaceholder();
        }

        saveButtonText.textContent = "Update Image";
      } catch (error) {
        console.error("Load gallery error:", error);

        showError(error.message || "Failed to load gallery image.");

        window.location.href = LIST_PAGE_URL;
      } finally {
        saveButton.disabled = false;
      }
    }

    // ---------------------------------------------------------
    // SUBMIT
    // ---------------------------------------------------------

    galleryForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const title = titleInput.value.trim();

      const altText = altTextInput.value.trim();

      const sortOrder =
        sortOrderInput.value === "" ? 0 : Number(sortOrderInput.value);

      const isActive = statusInput.value === "active";

      if (!Number.isInteger(sortOrder) || sortOrder < 0) {
        showError("Sort order must be a valid number.");

        return;
      }

      // Create requires an image.
      if (!editingId && !selectedImage) {
        showError("Please choose a gallery image.");

        return;
      }

      saveButton.disabled = true;

      saveButtonText.textContent = editingId ? "Updating..." : "Saving...";

      try {
        const formData = new FormData();

        formData.append("title", title);

        formData.append("alt_text", altText);

        formData.append("sort_order", sortOrder);

        formData.append("is_active", String(isActive));

        // IMPORTANT:
        // Only send image when a NEW file
        // has actually been selected.
        if (selectedImage) {
          formData.append("image", selectedImage);
        }

        const url = editingId ? `${API_URL}/${editingId}` : API_URL;

        const method = editingId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        showSuccess(
          editingId
            ? "Gallery image updated successfully."
            : "Gallery image added successfully.",
        );

        window.location.href = LIST_PAGE_URL;
      } catch (error) {
        console.error("Save gallery error:", error);

        showError(error.message || "Failed to save gallery image.");

        saveButton.disabled = false;

        saveButtonText.textContent = editingId ? "Update Image" : "Save Image";
      }
    });

    loadGalleryItem();
  }
});
