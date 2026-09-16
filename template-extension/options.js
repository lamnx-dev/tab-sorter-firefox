import { loadInitialState } from "./lib/load-initial-state.js";
import { replaceHtmlContent } from "./lib/replace-html-content.js";
import {
  applyDocumentLocale,
  loadLocaleMessages,
} from "./lib/locale-logic.js";
import { registerPreferencesEventListeners } from "./lib/preferences-events.js";
import { renderOptionsPage } from "./lib/preferences-render.js";
import { applyTheme as applyThemeToDocument } from "./lib/theme-logic.js";

let currentState = null;

function applyTheme(theme) {
  applyThemeToDocument(theme, document);
}

async function applyLanguage(language) {
  if (currentState) {
    currentState.language = language;
  }
  await loadLocaleMessages(language);
  applyDocumentLocale(document, language);
  if (currentState) {
    replaceHtmlContent(document.body, renderOptionsPage(currentState));
  }
}

registerPreferencesEventListeners(document, applyTheme, applyLanguage);

(async () => {
  try {
    const initialState = await loadInitialState();
    currentState = initialState;
    await loadLocaleMessages(initialState.language);
    applyDocumentLocale(document, initialState.language);
    applyTheme(initialState.theme);
    replaceHtmlContent(document.body, renderOptionsPage(initialState));
  } catch (error) {
    console.error("[Tab Sorter] Options page failed to load", error);
    document.body.textContent =
      "Tab Sorter settings failed to load. See the browser console.";
  }
})();
