document.addEventListener("DOMContentLoaded", () => {
  const servicesList = document.getElementById("servicesList");

  if (!servicesList) return;

  const searchInput = document.getElementById("serviceSearch");

  const categoryFilter = document.getElementById("categoryFilter");

  const statusFilter = document.getElementById("statusFilter");

  const emptyState = document.getElementById("servicesEmpty");

  const paginationContainer = document.querySelector(".services-pagination");

  let services = [];

  // ========================================
  // PAGINATION
  // ========================================

  let currentPage = 1;

  const itemsPerPage = 8;

  // ========================================
  // LOAD SERVICES
  // ========================================

  async function loadServices() {
    try {
      const response = await fetch("/api/services");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch services.");
      }

      services = data.services || [];

      currentPage = 1;

      renderServices();
    } catch (error) {
      console.error("Load services error:", error);

      servicesList.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">
            Failed to load services.
          </div>
        </div>
      `;

      if (paginationContainer) {
        paginationContainer.style.display = "none";
      }
    }
  }

  // ========================================
  // GET FILTERED SERVICES
  // ========================================

  function getFilteredServices() {
    const searchTerm = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const category = categoryFilter ? categoryFilter.value : "";

    const status = statusFilter ? statusFilter.value : "";

    return services.filter((service) => {
      const title = service.title?.toLowerCase() || "";

      const shortDescription = service.shortDescription?.toLowerCase() || "";

      const serviceCategory = service.category?.toLowerCase() || "";

      // ====================================
      // SEARCH
      // ====================================

      const matchesSearch =
        !searchTerm ||
        title.includes(searchTerm) ||
        shortDescription.includes(searchTerm);

      // ====================================
      // CATEGORY
      // ====================================

      const matchesCategory =
        !category || serviceCategory === category.toLowerCase();

      // ====================================
      // STATUS
      // ====================================

      const matchesStatus = !status || service.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  // ========================================
  // RENDER SERVICES
  // ========================================

  function renderServices() {
    const filteredServices = getFilteredServices();

    servicesList.innerHTML = "";

    // ====================================
    // NO SERVICES
    // ====================================

    if (filteredServices.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
      }

      if (paginationContainer) {
        paginationContainer.style.display = "none";
      }

      return;
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    // ====================================
    // PAGINATION CALCULATION
    // ====================================

    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

    // ====================================
    // PROTECT CURRENT PAGE
    // ====================================

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    // ====================================
    // GET CURRENT PAGE ITEMS
    // ====================================

    const startIndex = (currentPage - 1) * itemsPerPage;

    const endIndex = startIndex + itemsPerPage;

    const paginatedServices = filteredServices.slice(startIndex, endIndex);

    // ====================================
    // RENDER SERVICE CARDS
    // ====================================

    paginatedServices.forEach((service) => {
      servicesList.insertAdjacentHTML("beforeend", createServiceCard(service));
    });

    // ====================================
    // RENDER PAGINATION
    // ====================================

    renderPagination(totalPages);
  }

  // ========================================
  // SERVICE CARD
  // ========================================

  function createServiceCard(service) {
    const isPublished = service.status === "published";

    // ====================================
    // GET FIRST SERVICE IMAGE
    // ====================================

    const serviceImage =
      Array.isArray(service.images) && service.images.length > 0
        ? service.images[0]
        : "";

    // ====================================
    // IMAGE HTML
    // ====================================

    const imageHTML = serviceImage
      ? `
          <img
            src="${escapeHtml(serviceImage)}"
            alt="${escapeHtml(service.title)}"
            loading="lazy"
          />
        `
      : `
          <div class="service-image-placeholder">
            <i class="bi bi-image"></i>
          </div>
        `;

    return `
      <div
        class="col-12 col-sm-6 col-lg-4 col-xl-3 service-column"
        data-id="${service._id}"
      >

        <div class="service-card">

          <!-- SERVICE IMAGE -->

          <div class="service-card-image">

            ${imageHTML}

            <span class="service-category-badge">
              ${escapeHtml(service.category)}
            </span>

          </div>

          <!-- SERVICE BODY -->

          <div class="service-card-body">

            <h3>
              ${escapeHtml(service.title)}
            </h3>

            <div class="service-card-footer">

              <!-- STATUS -->

              <span
                class="service-status ${isPublished ? "published" : "draft"}"
              >

                <i class="bi bi-circle-fill"></i>

                ${isPublished ? "Published" : "Draft"}

              </span>

              <!-- ACTIONS -->

              <div class="service-actions">

                <!-- STATUS TOGGLE -->

                <button
                  type="button"
                  class="service-status-toggle ${isPublished ? "active" : ""}"
                  data-id="${service._id}"
                  title="${isPublished ? "Move to draft" : "Publish"}"
                  aria-label="${isPublished ? "Move to draft" : "Publish"}"
                >

                  <i
                    class="fa-solid ${
                      isPublished ? "fa-toggle-on" : "fa-toggle-off"
                    }"
                  ></i>

                </button>

                <!-- EDIT -->

                <button
                  type="button"
                  class="service-action edit"
                  data-id="${service._id}"
                  title="Edit"
                  aria-label="Edit service"
                >

                  <i class="bi bi-pencil"></i>

                </button>

                <!-- DELETE -->

                <button
                  type="button"
                  class="service-action delete"
                  data-id="${service._id}"
                  title="Delete"
                  aria-label="Delete service"
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

  // ========================================
  // PAGINATION
  // ========================================

  function renderPagination(totalPages) {
    if (!paginationContainer) {
      return;
    }

    // ====================================
    // ONLY ONE PAGE
    // ====================================

    if (totalPages <= 1) {
      paginationContainer.style.display = "none";

      paginationContainer.innerHTML = "";

      return;
    }

    paginationContainer.style.display = "flex";

    let paginationHTML = "";

    // ====================================
    // PREVIOUS BUTTON
    // ====================================

    paginationHTML += `
      <button
        type="button"
        class="pagination-btn ${currentPage === 1 ? "disabled" : ""}"
        data-page="${currentPage - 1}"
        ${currentPage === 1 ? "disabled" : ""}
        aria-label="Previous page"
      >
        <i class="bi bi-chevron-left"></i>
      </button>
    `;

    // ====================================
    // PAGE NUMBERS
    // ====================================

    const pages = getPaginationPages(currentPage, totalPages);

    pages.forEach((page) => {
      // ==================================
      // DOTS
      // ==================================

      if (page === "...") {
        paginationHTML += `
            <span class="pagination-dots">
              ...
            </span>
          `;

        return;
      }

      // ==================================
      // PAGE BUTTON
      // ==================================

      paginationHTML += `
          <button
            type="button"
            class="pagination-btn ${page === currentPage ? "active" : ""}"
            data-page="${page}"
            aria-label="Page ${page}"
          >
            ${page}
          </button>
        `;
    });

    // ====================================
    // NEXT BUTTON
    // ====================================

    paginationHTML += `
      <button
        type="button"
        class="pagination-btn ${currentPage === totalPages ? "disabled" : ""}"
        data-page="${currentPage + 1}"
        ${currentPage === totalPages ? "disabled" : ""}
        aria-label="Next page"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
  }

  // ========================================
  // PAGINATION PAGE LOGIC
  // ========================================

  function getPaginationPages(current, total) {
    // ====================================
    // 5 OR FEWER
    // ====================================

    if (total <= 5) {
      return Array.from(
        {
          length: total,
        },
        (_, index) => index + 1,
      );
    }

    // ====================================
    // BEGINNING
    // ====================================

    if (current <= 3) {
      return [1, 2, 3, 4, "...", total];
    }

    // ====================================
    // END
    // ====================================

    if (current >= total - 2) {
      return [1, "...", total - 3, total - 2, total - 1, total];
    }

    // ====================================
    // MIDDLE
    // ====================================

    return [1, "...", current - 1, current, current + 1, "...", total];
  }

  // ========================================
  // PAGINATION CLICK
  // ========================================

  if (paginationContainer) {
    paginationContainer.addEventListener("click", (event) => {
      const button = event.target.closest(".pagination-btn");

      if (!button) return;

      if (button.disabled) {
        return;
      }

      const page = Number(button.dataset.page);

      if (!page) return;

      currentPage = page;

      renderServices();

      // ==================================
      // SCROLL TO SERVICES
      // ==================================

      document.querySelector(".services-page")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  // ========================================
  // SEARCH
  // ========================================

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentPage = 1;

      renderServices();
    });
  }

  // ========================================
  // CATEGORY FILTER
  // ========================================

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      currentPage = 1;

      renderServices();
    });
  }

  // ========================================
  // STATUS FILTER
  // ========================================

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      currentPage = 1;

      renderServices();
    });
  }

  // ========================================
  // SERVICE CARD ACTIONS
  // ========================================

  servicesList.addEventListener("click", async (event) => {
    // ====================================
    // STATUS TOGGLE
    // ====================================

    const toggleButton = event.target.closest(".service-status-toggle");

    if (toggleButton) {
      const id = toggleButton.dataset.id;

      if (!id) return;

      toggleButton.disabled = true;

      try {
        const response = await fetch(`/api/services/${id}/toggle-status`, {
          method: "PATCH",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to update status.");
        }

        // ==================================
        // UPDATE LOCAL SERVICE
        // ==================================

        const service = services.find((item) => item._id === id);

        if (service) {
          service.status = data.status;
        }

        // ==================================
        // RE-RENDER
        // ==================================

        renderServices();
      } catch (error) {
        console.error("Toggle service error:", error);

        alert(error.message);

        toggleButton.disabled = false;
      }

      return;
    }

    // ====================================
    // EDIT
    // ====================================

    const editButton = event.target.closest(".service-action.edit");

    if (editButton) {
      const id = editButton.dataset.id;

      if (!id) return;

      window.location.href = `/admin/service-form?id=${id}`;

      return;
    }

    // ====================================
    // DELETE
    // ====================================

    const deleteButton = event.target.closest(".service-action.delete");

    if (deleteButton) {
      const id = deleteButton.dataset.id;

      if (!id) return;

      await deleteService(id);

      return;
    }
  });

  // ========================================
  // DELETE SERVICE
  // ========================================

  async function deleteService(id) {
    const service = services.find((item) => item._id === id);

    if (!service) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${service.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete service.");
      }

      // ====================================
      // REMOVE FROM LOCAL ARRAY
      // ====================================

      services = services.filter((item) => item._id !== id);

      // ====================================
      // RE-RENDER
      // ====================================

      renderServices();
    } catch (error) {
      console.error("Delete service error:", error);

      alert(error.message);
    }
  }

  // ========================================
  // ESCAPE HTML
  // ========================================

  function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
  }

  // ========================================
  // INITIAL LOAD
  // ========================================

  loadServices();
});
