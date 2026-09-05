const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const bookingForm = document.querySelector("[data-booking-form]");
const statusMessage = document.querySelector("[data-form-status]");
const subjectSelect = document.querySelector("[data-subject-select]");
const subjectLinks = document.querySelectorAll("[data-subject]");
const preparationPicker = document.querySelector("[data-preparation-picker]");
const preparationInputs = document.querySelectorAll('input[name="subjects"]');
const reviewsMarquee = document.querySelector(".reviews-marquee");
const primaryReviewsRow = document.querySelector('.reviews-row:not([aria-hidden="true"])');
const reviewCards = primaryReviewsRow ? [...primaryReviewsRow.querySelectorAll(".review-card")] : [];

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 10);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const mobileMenuQuery = window.matchMedia("(max-width: 900px)");
const navLinks = nav ? [...nav.querySelectorAll("a")] : [];

const setMenuA11yState = (isOpen) => {
  if (!nav) return;

  const shouldHideLinks = mobileMenuQuery.matches && !isOpen;
  nav.setAttribute("aria-hidden", String(shouldHideLinks));
  nav.inert = shouldHideLinks;
  navLinks.forEach((link) => {
    if (shouldHideLinks) {
      link.setAttribute("tabindex", "-1");
    } else {
      link.removeAttribute("tabindex");
    }
  });
};

const setMenuState = (isOpen, options = {}) => {
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  nav?.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
  setMenuA11yState(isOpen);

  if (!isOpen && options.focusToggle) {
    menuToggle?.focus();
  }
};

setMenuState(false);

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

nav?.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLAnchorElement)) return;
  setMenuState(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || menuToggle?.getAttribute("aria-expanded") !== "true") return;
  setMenuState(false, { focusToggle: true });
});

const handleMobileMenuChange = () => setMenuState(false);
if (typeof mobileMenuQuery.addEventListener === "function") {
  mobileMenuQuery.addEventListener("change", handleMobileMenuChange);
} else if (typeof mobileMenuQuery.addListener === "function") {
  mobileMenuQuery.addListener(handleMobileMenuChange);
}

