const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const bookingForm = document.querySelector("[data-booking-form]");
const statusMessage = document.querySelector("[data-form-status]");
const subjectSelect = document.querySelector("[data-subject-select]");
const subjectLinks = document.querySelectorAll("[data-subject]");
const preparationPicker = document.querySelector("[data-preparation-picker]");
const preparationInputs = document.querySelectorAll('input[name="preparation_subjects"]');
const bookingPlaceholder = document.querySelector("[data-booking-placeholder]");

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 10);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  nav?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

nav?.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLAnchorElement)) return;
  menuToggle?.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
});

subjectLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const subject = link.dataset.subject || "";
    const matchingOption = subjectSelect
      ? [...subjectSelect.options].find((option) => option.value === subject || option.textContent === subject)
      : null;

    if (subjectSelect && matchingOption) {
      subjectSelect.value = matchingOption.value || matchingOption.textContent;
    }

    preparationInputs.forEach((input) => {
      if (input.value === subject) {
        input.checked = true;
        preparationPicker?.removeAttribute("aria-invalid");
      }
    });
  });
});

const hasPreparationSubject = () => [...preparationInputs].some((input) => input.checked);

preparationInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (hasPreparationSubject()) {
      preparationPicker?.removeAttribute("aria-invalid");
    }
  });
});

bookingPlaceholder?.addEventListener("click", (event) => {
  event.preventDefault();
  if (!statusMessage) return;

  statusMessage.textContent =
    "Rezervační kalendář čeká na napojení. Pro domluvu zatím použijte formulář níže.";
  statusMessage.classList.remove("is-error");
  bookingForm?.scrollIntoView({ behavior: "smooth", block: "center" });
});

const clearInvalidState = (form) => {
  form.querySelectorAll("[aria-invalid]").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
  preparationPicker?.removeAttribute("aria-invalid");
};

const markInvalidFields = (form) => {
  const invalidFields = [...form.elements].filter((field) => {
    return field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement
      ? !field.checkValidity()
      : false;
  });

  invalidFields.forEach((field) => field.setAttribute("aria-invalid", "true"));
  invalidFields[0]?.focus();
};

bookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearInvalidState(bookingForm);

  const formData = new FormData(bookingForm);
  const honeypot = String(formData.get("website") || "").trim();

  if (honeypot) {
    statusMessage.textContent = "Rezervace byla přijata.";
    statusMessage.classList.remove("is-error");
    bookingForm.reset();
    return;
  }

  if (!bookingForm.checkValidity()) {
    markInvalidFields(bookingForm);
    statusMessage.textContent = "Zkontrolujte prosím povinná pole.";
    statusMessage.classList.add("is-error");
    return;
  }

  if (!hasPreparationSubject()) {
    preparationPicker?.setAttribute("aria-invalid", "true");
    statusMessage.textContent = "Vyberte prosím alespoň jeden předmět přípravy.";
    statusMessage.classList.add("is-error");
    preparationInputs[0]?.focus();
    return;
  }

  const reservation = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    lessonType: String(formData.get("subject") || ""),
    preparationSubjects: formData.getAll("preparation_subjects").map((subject) => String(subject)),
  };

  const isLocalPreview =
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1";

  if (isLocalPreview) {
    statusMessage.textContent = "Formulář je připravený. Ostré odesílání poběží po publikování webu.";
    statusMessage.classList.remove("is-error");
    bookingForm.dispatchEvent(
      new CustomEvent("capito:reservation-ready", {
        bubbles: true,
        detail: reservation,
      }),
    );
    return;
  }

  try {
    statusMessage.textContent = "Odesílám formulář...";
    statusMessage.classList.remove("is-error");

    const response = await fetch(bookingForm.action, {
      method: bookingForm.method,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    });

    if (!response.ok) {
      throw new Error("Formulář se nepodařilo odeslat.");
    }

    bookingForm.reset();
    statusMessage.textContent = "Děkuji, formulář byl odeslán. Ozvu se co nejdříve.";
    bookingForm.dispatchEvent(
      new CustomEvent("capito:reservation-sent", {
        bubbles: true,
        detail: reservation,
      }),
    );
  } catch (error) {
    statusMessage.textContent = "Odeslání se nepodařilo. Zkuste to prosím znovu nebo napište přímo na e-mail.";
    statusMessage.classList.add("is-error");
  }
});
