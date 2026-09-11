document.addEventListener("DOMContentLoaded", () => {
  const serviceForm = document.getElementById("serviceForm");
  const servicesList = document.getElementById("servicesList");

  // =========================================================
  // PAGE DETECTION
  // =========================================================

  if (servicesList) {
    initServicesPage();
  }

  if (serviceForm) {
    initServiceForm();
  }
});

// =========================================================
// API CONFIG
// =========================================================

const SERVICE_API = "/api/services";

// =========================================================
// SERVICES LIST PAGE
// =========================================================

function initServicesPage() {
  const servicesList = document.getElementById("servicesList");
  const servicesEmpty = document.getElementById("servicesEmpty");

  const searchInput = document.getElementById("serviceSearch");
  const categoryFilter = document.getElementById("categoryFilter");
  const statusFilter = document.getElementById("statusFilter");

  let allServices = [];

  // ---------------------------------------------------------
  // FETCH SERVICES
  // ---------------------------------------------------------

  async function loadServices() {
    try {
      servicesList.innerHTML = `
        <div class="col-12">
          <div style="text-align:center;padding:50px 20px;">
            <i class="bi bi-arrow-repeat"
               style="font-size:28px;"></i>
            <p style="margin-top:10px;">Loading services...</p>
          </div>
        </div>
      `;

      const response = await fetch(SERVICE_API);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch services.");
      }

      allServices = data.services || [];

      renderServices(allServices);
    } catch (error) {
      console.error("Load services error:", error);

      servicesList.innerHTML = `
        <div class="col-12">
          <div style="text-align:center;padding:50px 20px;">
            <i class="bi bi-exclamation-circle"
               style="font-size:30px;"></i>
            <p style="margin-top:10px;">
              Failed to load services.
            </p>
          </div>
        </div>
      `;

      if (servicesEmpty) {
        servicesEmpty.style.display = "none";
      }
    }
  }

  // ---------------------------------------------------------
  // RENDER SERVICES
  // ---------------------------------------------------------

  function renderServices(services) {
    servicesList.innerHTML = "";

    if (!services.length) {
      servicesEmpty.style.display = "block";
      return;
    }

    servicesEmpty.style.display = "none";

    services.forEach((service) => {
      const serviceColumn = document.createElement("div");

      serviceColumn.className =
        "col-12 col-sm-6 col-lg-4 col-xl-3 service-column";

      serviceColumn.dataset.name = service.title || "";
      serviceColumn.dataset.category = service.category || "";
      serviceColumn.dataset.status = service.status || "";

      const imageUrl = getImageUrl(service.image);

      const categoryName = service.category || "Service";

      const statusClass =
        service.status === "published" ? "published" : "draft";

      const statusText = service.status === "published" ? "Published" : "Draft";

      serviceColumn.innerHTML = `
        <div class="service-card">

          <div class="service-card-image">

            <img
              src="${escapeHtml(imageUrl)}"
              alt="${escapeHtml(service.title)}"
              onerror="this.src='assets/images/no-image.jpg'"
            />

            <span class="service-category-badge">
              ${escapeHtml(categoryName)}
            </span>

          </div>

          <div class="service-card-body">

            <h3>${escapeHtml(service.title)}</h3>

            <div class="service-card-footer">

              <span class="service-status ${statusClass}">
                <i class="bi bi-circle-fill"></i>
                ${statusText}
              </span>

              <div class="service-actions">

                <label
                  class="service-toggle"
                  title="${
                    service.status === "published" ? "Move to Draft" : "Publish"
                  }"
                >
                  <input
                    type="checkbox"
                    class="service-status-toggle"
                    data-id="${service._id}"
                    ${service.status === "published" ? "checked" : ""}
                  />

                  <span class="service-toggle-slider"></span>
                </label>

                <button
                  type="button"
                  class="service-action edit"
                  title="Edit"
                  data-id="${service._id}"
                >
                  <i class="bi bi-pencil"></i>
                </button>

                <button
                  type="button"
                  class="service-action delete"
                  title="Delete"
                  data-id="${service._id}"
                >
                  <i class="bi bi-trash3"></i>
                </button>

              </div>

            </div>

          </div>

        </div>
      `;

      servicesList.appendChild(serviceColumn);
    });

    attachServiceEvents();
  }

  // ---------------------------------------------------------
  // SEARCH + FILTER
  // ---------------------------------------------------------

  function filterServices() {
    const searchValue = searchInput?.value.trim().toLowerCase() || "";

    const categoryValue = categoryFilter?.value.trim().toLowerCase() || "";

    const statusValue = statusFilter?.value.trim().toLowerCase() || "";

    const filteredServices = allServices.filter((service) => {
      const title = (service.title || "").toLowerCase();

      const category = (service.category || "").toLowerCase();

      const status = (service.status || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        category.includes(searchValue);

      const matchesCategory = !categoryValue || category === categoryValue;

      const matchesStatus = !statusValue || status === statusValue;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    renderServices(filteredServices);
  }

  searchInput?.addEventListener("input", filterServices);

  categoryFilter?.addEventListener("change", filterServices);

  statusFilter?.addEventListener("change", filterServices);

  // ---------------------------------------------------------
  // EVENTS
  // ---------------------------------------------------------

  function attachServiceEvents() {
    // EDIT
    document.querySelectorAll(".service-action.edit").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;

        window.location.href = `service-form.html?id=${encodeURIComponent(id)}`;
      });
    });

    // DELETE
    document.querySelectorAll(".service-action.delete").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.id;

        const service = allServices.find((item) => item._id === id);

        const serviceName = service?.title || "this service";

        const confirmed = confirm(
          `Are you sure you want to delete "${serviceName}"?`,
        );

        if (!confirmed) {
          return;
        }

        await deleteService(id);
      });
    });

    // TOGGLE STATUS
    document.querySelectorAll(".service-status-toggle").forEach((toggle) => {
      toggle.addEventListener("change", async () => {
        const id = toggle.dataset.id;

        // Prevent multiple clicks while request is running
        toggle.disabled = true;

        await toggleServiceStatus(id, toggle);
      });
    });
  }

  // ---------------------------------------------------------
  // DELETE SERVICE
  // ---------------------------------------------------------

  async function deleteService(id) {
    try {
      const response = await fetch(`${SERVICE_API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete service.");
      }

      // Remove from local array
      allServices = allServices.filter((service) => service._id !== id);

      // Re-render
      filterServices();

      alert("Service deleted successfully.");
    } catch (error) {
      console.error("Delete service error:", error);

      alert(error.message || "Failed to delete service.");
    }
  }

  // ---------------------------------------------------------
  // TOGGLE SERVICE STATUS
  // ---------------------------------------------------------

  async function toggleServiceStatus(id, toggle) {
    const previousState = toggle.checked;

    try {
      const response = await fetch(`${SERVICE_API}/${id}/toggle-status`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update service status.");
      }

      // Update local service data
      const service = allServices.find((item) => item._id === id);

      if (service) {
        service.status = data.status;
      }

      // Re-render so status text updates
      filterServices();
    } catch (error) {
      console.error("Toggle service status error:", error);

      // Restore previous toggle state
      toggle.checked = previousState;

      toggle.disabled = false;

      alert(error.message || "Failed to update service status.");
    }
  }

  // ---------------------------------------------------------
  // IMAGE URL
  // ---------------------------------------------------------

  function getImageUrl(image) {
    if (!image) {
      return "assets/images/no-image.jpg";
    }

    // Already a complete URL
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // Backend stores /uploads/filename
    if (image.startsWith("/")) {
      return image;
    }

    return `/${image}`;
  }

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------

  loadServices();
}

// =========================================================
// SERVICE FORM PAGE
// =========================================================

function initServiceForm() {
  const form = document.getElementById("serviceForm");

  const titleInput = document.getElementById("serviceTitle");

  const categoryInput = document.getElementById("serviceCategory");

  const shortDescriptionInput = document.getElementById("shortDescription");

  const contentInput = document.getElementById("serviceContent");

  const imageInput = document.getElementById("serviceImage");

  const imagePreview = document.getElementById("serviceImagePreview");

  const saveButtonText = document.getElementById("saveButtonText");

  const formPageTitle = document.getElementById("formPageTitle");

  const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");

  const shortDescriptionCount = document.getElementById(
    "shortDescriptionCount",
  );

  // ---------------------------------------------------------
  // DETECT ADD / EDIT MODE
  // ---------------------------------------------------------

  const params = new URLSearchParams(window.location.search);

  const serviceId = params.get("id");

  const isEditMode = Boolean(serviceId);

  // ---------------------------------------------------------
  // UPDATE UI FOR EDIT MODE
  // ---------------------------------------------------------

  if (isEditMode) {
    if (formPageTitle) {
      formPageTitle.textContent = "Edit Service";
    }

    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = "Edit Service";
    }

    if (saveButtonText) {
      saveButtonText.textContent = "Update Service";
    }

    loadService(serviceId);
  }

  // ---------------------------------------------------------
  // SHORT DESCRIPTION COUNTER
  // ---------------------------------------------------------

  function updateCharacterCount() {
    if (!shortDescriptionInput || !shortDescriptionCount) {
      return;
    }

    const length = shortDescriptionInput.value.length;

    shortDescriptionCount.textContent = `${length} / 180`;
  }

  shortDescriptionInput?.addEventListener("input", updateCharacterCount);

  // ---------------------------------------------------------
  // IMAGE PREVIEW
  // ---------------------------------------------------------

  imageInput?.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) {
      return;
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG or WebP image.");

      imageInput.value = "";

      return;
    }

    // Validate size
    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Image size must be less than 2MB.");

      imageInput.value = "";

      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      imagePreview.innerHTML = `
        <img
          src="${event.target.result}"
          alt="Service preview"
        />
      `;
    };

    reader.readAsDataURL(file);
  });

  // ---------------------------------------------------------
  // LOAD SERVICE FOR EDIT
  // ---------------------------------------------------------

  async function loadService(id) {
    try {
      const response = await fetch(`${SERVICE_API}/${id}`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load service.");
      }

      const service = data.service;

      // Fill form
      if (titleInput) {
        titleInput.value = service.title || "";
      }

      if (categoryInput) {
        categoryInput.value = service.category || "";
      }

      if (shortDescriptionInput) {
        shortDescriptionInput.value = service.shortDescription || "";
      }

      if (contentInput) {
        contentInput.value = service.content || "";
      }

      // Status
      const statusRadio = document.querySelector(
        `input[name="status"][value="${service.status}"]`,
      );

      if (statusRadio) {
        statusRadio.checked = true;
      }

      // Existing image
      if (service.image && imagePreview) {
        const imageUrl = getImageUrl(service.image);

        imagePreview.innerHTML = `
          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(service.title)}"
            onerror="this.style.display='none'"
          />
        `;
      }

      updateCharacterCount();
    } catch (error) {
      console.error("Load service error:", error);

      alert(error.message || "Failed to load service.");

      window.location.href = "services.html";
    }
  }

  // ---------------------------------------------------------
  // SUBMIT FORM
  // ---------------------------------------------------------

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // ---------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------

    if (!titleInput.value.trim()) {
      alert("Please enter the service title.");

      titleInput.focus();

      return;
    }

    if (!categoryInput.value.trim()) {
      alert("Please select a category.");

      categoryInput.focus();

      return;
    }

    if (!shortDescriptionInput.value.trim()) {
      alert("Please enter a short description.");

      shortDescriptionInput.focus();

      return;
    }

    if (!contentInput.value.trim()) {
      alert("Please enter the service content.");

      contentInput.focus();

      return;
    }

    // Image required only for CREATE
    if (!isEditMode && (!imageInput.files || !imageInput.files.length)) {
      alert("Please select a service image.");

      return;
    }

    // ---------------------------------------------
    // CREATE FORMDATA
    // ---------------------------------------------

    const formData = new FormData();

    formData.append("title", titleInput.value.trim());

    formData.append("category", categoryInput.value.trim());

    formData.append("shortDescription", shortDescriptionInput.value.trim());

    formData.append("content", contentInput.value);

    const selectedStatus = document.querySelector(
      'input[name="status"]:checked',
    );

    formData.append(
      "status",
      selectedStatus ? selectedStatus.value : "published",
    );

    // Image only when selected
    if (imageInput.files && imageInput.files.length) {
      formData.append("image", imageInput.files[0]);
    }

    // ---------------------------------------------
    // BUTTON STATE
    // ---------------------------------------------

    const submitButton = form.querySelector('button[type="submit"]');

    const originalButtonHTML = submitButton.innerHTML;

    submitButton.disabled = true;

    submitButton.innerHTML = `
      <i class="bi bi-arrow-repeat"></i>
      <span>
        ${isEditMode ? "Updating..." : "Saving..."}
      </span>
    `;

    try {
      const url = isEditMode ? `${SERVICE_API}/${serviceId}` : SERVICE_API;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save service.");
      }

      alert(
        isEditMode
          ? "Service updated successfully."
          : "Service created successfully.",
      );

      // Back to listing
      window.location.href = "services.html";
    } catch (error) {
      console.error("Save service error:", error);

      alert(error.message || "Failed to save service.");

      submitButton.disabled = false;

      submitButton.innerHTML = originalButtonHTML;
    }
  });

  // ---------------------------------------------------------
  // IMAGE URL
  // ---------------------------------------------------------

  function getImageUrl(image) {
    if (!image) {
      return "assets/images/no-image.jpg";
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("/")) {
      return image;
    }

    return `/${image}`;
  }
}

// =========================================================
// HTML ESCAPE
// =========================================================

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
