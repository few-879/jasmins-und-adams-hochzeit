const validLanguages = new Set(["de", "en", "pl"]);
const fallbackLanguage = "de";
const contentCache = new Map();

function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get("lang");

  if (queryLanguage && validLanguages.has(queryLanguage)) {
    return queryLanguage;
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

function setHref(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.href = value;
  }
}

function applyContent(content) {
  document.title = content.meta.title;

  setText("hero-eyebrow", content.hero.eyebrow);
  setText("hero-intro-1", content.hero.intro1);
  setText("hero-intro-2", content.hero.intro2);
  setText("hero-rsvp-button", content.hero.rsvpButton);
  setText("hero-info-button", content.hero.infoButton);
  setHref("hero-info-button", content.hero.infoLink);
  setText("hero-foto-upload-1", content.hero.fotoUpload1Button);
  setText("hero-foto-upload-2", content.hero.fotoUpload2Button);
  setText("hero-location-button", content.hero.locationButton);

  setText("location-eyebrow", content.location.eyebrow);
  setText("location-web-button", content.location.webButton);
  setText("location-map-button", content.location.mapButton);

  setText("footer-line-1", content.footer.line1);
  setText("footer-line-2", content.footer.line2);
}

async function setActiveLanguage(language, { syncUrl = true } = {}) {
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

  setActiveLanguage(getInitialLanguage(), { syncUrl: false }).catch((error) => {
    console.error(error);
    if (document.body) {
      document.body.innerHTML = "<p style='padding:1rem;font-family:sans-serif'>Could not load language content files. Please reload this page and delete all site data (cookies) if needed.</p>";
    }
  });
}

init();
