export const RTL_LOCALE_BASES = new Set(["ar", "he"]);

export const LANGUAGE_AUTO = "auto";

export const SUPPORTED_LANGUAGES = [
  { code: "auto", name: "Auto" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh_CN", name: "简体中文" },
  { code: "zh_TW", name: "繁體中文" },
  { code: "ru", name: "Русский" },
  { code: "pt_BR", name: "Português (Brasil)" },
  { code: "pt_PT", name: "Português (Portugal)" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "ar", name: "العربية" },
  { code: "cs", name: "Čeština" },
  { code: "da", name: "Dansk" },
  { code: "el", name: "Ελληνικά" },
  { code: "fi", name: "Suomi" },
  { code: "he", name: "עברית" },
  { code: "hu", name: "Magyar" },
  { code: "nb", name: "Norsk bokmål" },
  { code: "ro", name: "Română" },
  { code: "sv", name: "Svenska" },
  { code: "tr", name: "Türkçe" },
];

let customMessages = null;

export function setCustomMessages(messages) {
  customMessages = messages;
}

export function getCustomMessages() {
  return customMessages;
}

export function translate(messageKey) {
  if (customMessages && customMessages[messageKey]?.message) {
    return customMessages[messageKey].message;
  }
  return chrome.i18n?.getMessage?.(messageKey) || messageKey;
}

export async function loadLocaleMessages(locale) {
  if (!locale || locale === LANGUAGE_AUTO) {
    customMessages = null;
    return null;
  }
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
      const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
      const res = await fetch(url);
      if (res.ok) {
        const messages = await res.json();
        customMessages = messages;
        return messages;
      }
    }
  } catch (err) {
    console.error("[Tab Sorter] Failed to load custom locale messages:", err);
  }
  customMessages = null;
  return null;
}

export function normalizeLocaleBase(locale) {
  return locale.split(/[-_]/)[0].toLowerCase();
}

export function isRtlLocale(locale) {
  return RTL_LOCALE_BASES.has(normalizeLocaleBase(locale));
}

/**
 * @param {Document} doc
 * @param {string | (() => string)} [localeOrGetter]
 */
export function applyDocumentLocale(
  doc,
  localeOrGetter,
) {
  let locale;
  if (typeof localeOrGetter === "function") {
    locale = localeOrGetter();
  } else if (typeof localeOrGetter === "string" && localeOrGetter !== LANGUAGE_AUTO) {
    locale = localeOrGetter;
  } else {
    locale = chrome.i18n?.getUILanguage?.() || "en";
  }

  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  doc.documentElement.setAttribute("lang", locale);
  doc.documentElement.setAttribute("dir", dir);
  return { locale, dir };
}
