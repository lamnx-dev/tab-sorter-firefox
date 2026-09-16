import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  applyDocumentLocale,
  isRtlLocale,
  normalizeLocaleBase,
} from "../../template-extension/lib/locale-logic.js";

describe("locale logic (RTL)", () => {
  it("normalizes locale tags to a base language code", () => {
    expect(normalizeLocaleBase("he-IL")).toBe("he");
    expect(normalizeLocaleBase("ar_SA")).toBe("ar");
    expect(normalizeLocaleBase("en-US")).toBe("en");
  });

  it("detects Arabic and Hebrew as RTL locales", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("ar-EG")).toBe(true);
    expect(isRtlLocale("he")).toBe(true);
    expect(isRtlLocale("he-IL")).toBe(true);
    expect(isRtlLocale("en")).toBe(false);
    expect(isRtlLocale("fr")).toBe(false);
  });

  it("sets dir and lang on the document root for RTL UI languages", () => {
    const dom = new JSDOM("<!DOCTYPE html><html></html>");
    const { document } = dom.window;

    const rtl = applyDocumentLocale(document, () => "ar");
    expect(rtl).toEqual({ locale: "ar", dir: "rtl" });
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    expect(document.documentElement.getAttribute("lang")).toBe("ar");

    const ltr = applyDocumentLocale(document, () => "en-US");
    expect(ltr).toEqual({ locale: "en-US", dir: "ltr" });
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    expect(document.documentElement.getAttribute("lang")).toBe("en-US");

    const directVi = applyDocumentLocale(document, "vi");
    expect(directVi).toEqual({ locale: "vi", dir: "ltr" });
    expect(document.documentElement.getAttribute("lang")).toBe("vi");
  });
});

describe("translate and custom messages", () => {
  it("translates with customMessages when provided", async () => {
    const { setCustomMessages, translate, SUPPORTED_LANGUAGES } = await import(
      "../../template-extension/lib/locale-logic.js"
    );

    expect(SUPPORTED_LANGUAGES.some((l) => l.code === "vi")).toBe(true);

    setCustomMessages({
      actions: { message: "Sắp xếp" },
      command_sort_tabs_domain: { message: "Theo tên miền" },
    });

    expect(translate("actions")).toBe("Sắp xếp");
    expect(translate("command_sort_tabs_domain")).toBe("Theo tên miền");

    setCustomMessages(null);
  });
});
