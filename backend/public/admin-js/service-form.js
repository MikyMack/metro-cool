document.addEventListener("DOMContentLoaded", () => {
  const serviceForm = document.getElementById("serviceForm");

  if (!serviceForm) return;

  // ========================================
  // QUILL EDITOR
  // ========================================

  const quill = new Quill("#serviceContentEditor", {
    theme: "snow",

    placeholder: "Write the service content...",

    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["link"],
        ["clean"],
      ],
    },
  });

  // ========================================
  // ELEMENTS
  // ========================================

  const titleInput = document.getElementById("serviceTitle");

  const categoryInput = document.getElementById("serviceCategory");

  const shortDescriptionInput = document.getElementById("shortDescription");

  const contentInput = document.getElementById("serviceContent");

  const imageInput = document.getElementById("serviceImage");

  const imagePreview = document.getElementById("serviceImagePreview");

  const saveButton = serviceForm.querySelector(".save-service-btn");

  const saveButtonText = document.getElementById("saveButtonText");

  const shortDescriptionCount = document.getElementById(
    "shortDescriptionCount",
  );

  // Optional image count element
  const imageCount = document.getElementById("imageCount");

  // ========================================
  // EDIT MODE
  // ========================================

  const params = new URLSearchParams(window.location.search);

  const serviceId = params.get("id");

  const isEditMode = Boolean(serviceId);

  // ========================================
  // IMAGE STATE
  // ========================================

  // Existing images already stored in database
  let existingImages = [];

  // Newly selected files
  let selectedImages = [];

  // Existing images removed by admin
  let removedImages = [];

  // ========================================
  // LOAD SERVICE
  // ========================================

  if (isEditMode) {
    loadService(serviceId);
  } else {
    updateImageCount();
  }

  // ========================================
  // SHORT DESCRIPTION COUNTER
  // ========================================

  if (shortDescriptionInput && shortDescriptionCount) {
    const updateCounter = () => {
      shortDescriptionCount.textContent = `${shortDescriptionInput.value.length} / 180`;
    };

    shortDescriptionInput.addEventListener("input", updateCounter);

    updateCounter();
  }

  // ========================================
  // IMAGE SELECTION
  // ========================================

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const files = Array.from(imageInput.files);

      if (files.length === 0) {
        return;
      }

      const maxSize = 2 * 1024 * 1024;

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      // ====================================
      // CHECK TOTAL IMAGE COUNT
      // ====================================

      const currentCount = existingImages.length + selectedImages.length;

      if (currentCount + files.length > 10) {
        alert(
          `You can have a maximum of 10 images. You currently have ${currentCount}.`,
        );

        imageInput.value = "";

        return;
      }

      // ====================================
      // VALIDATE IMAGES
      // ====================================

      for (const file of files) {
        if (file.size > maxSize) {
          alert(`"${file.name}" is larger than 2MB.`);

          imageInput.value = "";

          return;
        }

        if (!allowedTypes.includes(file.type)) {
          alert(`"${file.name}" is not a supported image format.`);

          imageInput.value = "";

          return;
        }
      }

      // ====================================
      // ADD FILES TO STATE
      // ====================================

      selectedImages.push(...files);

      // Reset input so the same image
      // can be selected again if needed
      imageInput.value = "";

      renderImages();
    });
  }

  // ========================================
  // RENDER ALL IMAGES
  // ========================================

  function renderImages() {
    imagePreview.innerHTML = "";

    const totalImages = existingImages.length + selectedImages.length;

    // ====================================
    // NO IMAGES
    // ====================================

    if (totalImages === 0) {
      resetImagePreview();
      updateImageCount();
      return;
    }

    // ====================================
    // EXISTING IMAGES
    // ====================================

    existingImages.forEach((image, index) => {
      const imageItem = document.createElement("div");

      imageItem.className = "service-preview-item existing-image";

      imageItem.innerHTML = `
          <img
            src="${image}"
            alt="Service image"
          />

          <button
            type="button"
            class="service-preview-remove"
            data-type="existing"
            data-index="${index}"
            title="Remove image"
            aria-label="Remove image"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;

      imagePreview.appendChild(imageItem);
    });

    // ====================================
    // NEWLY SELECTED IMAGES
    // ====================================

    selectedImages.forEach((file, index) => {
      const imageItem = document.createElement("div");

      imageItem.className = "service-preview-item new-image";

      const imageURL = URL.createObjectURL(file);

      imageItem.innerHTML = `
          <img
            src="${imageURL}"
            alt="New service image"
          />

          <button
            type="button"
            class="service-preview-remove"
            data-type="new"
            data-index="${index}"
            title="Remove image"
            aria-label="Remove image"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;

      imagePreview.appendChild(imageItem);
    });

    updateImageCount();
  }

  // ========================================
  // REMOVE IMAGE
  // ========================================

  imagePreview.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".service-preview-remove");

    if (!removeButton) return;

    const type = removeButton.dataset.type;

    const index = Number(removeButton.dataset.index);

    // ====================================
    // REMOVE EXISTING IMAGE
    // ====================================

    if (type === "existing") {
      const image = existingImages[index];

      if (image) {
        removedImages.push(image);
      }

      existingImages.splice(index, 1);
    }

    // ====================================
    // REMOVE NEW IMAGE
    // ====================================

    if (type === "new") {
      selectedImages.splice(index, 1);
    }

    renderImages();
  });

  // ========================================
  // FORM SUBMIT
  // ========================================

  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      // ====================================
      // VALIDATE IMAGES
      // ====================================

      const totalImages = existingImages.length + selectedImages.length;

      if (totalImages === 0) {
        alert("Please add at least one service image.");

        return;
      }

      // ====================================
      // GET QUILL CONTENT
      // ====================================

      const content = quill.root.innerHTML;

      const plainText = quill.getText().trim();

      if (!plainText) {
        alert("Please enter service content.");

        return;
      }

      contentInput.value = content;

      // ====================================
      // CREATE FORMDATA
      // ====================================

      const formData = new FormData();

      formData.append("title", titleInput.value.trim());

      formData.append("category", categoryInput.value);

      formData.append("shortDescription", shortDescriptionInput.value.trim());

      formData.append("content", content);

      // ====================================
      // STATUS
      // ====================================

      const selectedStatus = document.querySelector(
        'input[name="status"]:checked',
      );

      formData.append(
        "status",
        selectedStatus ? selectedStatus.value : "published",
      );

      // ====================================
      // ADD NEW IMAGES
      // ====================================

      selectedImages.forEach((file) => {
        formData.append("images", file);
      });

      // ====================================
      // ADD REMOVED EXISTING IMAGES
      // ====================================

      removedImages.forEach((image) => {
        formData.append("removedImages", image);
      });

      // ====================================
      // CREATE / UPDATE
      // ====================================

      let url = "/api/services";

      let method = "POST";

      if (isEditMode) {
        url = `/api/services/${serviceId}`;

        method = "PUT";
      }

      // ====================================
      // DISABLE SAVE BUTTON
      // ====================================

      saveButton.disabled = true;

      saveButtonText.textContent = isEditMode ? "Updating..." : "Saving...";

      // ====================================
      // SEND REQUEST
      // ====================================

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      alert(
        data.message ||
          (isEditMode
            ? "Service updated successfully."
            : "Service created successfully."),
      );

      // ====================================
      // REDIRECT
      // ====================================

      window.location.href = "/admin/services";
    } catch (error) {
      console.error("Service form error:", error);

      alert(error.message);

      saveButton.disabled = false;

      saveButtonText.textContent = isEditMode
        ? "Update Service"
        : "Save Service";
    }
  });

  // ========================================
  // LOAD SERVICE FOR EDIT
  // ========================================

  async function loadService(id) {
    try {
      const response = await fetch(`/api/services/${id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load service.");
      }

      const service = data.service;

      // ====================================
      // PAGE TITLE
      // ====================================

      const formPageTitle = document.getElementById("formPageTitle");

      const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");

      if (formPageTitle) {
        formPageTitle.textContent = "Edit Service";
      }

      if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = "Edit Service";
      }

      saveButtonText.textContent = "Update Service";

      // ====================================
      // FORM VALUES
      // ====================================

      titleInput.value = service.title || "";

      categoryInput.value = service.category || "";

      shortDescriptionInput.value = service.shortDescription || "";

      // ====================================
      // COUNTER
      // ====================================

      if (shortDescriptionCount) {
        shortDescriptionCount.textContent = `${shortDescriptionInput.value.length} / 180`;
      }

      // ====================================
      // CONTENT
      // ====================================

      if (service.content) {
        quill.root.innerHTML = service.content;

        contentInput.value = service.content;
      }

      // ====================================
      // STATUS
      // ====================================

      const statusRadio = document.querySelector(
        `input[name="status"][value="${service.status}"]`,
      );

      if (statusRadio) {
        statusRadio.checked = true;
      }

      // ====================================
      // EXISTING IMAGES
      // ====================================

      existingImages = Array.isArray(service.images) ? [...service.images] : [];

      selectedImages = [];
      removedImages = [];

      renderImages();
    } catch (error) {
      console.error("Load service error:", error);

      alert(error.message);

      window.location.href = "/admin/services";
    }
  }

  // ========================================
  // IMAGE COUNT
  // ========================================

  function updateImageCount() {
    if (!imageCount) return;

    const totalImages = existingImages.length + selectedImages.length;

    imageCount.textContent = `${totalImages} / 10 images`;
  }

  // ========================================
  // RESET IMAGE PREVIEW
  // ========================================

  function resetImagePreview() {
    imagePreview.innerHTML = `
      <div class="image-placeholder">
        <i class="bi bi-images"></i>

        <strong>No images selected</strong>

        <span>JPG, PNG or WebP</span>
      </div>
    `;
  }
});