const updateActiveReview = () => {
  if (!reviewsMarquee || !reviewCards.length) return;

  const isMobileCarousel = window.matchMedia("(max-width: 640px)").matches;
  if (!isMobileCarousel) {
    reviewCards.forEach((card) => card.classList.remove("is-active"));
    return;
  }

  const marqueeBox = reviewsMarquee.getBoundingClientRect();
  const marqueeCenter = marqueeBox.left + marqueeBox.width / 2;
  let closestCard = reviewCards[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  reviewCards.forEach((card) => {
    const cardBox = card.getBoundingClientRect();
    const cardCenter = cardBox.left + cardBox.width / 2;
    const distance = Math.abs(cardCenter - marqueeCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });

  reviewCards.forEach((card) => card.classList.toggle("is-active", card === closestCard));
};

let reviewFrame = 0;
const requestReviewUpdate = () => {
  cancelAnimationFrame(reviewFrame);
  reviewFrame = requestAnimationFrame(updateActiveReview);
};

reviewsMarquee?.addEventListener("scroll", requestReviewUpdate, { passive: true });
window.addEventListener("resize", requestReviewUpdate);
requestReviewUpdate();

const currentTopicBanner = document.querySelector("[data-current-topic-banner]");

const normalizeSheetKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const sheetHeaderMap = {
  aktivni: "active",
  predmet: "subject",
  poradi: "order",
  stitek: "label",
  "tema lekce": "title",
  "popis v banneru": "description",
  termin: "date",
  cas: "time",
  delka: "duration",
  "vhodne pro": "audience",
  "doplnujici text": "note",
  "odkaz na rezervaci": "bookingUrl",
};

const getSheetCellValue = (cell) => {
  if (!cell) return "";
  return String(cell.f ?? cell.v ?? "").trim();
};

const getCurrentTopicRows = (response) => {
  const table = response?.table;
  if (!table?.rows?.length) return [];

  let headers = table.cols.map((column) => column.label || column.id || "");
  const rows = table.rows.map((row) => row.c.map(getSheetCellValue));

  if (headers.every((header) => !String(header).trim())) {
    headers = rows.shift() || [];
  }

  const keys = headers.map((header) => sheetHeaderMap[normalizeSheetKey(header)] || "");

  return rows.map((row) =>
    row.reduce((topic, value, index) => {
      const key = keys[index];
      if (key) topic[key] = value;
      return topic;
    }, {}),
  );
};

const isCurrentTopicActive = (value) => {
  const normalized = normalizeSheetKey(value);
  return !["ne", "no", "false", "0", "vypnuto", "skryto", "skryt"].includes(normalized);
};

const setCurrentTopicText = (card, selector, value) => {
  const element = card.querySelector(selector);
  if (!element || !value) return;
  element.textContent = value;
};

const setCurrentTopicMeta = (card, selector, value) => {
  const element = card.querySelector(selector);
  if (!element) return;

  element.hidden = !value;
  if (value) {
    element.textContent = value;
  }

  const metaList = element.closest(".current-topic-meta");
  if (metaList) {
    metaList.hidden = !metaList.querySelector("li:not([hidden])");
  }
};

const setCurrentTopicBooking = (card, topic, subject) => {
  const link = card.querySelector("[data-current-topic-booking]");
  if (!link) return;

  if (topic.bookingUrl) {
    try {
      const url = new URL(topic.bookingUrl, window.location.href);
      if (url.protocol === "https:" || url.protocol === "http:") {
        link.href = url.href;
      }
    } catch (error) {
      return;
    }
  }

  const audience = topic.audience ? ` pro ${topic.audience}` : "";
  link.setAttribute("aria-label", `Rezervovat místo na skupinové lekci ${subject}${audience}`);
};

const renderCurrentTopicCard = (card, topic, index, section) => {
  const subject = section.dataset.currentTopicSubjectLabel || section.dataset.currentTopicSubject || "mechaniky";
  const titleId = index === 0 ? "current-topic-title" : `current-topic-title-${index + 1}`;
  const title = card.querySelector("[data-current-topic-title]");

  if (title) {
    title.id = titleId;
  }

  if (index === 0) {
    section.setAttribute("aria-labelledby", titleId);
  }

  card.dataset.currentTopicOrder = topic.order || String(index + 1);
  card.hidden = false;

  setCurrentTopicText(card, "[data-current-topic-label]", topic.label);
  setCurrentTopicText(card, "[data-current-topic-title]", topic.title);
  setCurrentTopicText(card, "[data-current-topic-description]", topic.description);
  setCurrentTopicMeta(card, "[data-current-topic-date]", topic.date);
  setCurrentTopicMeta(card, "[data-current-topic-time]", topic.time);
  setCurrentTopicMeta(card, "[data-current-topic-duration]", topic.duration);
  setCurrentTopicText(card, "[data-current-topic-audience]", topic.audience);
  setCurrentTopicText(card, "[data-current-topic-note]", topic.note);
  setCurrentTopicBooking(card, topic, subject);
};

const renderCurrentTopics = (section, topics) => {
  const subject = normalizeSheetKey(section.dataset.currentTopicSubject);
  const activeTopics = topics
    .filter((topic) => isCurrentTopicActive(topic.active))
    .filter((topic) => !subject || normalizeSheetKey(topic.subject) === subject)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

  if (!activeTopics.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  const cards = [...section.querySelectorAll("[data-current-topic-card]")];
  const template = cards[0];

  if (!template) return;

  activeTopics.forEach((topic, index) => {
    const card = cards[index] || template.cloneNode(true);

    if (!cards[index]) {
      section.append(card);
      cards.push(card);
    }

    renderCurrentTopicCard(card, topic, index, section);
  });

  cards.slice(activeTopics.length).forEach((card) => {
    card.hidden = true;
  });
};

const loadCurrentTopicSheet = (section) =>
  new Promise((resolve, reject) => {
    const sheetId = section.dataset.currentTopicSheetId;
    const sheetGid = section.dataset.currentTopicSheetGid || "0";

    if (!sheetId) {
      reject(new Error("Missing Google Sheet ID."));
      return;
    }

    const callbackName = `capitoCurrentTopics${Date.now()}${Math.round(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
      window.clearTimeout(timeout);
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheet did not respond."));
    }, 8000);

    window[callbackName] = (response) => {
      cleanup();

      if (response?.status === "error") {
        reject(new Error(response.errors?.[0]?.message || "Google Sheet returned an error."));
        return;
      }

      resolve(getCurrentTopicRows(response));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Google Sheet script could not be loaded."));
    };

    url.searchParams.set("gid", sheetGid);
    url.searchParams.set("headers", "1");
    url.searchParams.set("tqx", `out:json;responseHandler:${callbackName}`);

    script.src = url.href;
    script.async = true;
    document.head.append(script);
  });

if (currentTopicBanner) {
  loadCurrentTopicSheet(currentTopicBanner)
    .then((topics) => renderCurrentTopics(currentTopicBanner, topics))
    .catch((error) => {
      console.info("Bannery skupinových lekcí zůstaly v záložní verzi.", error);
    });
}

subjectLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const subject = link.dataset.subject || "";
    const findOption = (value) =>
      subjectSelect
        ? [...subjectSelect.options].find((option) => option.value === value || option.textContent?.trim() === value)
        : null;
    const matchingOption = findOption(subject) || findOption("Nejsem si jistý/á");

    if (subjectSelect && matchingOption) {
      subjectSelect.value = matchingOption.value || matchingOption.textContent;
      subjectSelect.removeAttribute("aria-invalid");
    }

    let matchedPreparation = false;
    preparationInputs.forEach((input) => {
      if (input.value === subject) {
        input.checked = true;
        matchedPreparation = true;
      }
    });

    if (matchedPreparation) {
      preparationPicker?.removeAttribute("aria-invalid");
    }
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
    statusMessage.textContent = "Poptávka byla přijata.";
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
    statusMessage.textContent = "Vyberte prosím alespoň jeden předmět.";
    statusMessage.classList.add("is-error");
    preparationInputs[0]?.focus();
    return;
  }

  const inquiry = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    lessonType: String(formData.get("lesson_type") || ""),
    subjects: formData.getAll("subjects").map((subject) => String(subject)),
    message: String(formData.get("message") || "").trim(),
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
      new CustomEvent("capito:inquiry-ready", {
        bubbles: true,
        detail: inquiry,
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
    statusMessage.textContent = "Děkuji, poptávka byla odeslána. Ozveme se co nejdříve.";
    bookingForm.dispatchEvent(
      new CustomEvent("capito:inquiry-sent", {
        bubbles: true,
        detail: inquiry,
      }),
    );
  } catch (error) {
    statusMessage.textContent = "Odeslání se nepodařilo. Zkuste to prosím znovu nebo napište přímo na e-mail.";
    statusMessage.classList.add("is-error");
  }
});
