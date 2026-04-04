const validLanguages = new Set(["de", "en", "pl"]);
const fallbackLanguage = "de";
const storageKey = "wedding-invite-language";
const contentCache = new Map();

function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get("lang");

  if (queryLanguage && validLanguages.has(queryLanguage)) {
    return queryLanguage;
  }

  try {
    const storedLanguage = window.localStorage.getItem(storageKey);
    if (storedLanguage && validLanguages.has(storedLanguage)) {
      return storedLanguage;
    }
  } catch {
    return fallbackLanguage;
  }

  return fallbackLanguage;
}

function updateUrlLanguage(language) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", language);
  window.history.replaceState({}, "", url);
}

async function loadLanguageContent(language) {
  if (contentCache.has(language)) {
    return contentCache.get(language);
  }

  const response = await fetch(`content/${language}.json`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load language file: ${language}`);
  }

  const data = await response.json();
  contentCache.set(language, data);
  return data;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function renderSchedule(items) {
  const grid = document.getElementById("schedule-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "schedule-card";

    const number = document.createElement("span");
    number.className = "schedule-number";
    number.textContent = item.number;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const description = document.createElement("p");
    description.textContent = item.description;

    article.append(number, title, description);
    grid.appendChild(article);
  });
}

function renderFaq(items) {
  const grid = document.getElementById("faq-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  items.forEach((item) => {
    const details = document.createElement("details");
    details.className = "faq-item";

    const summary = document.createElement("summary");
    summary.textContent = item.question;

    const text = document.createElement("p");
    text.textContent = item.answer;

    details.append(summary, text);
    grid.appendChild(details);
  });
}

function applyContent(content) {
  document.title = content.meta.title;

  setText("hero-eyebrow", content.hero.eyebrow);
  setText("hero-date", content.hero.date);
  setText("hero-intro-1", content.hero.intro1);
  setText("hero-intro-2", content.hero.intro2);
  setText("hero-rsvp-button", content.hero.rsvpButton);
  setText("hero-location-button", content.hero.locationButton);
  setText("hero-location-button-1", content.hero.locationButton1);
  setText("hero-location-button-2", content.hero.locationButton2);

  setText("fact-rsvp-label", content.facts.rsvpLabel);
  setText("fact-rsvp-value", content.facts.rsvpValue);
  setText("fact-venue-label", content.facts.venueLabel);

  setText("welcome-eyebrow", content.welcome.eyebrow);
  setText("welcome-title", content.welcome.title);
  setText("welcome-copy-1", content.welcome.copy1);
  setText("welcome-copy-2", content.welcome.copy2);

  setText("schedule-eyebrow", content.schedule.eyebrow);
  setText("schedule-title", content.schedule.title);
  renderSchedule(content.schedule.items);

  setText("location-eyebrow", content.location.eyebrow);
  setText("location-map-button", content.location.mapButton);
  setText("location-note", content.location.note);

  setText("travel-eyebrow", content.travel.eyebrow);
  setText("travel-title", content.travel.title);
  setText("travel-copy", content.travel.copy);

  setText("rsvp-title", content.rsvp.title);
  setText("rsvp-copy-1", content.rsvp.copy1);
  setText("rsvp-copy-2", content.rsvp.copy2);
  setText("rsvp-button", content.rsvp.button);

  setText("faq-title", content.faq.title);
  renderFaq(content.faq.items);

  setText("footer-line-1", content.footer.line1);
  setText("footer-line-2", content.footer.line2);
}

async function setActiveLanguage(language, { persist = true, syncUrl = true } = {}) {
  const targetLanguage = validLanguages.has(language) ? language : fallbackLanguage;

  const content = await loadLanguageContent(targetLanguage);
  applyContent(content);

  document.documentElement.dataset.siteLang = targetLanguage;
  document.documentElement.lang = targetLanguage;

  const buttons = document.querySelectorAll("[data-lang-switch]");
  buttons.forEach((button) => {
    const isActive = button.dataset.langSwitch === targetLanguage;
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (persist) {
    try {
      window.localStorage.setItem(storageKey, targetLanguage);
    } catch {
      // Ignore storage failures in restricted browsing contexts.
    }
  }

  if (syncUrl) {
    updateUrlLanguage(targetLanguage);
  }
}

function bindLanguageSwitchers() {
  const buttons = document.querySelectorAll("[data-lang-switch]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveLanguage(button.dataset.langSwitch).catch((error) => {
        console.error(error);
      });
    });
  });
}

function init() {
  bindLanguageSwitchers();

  setActiveLanguage(getInitialLanguage(), { persist: false, syncUrl: false }).catch((error) => {
    console.error(error);
    if (document.body) {
      document.body.innerHTML = "<p style='padding:1rem;font-family:sans-serif'>Could not load language content files.</p>";
    }
  });
}

init();
