/* =========================================================
   SERVIZIO ADMIN DASHBOARD
   Sidebar functionality
========================================================= */

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

/* =========================================================
   OPEN / CLOSE SIDEBAR
========================================================= */

function toggleSidebar() {
  sidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("active");
}

/* =========================================================
   TOGGLE BUTTON
========================================================= */

sidebarToggle.addEventListener("click", toggleSidebar);

/* =========================================================
   CLOSE WHEN CLICKING OVERLAY
========================================================= */

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
});

/* =========================================================
   CLOSE SIDEBAR AFTER NAVIGATION ON MOBILE
========================================================= */

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 767.98) {
      sidebar.classList.remove("open");
      sidebarOverlay.classList.remove("active");
    }
  });
});

/* =========================================================
   BANNERS PAGE
========================================================= */

const bannerStatusFilter = document.getElementById("bannerStatusFilter");

const bannerColumns = document.querySelectorAll(".banner-column");

const bannersEmpty = document.getElementById("bannersEmpty");

/* =========================================================
   FILTER BANNERS
========================================================= */

function filterBanners() {
  const selectedStatus = bannerStatusFilter.value;

  let visibleCount = 0;

  bannerColumns.forEach((banner) => {
    const bannerStatus = banner.dataset.status;

    const shouldShow = !selectedStatus || bannerStatus === selectedStatus;

    if (shouldShow) {
      banner.style.display = "";

      visibleCount++;
    } else {
      banner.style.display = "none";
    }
  });

  /* Empty state */

  if (visibleCount === 0) {
    bannersEmpty.classList.add("show");
  } else {
    bannersEmpty.classList.remove("show");
  }
}

bannerStatusFilter.addEventListener("change", filterBanners);
/* =========================================================
   BLOGS PAGE
========================================================= */

const blogSearch = document.getElementById("blogSearch");

const blogCategoryFilter = document.getElementById("blogCategoryFilter");

const blogStatusFilter = document.getElementById("blogStatusFilter");

const blogRows = document.querySelectorAll(".blog-row");

const blogsEmpty = document.getElementById("blogsEmpty");

const visibleBlogCount = document.getElementById("visibleBlogCount");

/* =========================================================
   FILTER BLOGS
========================================================= */

function filterBlogs() {
  const searchValue = blogSearch.value.trim().toLowerCase();

  const categoryValue = blogCategoryFilter.value;

  const statusValue = blogStatusFilter.value;

  let visibleCount = 0;

  blogRows.forEach((row) => {
    const title = row.dataset.title.toLowerCase();

    const category = row.dataset.category;

    const status = row.dataset.status;

    const matchesSearch = title.includes(searchValue);

    const matchesCategory = !categoryValue || category === categoryValue;

    const matchesStatus = !statusValue || status === statusValue;

    const shouldShow = matchesSearch && matchesCategory && matchesStatus;

    if (shouldShow) {
      row.style.display = "";

      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  /* Update count */

  if (visibleBlogCount) {
    visibleBlogCount.textContent = visibleCount;
  }

  /* Empty state */

  if (visibleCount === 0) {
    blogsEmpty.classList.add("show");
  } else {
    blogsEmpty.classList.remove("show");
  }
}

/* =========================================================
   SEARCH
========================================================= */

blogSearch.addEventListener("input", filterBlogs);

/* =========================================================
   CATEGORY
========================================================= */

blogCategoryFilter.addEventListener("change", filterBlogs);

/* =========================================================
   STATUS
========================================================= */

blogStatusFilter.addEventListener("change", filterBlogs);
/* =========================================================
   TESTIMONIALS PAGE
========================================================= */

const testimonialSearch = document.getElementById("testimonialSearch");

const testimonialStatusFilter = document.getElementById(
  "testimonialStatusFilter",
);

const testimonialRows = document.querySelectorAll(".testimonial-row");

const testimonialsEmpty = document.getElementById("testimonialsEmpty");

const visibleTestimonialCount = document.getElementById(
  "visibleTestimonialCount",
);

/* =========================================================
   FILTER TESTIMONIALS
========================================================= */

function filterTestimonials() {
  const searchValue = testimonialSearch
    ? testimonialSearch.value.trim().toLowerCase()
    : "";

  const statusValue = testimonialStatusFilter
    ? testimonialStatusFilter.value
    : "";

  let visibleCount = 0;

  testimonialRows.forEach((row) => {
    const customer = row.dataset.customer.toLowerCase();

    const service = row.dataset.service.toLowerCase();

    const status = row.dataset.status;

    const matchesSearch =
      customer.includes(searchValue) || service.includes(searchValue);

    const matchesStatus = !statusValue || status === statusValue;

    const shouldShow = matchesSearch && matchesStatus;

    if (shouldShow) {
      row.style.display = "";

      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  /* Update count */

  if (visibleTestimonialCount) {
    visibleTestimonialCount.textContent = visibleCount;
  }

  /* Empty state */

  if (visibleCount === 0) {
    testimonialsEmpty.classList.add("show");
  } else {
    testimonialsEmpty.classList.remove("show");
  }
}

/* =========================================================
   EVENTS
========================================================= */

if (testimonialSearch) {
  testimonialSearch.addEventListener("input", filterTestimonials);
}

if (testimonialStatusFilter) {
  testimonialStatusFilter.addEventListener("change", filterTestimonials);
}
