document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("enquiriesTableBody");

  if (!tableBody) return;

  const searchInput = document.getElementById("enquirySearch");

  const statusFilter = document.getElementById("enquiryStatusFilter");

  const emptyState = document.getElementById("enquiriesEmpty");

  const pagination = document.getElementById("enquiriesPagination");

  const startCount = document.getElementById("enquiryStartCount");

  const endCount = document.getElementById("enquiryEndCount");

  const totalCount = document.getElementById("enquiryTotalCount");

  // =====================================================
  // CONFIG
  // =====================================================

  const API_URL = "/api/enquiries";

  const ITEMS_PER_PAGE = 8;

  // =====================================================
  // STATE
  // =====================================================

  let enquiries = [];

  let filteredEnquiries = [];

  let currentPage = 1;

  // =====================================================
  // LOAD ENQUIRIES
  // =====================================================

  async function loadEnquiries() {
    try {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:40px;color:#999;">
            Loading enquiries...
          </td>
        </tr>
      `;

      const response = await fetch(API_URL);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch enquiries.");
      }

      enquiries = Array.isArray(data.enquiries) ? data.enquiries : [];

      applyFilters();
    } catch (error) {
      console.error("Load enquiries error:", error);

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="7"
            style="text-align:center;padding:40px;color:#d9534f;"
          >
            Failed to load enquiries.
          </td>
        </tr>
      `;

      updateCounts(0, 0, 0);
    }
  }

  // =====================================================
  // FILTER
  // =====================================================

  function applyFilters() {
    const searchValue = searchInput?.value.trim().toLowerCase() || "";

    const statusValue = statusFilter?.value || "";

    filteredEnquiries = enquiries.filter((enquiry) => {
      const name = String(enquiry.name || "").toLowerCase();

      const phone = String(enquiry.phone || "").toLowerCase();

      const email = String(enquiry.email || "").toLowerCase();

      const message = String(enquiry.message || "").toLowerCase();

      const source = String(enquiry.source || "").toLowerCase();

      const service = String(enquiry.service?.title || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        phone.includes(searchValue) ||
        email.includes(searchValue) ||
        message.includes(searchValue) ||
        source.includes(searchValue) ||
        service.includes(searchValue);

      const matchesStatus = !statusValue || enquiry.status === statusValue;

      return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(
      1,
      Math.ceil(filteredEnquiries.length / ITEMS_PER_PAGE),
    );

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    renderEnquiries();
    renderPagination();
    updateFooter();
  }

  // =====================================================
  // RENDER ENQUIRIES
  // =====================================================

  function renderEnquiries() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    const endIndex = startIndex + ITEMS_PER_PAGE;

    const pageItems = filteredEnquiries.slice(startIndex, endIndex);

    tableBody.innerHTML = "";

    if (!pageItems.length) {
      emptyState?.classList.add("show");

      updateCounts(0, 0, 0);

      return;
    }

    emptyState?.classList.remove("show");

    pageItems.forEach((enquiry) => {
      const row = document.createElement("tr");

      row.className = "enquiry-row";

      const customerName = escapeHtml(enquiry.name || "Unknown");

      const phone = escapeHtml(enquiry.phone || "—");

      const email = escapeHtml(enquiry.email || "");

      const serviceTitle = enquiry.service?.title
        ? escapeHtml(enquiry.service.title)
        : "";

      const source = enquiry.source === "service" ? "Service" : "Contact";

      const sourceClass = enquiry.source === "service" ? "service" : "contact";

      const status = enquiry.status || "new";

      const statusLabel = formatStatus(status);

      const date = formatDate(enquiry.createdAt);

      row.innerHTML = `

        <!-- CUSTOMER -->

        <td>

          <div class="enquiry-customer-cell">

            <div class="enquiry-customer-avatar">
              <i class="bi bi-person"></i>
            </div>

            <div class="enquiry-customer-info">

              <strong>
                ${customerName}
              </strong>

              <span>
                ${phone}
              </span>

            </div>

          </div>

        </td>


        <!-- SOURCE -->

        <td>

          <span
            class="enquiry-source ${sourceClass}"
          >
            ${source}
          </span>

        </td>


        <!-- SERVICE -->

        <td>

          ${
            serviceTitle
              ? `
                <span class="enquiry-service">
                  ${serviceTitle}
                </span>
              `
              : `
                <span class="enquiry-no-service">
                  General Contact
                </span>
              `
          }

        </td>


        <!-- CONTACT -->

        <td>

          <div class="enquiry-contact-info">

            <a href="tel:${escapeAttribute(enquiry.phone || "")}">
              ${phone}
            </a>

            ${
              email
                ? `
                  <a
                    href="mailto:${escapeAttribute(enquiry.email)}"
                  >
                    ${email}
                  </a>
                `
                : ""
            }

          </div>

        </td>


        <!-- STATUS -->

        <td>

          <span
            class="enquiry-status ${status}"
          >
            ${statusLabel}
          </span>

        </td>


        <!-- DATE -->

        <td>

          <span class="enquiry-date">
            ${date}
          </span>

        </td>


        <!-- ACTIONS -->

        <td>

          <div class="enquiry-actions">

            <button
              type="button"
              class="enquiry-action view"
              data-id="${enquiry._id}"
              title="View enquiry"
            >
              <i class="bi bi-eye"></i>
            </button>

            <button
              type="button"
              class="enquiry-action delete"
              data-id="${enquiry._id}"
              title="Delete enquiry"
            >
              <i class="bi bi-trash3"></i>
            </button>

          </div>

        </td>

      `;

      tableBody.appendChild(row);
    });
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  function renderPagination() {
    if (!pagination) return;

    const totalPages = Math.max(
      1,
      Math.ceil(filteredEnquiries.length / ITEMS_PER_PAGE),
    );

    pagination.innerHTML = "";

    // Previous

    const previousButton = createPaginationButton(
      '<i class="bi bi-chevron-left"></i>',
      currentPage === 1,
    );

    previousButton.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;

        renderEnquiries();
        renderPagination();
        updateFooter();
      }
    });

    pagination.appendChild(previousButton);

    // Pages

    const pages = getPageNumbers(currentPage, totalPages);

    pages.forEach((page) => {
      if (page === "...") {
        const dots = document.createElement("span");

        dots.className = "enquiry-pagination-dots";

        dots.textContent = "...";

        pagination.appendChild(dots);

        return;
      }

      const button = createPaginationButton(page, false);

      if (page === currentPage) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        currentPage = page;

        renderEnquiries();
        renderPagination();
        updateFooter();
      });

      pagination.appendChild(button);
    });

    // Next

    const nextButton = createPaginationButton(
      '<i class="bi bi-chevron-right"></i>',
      currentPage === totalPages,
    );

    nextButton.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;

        renderEnquiries();
        renderPagination();
        updateFooter();
      }
    });

    pagination.appendChild(nextButton);
  }

  // =====================================================
  // PAGE NUMBERS
  // =====================================================

  function getPageNumbers(current, total) {
    if (total <= 5) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, "...", total];
    }

    if (current >= total - 2) {
      return [1, "...", total - 2, total - 1, total];
    }

    return [1, "...", current, "...", total];
  }

  // =====================================================
  // PAGINATION BUTTON
  // =====================================================

  function createPaginationButton(content, disabled) {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "enquiry-pagination-btn";

    button.innerHTML = content;

    button.disabled = disabled;

    return button;
  }

  // =====================================================
  // FOOTER
  // =====================================================

  function updateFooter() {
    const total = filteredEnquiries.length;

    if (!total) {
      updateCounts(0, 0, 0);
      return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;

    const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

    updateCounts(start, end, total);
  }

  function updateCounts(start, end, total) {
    if (startCount) {
      startCount.textContent = start;
    }

    if (endCount) {
      endCount.textContent = end;
    }

    if (totalCount) {
      totalCount.textContent = total;
    }
  }

  // =====================================================
  // VIEW ENQUIRY
  // =====================================================

  async function viewEnquiry(id) {
    const enquiry = enquiries.find((item) => item._id === id);

    if (!enquiry) return;

    showEnquiryModal(enquiry);
  }

  // =====================================================
  // VIEW MODAL
  // =====================================================

  function showEnquiryModal(enquiry) {
    const existingModal = document.getElementById("enquiryViewModal");

    if (existingModal) {
      existingModal.remove();
    }

    const serviceTitle = enquiry.service?.title || "General Contact";

    const sourceLabel =
      enquiry.source === "service" ? "Service Enquiry" : "Contact Enquiry";

    const status = enquiry.status || "new";

    const modal = document.createElement("div");

    modal.id = "enquiryViewModal";

    modal.className = "enquiry-view-modal";

    modal.innerHTML = `

      <div class="enquiry-view-overlay">

        <div class="enquiry-view-box">

          <div class="enquiry-view-header">

            <div>

              <span class="enquiry-view-eyebrow">
                ${sourceLabel}
              </span>

              <h3>
                Enquiry Details
              </h3>

            </div>

            <button
              type="button"
              class="enquiry-view-close"
            >
              <i class="bi bi-x-lg"></i>
            </button>

          </div>


          <div class="enquiry-view-body">

            <div class="enquiry-detail-grid">

              <div class="enquiry-detail-item">

                <span>
                  Customer
                </span>

                <strong>
                  ${escapeHtml(enquiry.name || "—")}
                </strong>

              </div>


              <div class="enquiry-detail-item">

                <span>
                  Phone
                </span>

                <strong>
                  ${escapeHtml(enquiry.phone || "—")}
                </strong>

              </div>


              <div class="enquiry-detail-item">

                <span>
                  Email
                </span>

                <strong>
                  ${escapeHtml(enquiry.email || "Not provided")}
                </strong>

              </div>


              <div class="enquiry-detail-item">

                <span>
                  Service
                </span>

                <strong>
                  ${escapeHtml(serviceTitle)}
                </strong>

              </div>


              <div class="enquiry-detail-item">

                <span>
                  Submitted
                </span>

                <strong>
                  ${formatDateTime(enquiry.createdAt)}
                </strong>

              </div>


              <div class="enquiry-detail-item">

                <span>
                  Status
                </span>

                <select
                  class="enquiry-detail-status"
                  id="modalEnquiryStatus"
                >

                  <option
                    value="new"
                    ${status === "new" ? "selected" : ""}
                  >
                    New
                  </option>

                  <option
                    value="contacted"
                    ${status === "contacted" ? "selected" : ""}
                  >
                    Contacted
                  </option>

                  <option
                    value="in-progress"
                    ${status === "in-progress" ? "selected" : ""}
                  >
                    In Progress
                  </option>

                  <option
                    value="completed"
                    ${status === "completed" ? "selected" : ""}
                  >
                    Completed
                  </option>

                  <option
                    value="cancelled"
                    ${status === "cancelled" ? "selected" : ""}
                  >
                    Cancelled
                  </option>

                </select>

              </div>

            </div>


            <div class="enquiry-detail-message">

              <span>
                Message
              </span>

              <div>
                ${
                  enquiry.message
                    ? escapeHtml(enquiry.message)
                    : "No message provided."
                }
              </div>

            </div>

          </div>


          <div class="enquiry-view-footer">

            <button
              type="button"
              class="enquiry-view-delete"
              data-id="${enquiry._id}"
            >
              <i class="bi bi-trash3"></i>
              Delete
            </button>

            <button
              type="button"
              class="enquiry-view-done"
            >
              Done
            </button>

          </div>

        </div>

      </div>

    `;

    document.body.appendChild(modal);

    // =========================================
    // CLOSE
    // =========================================

    modal
      .querySelector(".enquiry-view-close")
      .addEventListener("click", () => modal.remove());

    modal
      .querySelector(".enquiry-view-done")
      .addEventListener("click", () => modal.remove());

    modal
      .querySelector(".enquiry-view-overlay")
      .addEventListener("click", (event) => {
        if (event.target.classList.contains("enquiry-view-overlay")) {
          modal.remove();
        }
      });

    // =========================================
    // STATUS
    // =========================================

    modal
      .querySelector("#modalEnquiryStatus")
      .addEventListener("change", async (event) => {
        await updateEnquiryStatus(enquiry._id, event.target.value);
      });

    // =========================================
    // DELETE
    // =========================================

    modal
      .querySelector(".enquiry-view-delete")
      .addEventListener("click", async () => {
        await deleteEnquiry(enquiry._id, modal);
      });
  }

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  async function updateEnquiryStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status.");
      }

      const enquiry = enquiries.find((item) => item._id === id);

      if (enquiry) {
        enquiry.status = status;
      }

      applyFilters();

      alert("Enquiry status updated successfully.");
    } catch (error) {
      console.error("Update status error:", error);

      alert(error.message || "Failed to update status.");
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function deleteEnquiry(id, modal = null) {
    const confirmed = confirm("Are you sure you want to delete this enquiry?");

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete enquiry.");
      }

      enquiries = enquiries.filter((item) => item._id !== id);

      if (modal) {
        modal.remove();
      }

      applyFilters();

      alert("Enquiry deleted successfully.");
    } catch (error) {
      console.error("Delete enquiry error:", error);

      alert(error.message || "Failed to delete enquiry.");
    }
  }

  // =====================================================
  // EVENT DELEGATION
  // =====================================================

  tableBody.addEventListener("click", (event) => {
    const viewButton = event.target.closest(".enquiry-action.view");

    const deleteButton = event.target.closest(".enquiry-action.delete");

    if (viewButton) {
      const id = viewButton.dataset.id;

      viewEnquiry(id);

      return;
    }

    if (deleteButton) {
      const id = deleteButton.dataset.id;

      deleteEnquiry(id);
    }
  });

  // =====================================================
  // SEARCH
  // =====================================================

  searchInput?.addEventListener("input", () => {
    currentPage = 1;

    applyFilters();
  });

  // =====================================================
  // STATUS FILTER
  // =====================================================

  statusFilter?.addEventListener("change", () => {
    currentPage = 1;

    applyFilters();
  });

  // =====================================================
  // HELPERS
  // =====================================================

  function formatStatus(status) {
    const labels = {
      new: "New",
      contacted: "Contacted",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return labels[status] || status;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return String(value).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }



  // =====================================================
  // INITIAL LOAD
  // =====================================================

  loadEnquiries();
});
