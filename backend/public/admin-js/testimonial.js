document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/testimonials";

  const LIST_PAGE_URL = "/admin/testimonials";
  const FORM_PAGE_URL = "/admin/testimonial-form";

  const ITEMS_PER_PAGE = 5;
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  /* =========================================================
     COMMON HELPERS
  ========================================================= */

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showMessage(message, type = "error") {
    alert(message);
  }

  function getImageUrl(imageUrl) {
    if (!imageUrl) {
      return "/assets/images/user.jpg";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return imageUrl;
    }

    return `/${imageUrl}`;
  }

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /* =========================================================
     LISTING PAGE
  ========================================================= */

  const tableBody = document.getElementById("testimonialsTableBody");

  if (tableBody) {
    initTestimonialsList();
  }

  async function initTestimonialsList() {
    const emptyState = document.getElementById("testimonialsEmpty");
    const pagination = document.getElementById("testimonialsPagination");
    const countElement = document.getElementById("testimonialsCount");
    const searchInput = document.getElementById("testimonialSearch");

    let testimonials = [];
    let filteredTestimonials = [];
    let currentPage = 1;

    /* ---------------------------------------------------------
       LOAD TESTIMONIALS
    --------------------------------------------------------- */

    async function loadTestimonials() {
      try {
        showTableLoading();

        const response = await fetch(API_URL);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load testimonials");
        }

        testimonials = data.testimonials || [];

        applyFilters();
      } catch (error) {
        console.error("Load testimonials error:", error);

        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; padding:40px;">
              <div>
                <i class="bi bi-exclamation-circle"
                   style="font-size:28px;"></i>

                <p style="margin-top:10px;">
                  Failed to load testimonials.
                </p>

                <button
                  type="button"
                  id="retryTestimonials"
                  class="add-testimonial-btn"
                >
                  Try Again
                </button>
              </div>
            </td>
          </tr>
        `;

        if (pagination) {
          pagination.innerHTML = "";
        }

        const retryButton = document.getElementById("retryTestimonials");

        retryButton?.addEventListener("click", loadTestimonials);
      }
    }

    /* ---------------------------------------------------------
       SEARCH / FILTER
    --------------------------------------------------------- */

    function applyFilters() {
      const searchTerm = searchInput?.value.trim().toLowerCase() || "";

      filteredTestimonials = testimonials.filter((testimonial) => {
        const name = testimonial.name?.toLowerCase() || "";

        const designation = testimonial.designation?.toLowerCase() || "";

        const content = testimonial.content?.toLowerCase() || "";

        return (
          name.includes(searchTerm) ||
          designation.includes(searchTerm) ||
          content.includes(searchTerm)
        );
      });

      currentPage = 1;

      renderTestimonials();
      renderPagination();
      updateCount();
    }

    searchInput?.addEventListener("input", applyFilters);

    /* ---------------------------------------------------------
       RENDER TABLE
    --------------------------------------------------------- */

    function renderTestimonials() {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;

      const end = start + ITEMS_PER_PAGE;

      const pageItems = filteredTestimonials.slice(start, end);

      if (!pageItems.length) {
        tableBody.innerHTML = "";

        if (emptyState) {
          emptyState.style.display = "block";
        }

        return;
      }

      if (emptyState) {
        emptyState.style.display = "none";
      }

      tableBody.innerHTML = pageItems
        .map((testimonial) => {
          const isActive = testimonial.isActive !== false;

          const rating = Number(testimonial.rating || 0);

          const stars = createStars(rating);

          const image = getImageUrl(testimonial.imageUrl);

          return `
            <tr class="testimonial-row"
                data-id="${escapeHtml(testimonial._id)}">

              <!-- CUSTOMER -->

              <td class="testimonial-customer-cell">

                <div class="customer-avatar">
                  <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(testimonial.name)}"
                    onerror="this.src='/assets/images/user.jpg'"
                  />
                </div>

                <div class="customer-info">

                  <strong>
                    ${escapeHtml(testimonial.name)}
                  </strong>

                  <span>
                    ${escapeHtml(testimonial.designation || "Customer")}
                  </span>

                </div>

              </td>


              <!-- SERVICE -->

              <td>
                <span class="testimonial-service">
                  ${escapeHtml(testimonial.content || "-")}
                </span>
              </td>


              <!-- RATING -->

              <td>
                <div class="testimonial-rating">
                  ${stars}
                </div>
              </td>


              <!-- STATUS -->

              <td>

                <button
                  type="button"
                  class="testimonial-status-toggle ${isActive ? "active" : ""}"
                  data-id="${escapeHtml(testimonial._id)}"
                  title="${isActive ? "Move to draft" : "Publish testimonial"}"
                  aria-label="${
                    isActive ? "Move to draft" : "Publish testimonial"
                  }"
                >
                  <i class="bi ${
                    isActive ? "bi-toggle-on" : "bi-toggle-off"
                  }"></i>
                </button>

                <span
                  class="testimonial-status ${isActive ? "published" : "draft"}"
                >
                  ${isActive ? "Published" : "Draft"}
                </span>

              </td>


              <!-- ACTIONS -->

              <td>

                <div class="testimonial-actions">

                  <button
                    type="button"
                    class="testimonial-action edit"
                    data-id="${escapeHtml(testimonial._id)}"
                    title="Edit testimonial"
                    aria-label="Edit testimonial"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>

                  <button
                    type="button"
                    class="testimonial-action delete"
                    data-id="${escapeHtml(testimonial._id)}"
                    title="Delete testimonial"
                    aria-label="Delete testimonial"
                  >
                    <i class="bi bi-trash3"></i>
                  </button>

                </div>

              </td>

            </tr>
          `;
        })
        .join("");

      attachRowEvents();
    }

    /* ---------------------------------------------------------
       STARS
    --------------------------------------------------------- */

    function createStars(rating) {
      let html = "";

      for (let i = 1; i <= 5; i++) {
        html += `
          <i class="bi ${i <= rating ? "bi-star-fill" : "bi-star"}"></i>
        `;
      }

      return html;
    }

    /* ---------------------------------------------------------
       ROW EVENTS
    --------------------------------------------------------- */

    function attachRowEvents() {
      /* EDIT */

      document
        .querySelectorAll(".testimonial-action.edit")
        .forEach((button) => {
          button.addEventListener("click", () => {
            const id = button.dataset.id;

            window.location.href = `${FORM_PAGE_URL}?id=${encodeURIComponent(id)}`;
          });
        });

      /* DELETE */

      document
        .querySelectorAll(".testimonial-action.delete")
        .forEach((button) => {
          button.addEventListener("click", async () => {
            const id = button.dataset.id;

            const testimonial = testimonials.find((item) => item._id === id);

            const name = testimonial?.name || "this testimonial";

            const confirmed = confirm(
              `Delete testimonial from ${name}?\n\nThis action cannot be undone.`,
            );

            if (!confirmed) return;

            await deleteTestimonial(id, button);
          });
        });

      /* STATUS */

      document
        .querySelectorAll(".testimonial-status-toggle")
        .forEach((button) => {
          button.addEventListener("click", async () => {
            const id = button.dataset.id;

            await toggleTestimonialStatus(id, button);
          });
        });
    }

    /* ---------------------------------------------------------
       DELETE
    --------------------------------------------------------- */

    async function deleteTestimonial(id, button) {
      try {
        button.disabled = true;

        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to delete testimonial");
        }

        testimonials = testimonials.filter((item) => item._id !== id);

        applyFilters();
      } catch (error) {
        console.error("Delete testimonial error:", error);

        showMessage(error.message || "Failed to delete testimonial");

        button.disabled = false;
      }
    }

    /* ---------------------------------------------------------
       TOGGLE STATUS
    --------------------------------------------------------- */

    async function toggleTestimonialStatus(id, button) {
      try {
        button.disabled = true;

        const response = await fetch(`${API_URL}/${id}/toggle-status`, {
          method: "PATCH",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to update testimonial status",
          );
        }

        // Find the testimonial in the local array
        const testimonial = testimonials.find((item) => item._id === id);

        if (testimonial) {
          // Update UI state immediately
          testimonial.isActive = !testimonial.isActive;
        }

        // Re-render the current page
        renderTestimonials();
        renderPagination();
        updateCount();
      } catch (error) {
        console.error("Toggle testimonial status error:", error);

        showMessage(error.message || "Failed to update status");

        button.disabled = false;
      }
    }
    /* ---------------------------------------------------------
       PAGINATION
    --------------------------------------------------------- */

    function renderPagination() {
      if (!pagination) return;

      const totalPages = Math.ceil(
        filteredTestimonials.length / ITEMS_PER_PAGE,
      );

      pagination.innerHTML = "";

      if (totalPages <= 1) {
        return;
      }

      /* PREVIOUS */

      const previousButton = document.createElement("button");

      previousButton.type = "button";

      previousButton.className = "pagination-btn";

      previousButton.innerHTML = `<i class="bi bi-chevron-left"></i>`;

      previousButton.disabled = currentPage === 1;

      if (currentPage === 1) {
        previousButton.classList.add("disabled");
      }

      previousButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;

          renderTestimonials();
          renderPagination();
          updateCount();
        }
      });

      pagination.appendChild(previousButton);

      /* PAGE NUMBERS */

      const pages = getPaginationPages(currentPage, totalPages);

      pages.forEach((page) => {
        if (page === "...") {
          const dots = document.createElement("span");

          dots.className = "pagination-dots";

          dots.textContent = "...";

          pagination.appendChild(dots);

          return;
        }

        const pageButton = document.createElement("button");

        pageButton.type = "button";

        pageButton.className = "pagination-btn";

        if (page === currentPage) {
          pageButton.classList.add("active");
        }

        pageButton.textContent = page;

        pageButton.addEventListener("click", () => {
          currentPage = page;

          renderTestimonials();
          renderPagination();
          updateCount();
        });

        pagination.appendChild(pageButton);
      });

      /* NEXT */

      const nextButton = document.createElement("button");

      nextButton.type = "button";

      nextButton.className = "pagination-btn";

      nextButton.innerHTML = `<i class="bi bi-chevron-right"></i>`;

      nextButton.disabled = currentPage === totalPages;

      if (currentPage === totalPages) {
        nextButton.classList.add("disabled");
      }

      nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;

          renderTestimonials();
          renderPagination();
          updateCount();
        }
      });

      pagination.appendChild(nextButton);
    }

    /* ---------------------------------------------------------
       PAGINATION LOGIC
    --------------------------------------------------------- */

    function getPaginationPages(current, total) {
      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }

      const pages = [];

      pages.push(1);

      if (current > 3) {
        pages.push("...");
      }

      const start = Math.max(2, current - 1);

      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push("...");
      }

      pages.push(total);

      return pages;
    }

    /* ---------------------------------------------------------
       COUNT
    --------------------------------------------------------- */

    function updateCount() {
      if (!countElement) return;

      const total = filteredTestimonials.length;

      if (total === 0) {
        countElement.innerHTML = `
          Showing <strong>0</strong>
          to <strong>0</strong>
          of <strong>0</strong> entries
        `;

        return;
      }

      const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;

      const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

      countElement.innerHTML = `
        Showing
        <strong>${start}</strong>
        to
        <strong>${end}</strong>
        of
        <strong>${total}</strong>
        entries
      `;
    }

    /* ---------------------------------------------------------
       LOADING
    --------------------------------------------------------- */

    function showTableLoading() {
      tableBody.innerHTML = `
        <tr>
          <td
            colspan="5"
            style="
              text-align:center;
              padding:50px 20px;
            "
          >
            <div>
              <div
                class="spinner-border"
                role="status"
                style="
                  width:28px;
                  height:28px;
                "
              ></div>

              <p style="margin-top:12px;">
                Loading testimonials...
              </p>
            </div>
          </td>
        </tr>
      `;
    }

    await loadTestimonials();
  }

  /* =========================================================
     FORM PAGE
  ========================================================= */

  const testimonialForm = document.getElementById("testimonialForm");

  if (testimonialForm) {
    initTestimonialForm();
  }

  function initTestimonialForm() {
    const nameInput = document.getElementById("customerName");

    const roleInput = document.getElementById("customerRole");

    const contentInput = document.getElementById("testimonialContent");

    const ratingInput = document.getElementById("rating");

    const ratingSelector = document.getElementById("ratingSelector");

    const ratingValue = document.getElementById("ratingValue");

    const statusInput = document.getElementById("testimonialStatus");

    const imageInput = document.getElementById("customerImage");

    const imagePreview = document.getElementById("testimonialImagePreview");

    const countElement = document.getElementById("testimonialCount");

    const saveButton = testimonialForm.querySelector('button[type="submit"]');

    const saveButtonText = document.getElementById("saveButtonText");

    const pageTitle = document.getElementById("formPageTitle");

    const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");

    const params = new URLSearchParams(window.location.search);

    const testimonialId = params.get("id");

    const isEditMode = Boolean(testimonialId);

    let selectedImage = null;
    let previewObjectUrl = null;

    /* ---------------------------------------------------------
       EDIT MODE UI
    --------------------------------------------------------- */

    if (isEditMode) {
      if (pageTitle) {
        pageTitle.textContent = "Edit Testimonial";
      }

      if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = "Edit Testimonial";
      }

      if (saveButtonText) {
        saveButtonText.textContent = "Update Testimonial";
      }

      loadTestimonial(testimonialId);
    }

    /* ---------------------------------------------------------
       RATING
    --------------------------------------------------------- */

    function setRating(rating) {
      rating = Math.max(1, Math.min(5, Number(rating)));

      if (ratingInput) {
        ratingInput.value = rating;
      }

      if (ratingValue) {
        ratingValue.textContent = `${rating} / 5`;
      }

      if (ratingSelector) {
        ratingSelector.querySelectorAll(".rating-star").forEach((star) => {
          const starRating = Number(star.dataset.rating);

          const icon = star.querySelector("i");

          if (starRating <= rating) {
            star.classList.add("active");

            icon?.classList.remove("bi-star");

            icon?.classList.add("bi-star-fill");
          } else {
            star.classList.remove("active");

            icon?.classList.remove("bi-star-fill");

            icon?.classList.add("bi-star");
          }
        });
      }
    }

    ratingSelector?.querySelectorAll(".rating-star").forEach((star) => {
      star.addEventListener("click", () => {
        setRating(star.dataset.rating);
      });
    });

    /* ---------------------------------------------------------
       CONTENT COUNTER
    --------------------------------------------------------- */

    function updateContentCount() {
      if (!contentInput || !countElement) {
        return;
      }

      const length = contentInput.value.length;

      countElement.textContent = `${length} / 500`;
    }

    contentInput?.addEventListener("input", updateContentCount);

    /* ---------------------------------------------------------
       IMAGE
    --------------------------------------------------------- */

    imageInput?.addEventListener("change", () => {
      const file = imageInput.files?.[0];

      if (!file) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        showMessage("Please select a JPG, PNG or WebP image.");

        imageInput.value = "";

        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showMessage("Image size must be 2MB or less.");

        imageInput.value = "";

        return;
      }

      selectedImage = file;

      showNewImagePreview(file);
    });

    function showNewImagePreview(file) {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }

      previewObjectUrl = URL.createObjectURL(file);

      imagePreview.innerHTML = `
        <div class="testimonial-preview-image">
          <img
            src="${previewObjectUrl}"
            alt="New customer image"
          />

          

          <span class="testimonial-preview-label">
            New image
          </span>
        </div>
      `;

      document
        .getElementById("removeTestimonialImage")
        ?.addEventListener("click", () => {
          selectedImage = null;

          imageInput.value = "";

          showImagePlaceholder();
        });
    }

    function showExistingImage(imageUrl) {
      imagePreview.innerHTML = `
        <div class="testimonial-preview-image">

          <img
            src="${escapeHtml(getImageUrl(imageUrl))}"
            alt="Customer image"
            onerror="this.src='/assets/images/user.jpg'"
          />

          

          <span class="testimonial-preview-label">
            Current image
          </span>

        </div>
      `;

      document
        .getElementById("removeTestimonialImage")
        ?.addEventListener("click", () => {
          selectedImage = null;

          imageInput.value = "";

          showImagePlaceholder();
        });
    }

    function showImagePlaceholder() {
      imagePreview.innerHTML = `
        <div class="image-placeholder">

          <i class="bi bi-person"></i>

          <strong>
            No image selected
          </strong>

          <span>
            JPG, PNG or WebP
          </span>

        </div>
      `;
    }

    /* ---------------------------------------------------------
       LOAD SINGLE TESTIMONIAL
    --------------------------------------------------------- */

    async function loadTestimonial(id) {
      try {
        const response = await fetch(`${API_URL}/${id}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load testimonial");
        }

        const testimonial = data.testimonial;

        if (!testimonial) {
          throw new Error("Testimonial not found");
        }

        nameInput.value = testimonial.name || "";

        roleInput.value = testimonial.designation || "";

        contentInput.value = testimonial.content || "";

        setRating(testimonial.rating || 5);

        statusInput.value =
          testimonial.isActive === false ? "draft" : "published";

        updateContentCount();

        if (testimonial.imageUrl) {
          showExistingImage(testimonial.imageUrl);
        } else {
          showImagePlaceholder();
        }
      } catch (error) {
        console.error("Load testimonial error:", error);

        showMessage(error.message || "Failed to load testimonial");
      }
    }

    /* ---------------------------------------------------------
       SUBMIT
    --------------------------------------------------------- */

    testimonialForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = nameInput.value.trim();

      const designation = roleInput.value.trim();

      const content = contentInput.value.trim();

      const rating = Number(ratingInput.value);

      const isActive = statusInput.value === "published";

      if (!name) {
        showMessage("Customer name is required.");

        nameInput.focus();

        return;
      }

      if (!content) {
        showMessage("Testimonial content is required.");

        contentInput.focus();

        return;
      }

      if (rating < 1 || rating > 5) {
        showMessage("Please select a rating between 1 and 5.");

        return;
      }

      /* -----------------------------------------------------
           FORM DATA
        ----------------------------------------------------- */

      const formData = new FormData();

      formData.append("name", name);

      formData.append("designation", designation);

      formData.append("content", content);

      formData.append("rating", rating);

      formData.append("isActive", isActive);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const method = isEditMode ? "PUT" : "POST";

      const url = isEditMode ? `${API_URL}/${testimonialId}` : API_URL;

      setSaveButtonLoading(true);

      try {
        const response = await fetch(url, {
          method,
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Failed to ${isEditMode ? "update" : "create"} testimonial`,
          );
        }

        showMessage(
          isEditMode
            ? "Testimonial updated successfully."
            : "Testimonial created successfully.",
          "success",
        );

        window.location.href = LIST_PAGE_URL;
      } catch (error) {
        console.error("Save testimonial error:", error);

        showMessage(
          error.message || "Something went wrong while saving the testimonial.",
        );

        setSaveButtonLoading(false);
      }
    });

    /* ---------------------------------------------------------
       BUTTON LOADING
    --------------------------------------------------------- */

    function setSaveButtonLoading(loading) {
      if (!saveButton) return;

      saveButton.disabled = loading;

      if (loading) {
        saveButton.innerHTML = `
          <span
            class="spinner-border spinner-border-sm"
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
            ${isEditMode ? "Update Testimonial" : "Save Testimonial"}
          </span>
        `;
      }
    }

    /* ---------------------------------------------------------
       INITIAL
    --------------------------------------------------------- */

    setRating(Number(ratingInput?.value || 5));

    updateContentCount();
  }
});
