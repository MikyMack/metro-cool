document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  // API ENDPOINTS
  // =========================================================

  const API = {
    services: "/api/services",
    blogs: "/api/blogs",
    testimonials: "/api/testimonials",
    mainBanners: "/api/main-banners",
    mobileBanners: "/api/mobile-banners",
  };

  // =========================================================
  // HELPERS
  // =========================================================

  function getArrayFromResponse(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data.services)) {
      return data.services;
    }

    if (Array.isArray(data.blogs)) {
      return data.blogs;
    }

    if (Array.isArray(data.testimonials)) {
      return data.testimonials;
    }

    if (Array.isArray(data.banners)) {
      return data.banners;
    }

    if (Array.isArray(data.mainBanners)) {
      return data.mainBanners;
    }

    if (Array.isArray(data.mobileBanners)) {
      return data.mobileBanners;
    }

    return [];
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

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function fetchData(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }

    const data = await response.json();

    return getArrayFromResponse(data);
  }

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  async function loadDashboard() {
    const results = await Promise.allSettled([
      fetchData(API.services),
      fetchData(API.blogs),
      fetchData(API.testimonials),
      fetchData(API.mainBanners),
      fetchData(API.mobileBanners),
    ]);

    const services = results[0].status === "fulfilled" ? results[0].value : [];

    const blogs = results[1].status === "fulfilled" ? results[1].value : [];

    const testimonials =
      results[2].status === "fulfilled" ? results[2].value : [];

    const mainBanners =
      results[3].status === "fulfilled" ? results[3].value : [];

    const mobileBanners =
      results[4].status === "fulfilled" ? results[4].value : [];

    // ---------------------------------------------------------
    // STATS
    // ---------------------------------------------------------

    updateElement("totalServices", services.length);

    updateElement("totalBlogs", blogs.length);

    updateElement("totalTestimonials", testimonials.length);

    /*
     * Main + Mobile banners are both banners.
     */
    const totalBanners = mainBanners.length + mobileBanners.length;

    updateElement("totalBanners", totalBanners);

    // ---------------------------------------------------------
    // GROWTH
    // ---------------------------------------------------------

    updateGrowth("servicesGrowth", services);

    updateGrowth("blogsGrowth", blogs);

    updateGrowth("testimonialsGrowth", testimonials);

    updateGrowth("bannersGrowth", [...mainBanners, ...mobileBanners]);

    // ---------------------------------------------------------
    // RECENT SERVICES
    // ---------------------------------------------------------

    renderRecentServices(services);
  }

  // =========================================================
  // UPDATE ELEMENT
  // =========================================================

  function updateElement(id, value) {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    element.textContent = value;
  }

  // =========================================================
  // GROWTH
  // =========================================================

  function updateGrowth(id, items) {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    /*
     * We don't have a separate analytics API
     * for "this week".
     *
     * Therefore we calculate how many records
     * were created in the last 7 days.
     */

    const now = new Date();

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentCount = items.filter((item) => {
      const createdAt = item.createdAt;

      if (!createdAt) {
        return false;
      }

      const date = new Date(createdAt);

      return date >= sevenDaysAgo;
    }).length;

    element.textContent = `+${recentCount} this week`;
  }

  // =========================================================
  // RECENT SERVICES
  // =========================================================

  function renderRecentServices(services) {
    const container = document.getElementById("recentServices");

    if (!container) {
      return;
    }

    if (!services.length) {
      container.innerHTML = `
        <div
          class="text-center py-4"
          style="width:100%;"
        >
          <i class="bi bi-grid-3x3-gap fs-3"></i>

          <p class="mb-0 mt-2">
            No services found.
          </p>
        </div>
      `;

      return;
    }

    /*
     * Sort newest first.
     */

    const recentServices = [...services]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);

        const dateB = new Date(b.createdAt || 0);

        return dateB - dateA;
      })
      .slice(0,3);

    container.innerHTML = recentServices.map(renderService).join("");
  }

  // =========================================================
  // SERVICE CARD
  // =========================================================

  function renderService(service) {
    /*
     * Your Service model now uses
     * an images array.
     */

    const image = service.images?.[0] || "";

    const imageUrl = getImageUrl(image);

    const category = service.category || "Service";

    const isPublished = service.status === "published";

    const statusClass = isPublished ? "published" : "draft";

    const statusText = isPublished ? "Published" : "Draft";

    return `
      <div class="service-item">

        <div class="service-image">

          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(service.title || "Service")}"
            onerror="
              this.src='/assets/images/placeholder.jpg'
            "
          />

          <span class="service-category">
            ${escapeHtml(category)}
          </span>

        </div>


        <div class="service-body">

          <h4>
            ${escapeHtml(service.title || "Untitled Service")}
          </h4>

          <span
            class="service-status ${statusClass}"
          >
            <i class="bi bi-circle-fill"></i>

            ${statusText}
          </span>

        </div>

      </div>
    `;
  }

  // =========================================================
  // START
  // =========================================================

  loadDashboard().catch((error) => {
    console.error("Dashboard error:", error);
  });
});
