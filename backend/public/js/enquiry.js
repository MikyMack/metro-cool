document.addEventListener("DOMContentLoaded", () => {
  initServiceEnquiryForm();
  initContactForm();
});

// =====================================================
// TOASTIFY
// =====================================================

function showToast(message, type = "success") {
  const accentColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-color")
      .trim() || "#222";

  let backgroundColor = accentColor;

  if (type === "error") {
    backgroundColor = "#d9534f";
  }

  if (type === "warning") {
    backgroundColor = "#d99a2b";
  }

  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    stopOnFocus: true,

    style: {
      background: backgroundColor,
      borderRadius: "6px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
      fontSize: "13px",
      fontWeight: "500",
    },
  }).showToast();
}

// =====================================================
// SERVICE ENQUIRY
// =====================================================

function initServiceEnquiryForm() {
  const form = document.getElementById("serviceEnquiryForm");

  if (!form) return;

  const submitButton = document.getElementById("serviceEnquirySubmit");

  const submitText = document.getElementById("serviceEnquirySubmitText");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("enquiryName")?.value.trim() || "";

    const phone = document.getElementById("enquiryPhone")?.value.trim() || "";

    const email = document.getElementById("enquiryEmail")?.value.trim() || "";

    const message =
      document.getElementById("enquiryMessage")?.value.trim() || "";

    const service = document.getElementById("enquiryService")?.value || "";

    const source = document.getElementById("enquirySource")?.value || "service";

    // =========================================
    // VALIDATION
    // =========================================

    if (!name) {
      showToast("Please enter your name.", "error");
      return;
    }

    if (!phone) {
      showToast("Please enter your phone number.", "error");
      return;
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      showToast("Please enter a valid 10-digit phone number.", "error");
      return;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
    }

    if (!service) {
      showToast("Service information is missing.", "error");
      return;
    }

    // =========================================
    // DISABLE BUTTON
    // =========================================

    submitButton.disabled = true;

    if (submitText) {
      submitText.textContent = "Submitting...";
    }

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          phone,
          email,
          message,
          source,
          service,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit your request.");
      }

      // =========================================
      // SUCCESS
      // =========================================

      showToast("Request submitted successfully. We’ll get in touch with you shortly.", "success");

      /*
       * The enquiry has already been saved in MongoDB.
       *
       * Now redirect the customer to WhatsApp.
       */

      if (data.whatsappUrl) {
        setTimeout(() => {
          window.location.href = data.whatsappUrl;
        }, 700);

        return;
      }

      // =========================================
      // NO WHATSAPP URL
      // =========================================

      form.reset();

      const modalElement = document.getElementById("serviceEnquiryModal");

      if (modalElement && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalElement);

        if (modal) {
          modal.hide();
        }
      }
    } catch (error) {
      console.error("Service enquiry error:", error);

      showToast(
        error.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      submitButton.disabled = false;

      if (submitText) {
        submitText.textContent = "Submit Request";
      }
    }
  });
}

// =====================================================
// CONTACT FORM
// =====================================================

function initContactForm() {
  const form = document.getElementById("contactForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // =========================================
    // GET VALUES
    // =========================================

    const name = document.getElementById("fname")?.value.trim() || "";

    const email = document.getElementById("email")?.value.trim() || "";

    const phone = document.getElementById("phone")?.value.trim() || "";

    const message = document.getElementById("message")?.value.trim() || "";

    const submitButton = form.querySelector('button[type="submit"]');

    // =========================================
    // VALIDATION
    // =========================================

    if (!name) {
      showToast("Please enter your name.", "error");
      return;
    }

    if (!phone) {
      showToast("Please enter your phone number.", "error");
      return;
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      showToast("Please enter a valid 10-digit phone number.", "error");
      return;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
    }

    // =========================================
    // DISABLE BUTTON
    // =========================================

    if (submitButton) {
      submitButton.disabled = true;
    }

    const originalButtonText =
      submitButton?.textContent.trim() || "Send Message";

    if (submitButton) {
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          phone,
          email,
          message,

          // Important:
          // Contact page does NOT have a service.
          source: "contact",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit your enquiry.");
      }

      // =========================================
      // SUCCESS
      // =========================================

      showToast("Thank you! Your request has been submitted successfully.", "success");

      /*
       * Enquiry is already saved in DB.
       *
       * Redirect to WhatsApp after successful save.
       */

      if (data.whatsappUrl) {
        setTimeout(() => {
          window.location.href = data.whatsappUrl;
        }, 700);

        return;
      }

      // =========================================
      // NO WHATSAPP URL
      // =========================================

      form.reset();
    } catch (error) {
      console.error("Contact enquiry error:", error);

      showToast(
        error.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}
