import { describe, expect, it } from "vitest";
import {
  comparisonByDomain,
  comparisonByUrl,
  computeGroupAwareTabOrder,
  computeLegacyTabOrder,
  computePinnedTabOrder,
  getBaseDomain,
  getLocalhostPort,
  groupSuspendedTabs,
  isLocalhostUrl,
  organizeTabsByGroup,
  removeParenthesisNotification,
} from "../../template-extension/lib/sort-logic.js";
import { tab, tabsFromUrls } from "../helpers/tab-fixtures.js";

describe("getBaseDomain", () => {
  it("extracts base domain and subDomain correctly", () => {
    expect(getBaseDomain("https://mail.google.com/inbox")).toEqual({
      baseDomain: "google.com",
      subDomain: "mail",
    });
    expect(getBaseDomain("https://www.google.com/search")).toEqual({
      baseDomain: "google.com",
      subDomain: "",
    });
    expect(getBaseDomain("https://banhang.shopee.vn/portal")).toEqual({
      baseDomain: "shopee.vn",
      subDomain: "banhang",
    });
    expect(getBaseDomain("https://news.bbc.co.uk/news")).toEqual({
      baseDomain: "bbc.co.uk",
      subDomain: "news",
    });
    expect(getBaseDomain("about:blank")).toEqual({
      baseDomain: "",
      subDomain: "",
    });
    expect(getBaseDomain("chrome://newtab/")).toEqual({
      baseDomain: "",
      subDomain: "",
    });
    expect(getBaseDomain("chrome://extensions")).toEqual({
      baseDomain: "",
      subDomain: "",
    });
    expect(getBaseDomain("about:newtab")).toEqual({
      baseDomain: "",
      subDomain: "",
    });
  });
});

describe("comparisonByDomain", () => {
  it("sorts tabs by domain alphabetically ignoring www and case", () => {
    const tabs = tabsFromUrls([
      "https://www.youtube.com/watch",
      "https://Github.com/login",
      "https://amazon.com/item",
      "https://google.com/search",
    ]);

    const order = [...tabs]
      .sort(comparisonByDomain)
      .map((t) => extractHostname(t.url));

    expect(order).toEqual([
      "amazon.com",
      "github.com",
      "google.com",
      "youtube.com",
    ]);
  });

  it("groups subdomains together under the root domain", () => {
    const tabs = tabsFromUrls([
      "https://mail.google.com/inbox",
      "https://facebook.com/user",
      "https://docs.google.com/doc",
      "https://shopee.vn/item",
      "https://google.com/search",
      "https://banhang.shopee.vn/portal",
      "https://m.facebook.com/home",
    ]);

    const sortedUrls = [...tabs].sort(comparisonByDomain).map((t) => t.url);

    expect(sortedUrls).toEqual([
      "https://facebook.com/user",
      "https://m.facebook.com/home",
      "https://google.com/search",
      "https://docs.google.com/doc",
      "https://mail.google.com/inbox",
      "https://shopee.vn/item",
      "https://banhang.shopee.vn/portal",
    ]);
  });

  it("sub-sorts tabs by url when domains are identical", () => {
    const tabs = tabsFromUrls([
      "https://github.com/zebra",
      "https://github.com/apple",
      "https://github.com/banana",
    ]);

    const sortedUrls = [...tabs].sort(comparisonByDomain).map((t) => t.url);

    expect(sortedUrls).toEqual([
      "https://github.com/apple",
      "https://github.com/banana",
      "https://github.com/zebra",
    ]);
  });

  it("handles urls without domain safely without throwing errors", () => {
    const tabs = [
      tab(1, "https://google.com"),
      tab(2, "about:blank"),
      tab(3, "https://amazon.com"),
      tab(4, "about:config"),
    ];

    const sortedIds = [...tabs].sort(comparisonByDomain).map((t) => t.id);

    // Domain tabs (amazon=3, google=1) come before non-domain tabs (about:blank=2, about:config=4)
    expect(sortedIds.slice(0, 2)).toEqual([3, 1]);
    expect(sortedIds.slice(2)).toEqual([2, 4]);
  });

  it("places browser internal tabs (chrome://newtab, about:blank) after all web domains", () => {
    const tabs = [
      tab(1, "chrome://newtab/"),
      tab(2, "https://git.teca.vn/users/sign_in"),
      tab(3, "about:newtab"),
      tab(4, "https://facebook.com"),
    ];

    const sortedIds = [...tabs]
      .sort(comparisonByDomain)
      .map((t) => t.id);

    // Web tabs (facebook=4, git.teca.vn=2) come before internal tabs (about:newtab=3, chrome://newtab=1)
    expect(sortedIds.slice(0, 2)).toEqual([4, 2]);
    expect(sortedIds.slice(2)).toEqual([3, 1]);
  });
});

describe("comparisonByUrl", () => {
  it("sorts by domain regardless of www prefix (issue #20)", () => {
    const tabs = tabsFromUrls([
      "https://www.youtube.com",
      "https://github.com",
      "https://amazon.com",
      "https://google.com",
    ]);

    const order = [...tabs]
      .sort(comparisonByUrl)
      .map((t) => extractHostname(t.url));

    expect(order).toEqual([
      "amazon.com",
      "github.com",
      "google.com",
      "youtube.com",
    ]);
  });
});

describe("isLocalhostUrl and getLocalhostPort", () => {
  it("identifies localhost, loopback IP and local development domains", () => {
    expect(isLocalhostUrl("http://localhost:3000")).toBe(true);
    expect(isLocalhostUrl("https://localhost:8080/path")).toBe(true);
    expect(isLocalhostUrl("http://127.0.0.1:5173")).toBe(true);
    expect(isLocalhostUrl("http://[::1]:3000")).toBe(true);
    expect(isLocalhostUrl("http://api.app.local:4000")).toBe(true);
    expect(isLocalhostUrl("http://myproject.test")).toBe(true);
    expect(isLocalhostUrl("http://sub.localhost")).toBe(true);
  });

  it("returns false for non-localhost websites and internal pages", () => {
    expect(isLocalhostUrl("https://google.com")).toBe(false);
    expect(isLocalhostUrl("https://localhost.fake.com")).toBe(false);
    expect(isLocalhostUrl("chrome://newtab/")).toBe(false);
    expect(isLocalhostUrl("about:blank")).toBe(false);
    expect(isLocalhostUrl("")).toBe(false);
    expect(isLocalhostUrl(null)).toBe(false);
  });

  it("extracts port accurately", () => {
    expect(getLocalhostPort("http://localhost:3000")).toBe(3000);
    expect(getLocalhostPort("http://127.0.0.1:8080/dashboard")).toBe(8080);
    expect(getLocalhostPort("http://localhost")).toBe(80);
    expect(getLocalhostPort("https://localhost")).toBe(443);
    expect(getLocalhostPort("")).toBe(80);
  });
});

describe("prioritizeLocalhost option", () => {
  it("prioritizes localhost tabs to the beginning sorted by port then url in comparisonByDomain", () => {
    const tabs = [
      tab(1, "https://google.com"),
      tab(2, "http://localhost:8080/admin"),
      tab(3, "http://localhost:3000/app"),
      tab(4, "https://facebook.com"),
      tab(5, "http://localhost:3000/api"),
      tab(6, "http://127.0.0.1:5173"),
      tab(7, "chrome://newtab/"),
    ];

    const sortedWithPriority = [...tabs]
      .sort((a, b) => comparisonByDomain(a, b, { prioritizeLocalhost: true }))
      .map((t) => t.id);

    // Localhost tabs:
    // 3000: tab 5 (/api) < tab 3 (/app)
    // 5173: tab 6
    // 8080: tab 2
    // External tabs:
    // facebook (4) < google (1)
    // Internal tabs:
    // chrome://newtab/ (7)
    expect(sortedWithPriority).toEqual([5, 3, 6, 2, 4, 1, 7]);
  });

  it("preserves standard domain sorting when prioritizeLocalhost is false", () => {
    const tabs = [
      tab(1, "https://google.com"),
      tab(2, "http://localhost:8080/admin"),
      tab(3, "https://facebook.com"),
    ];

    const sortedWithoutPriority = [...tabs]
      .sort((a, b) => comparisonByDomain(a, b, { prioritizeLocalhost: false }))
      .map((t) => t.id);

    // facebook.com (3) < google.com (1) < localhost (2)
    expect(sortedWithoutPriority).toEqual([3, 1, 2]);
  });

  it("prioritizes localhost tabs to the beginning in comparisonByUrl", () => {
    const tabs = [
      tab(1, "https://zebra.com"),
      tab(2, "http://localhost:3000"),
      tab(3, "https://apple.com"),
    ];

    const sorted = [...tabs]
      .sort((a, b) => comparisonByUrl(a, b, { prioritizeLocalhost: true }))
      .map((t) => t.id);

    expect(sorted).toEqual([2, 3, 1]);
  });
});

describe("pinned tab sorting (issue #9)", () => {
  it("sorts pinned tabs independently by URL", () => {
    const pinnedTabs = tabsFromUrls(
      [
        "https://youtube.com",
        "https://github.com",
        "https://amazon.com",
        "https://google.com",
      ],
      { pinned: true },
    );

    const order = computePinnedTabOrder(pinnedTabs, {
      comparisonFunction: comparisonByUrl,
    });

    expect(order).toEqual([3, 2, 4, 1]);
  });
});

describe("suspended tabs grouping (issue #18)", () => {
  it("groups suspended tabs at the end", () => {
    const tabs = [
      tab(1, "https://google.com"),
      tab(2, "https://amazon.com", { discarded: true }),
      tab(3, "https://github.com"),
      tab(4, "https://wikipedia.org", { discarded: true }),
    ];

    const sorted = [...tabs].sort(comparisonByUrl);
    const grouped = groupSuspendedTabs(sorted, "end");

    expect(grouped.map((t) => t.id)).toEqual([3, 1, 2, 4]);
    expect(grouped.slice(0, 2).every((t) => !t.discarded)).toBe(true);
    expect(grouped.slice(2).every((t) => t.discarded)).toBe(true);
  });

  it("groups suspended tabs at the beginning via legacy sort order", () => {
    const tabs = [
      tab(1, "https://google.com"),
      tab(2, "https://amazon.com", { discarded: true }),
      tab(3, "https://github.com"),
    ];

    const order = computeLegacyTabOrder(tabs, {
      comparisonFunction: comparisonByUrl,
      suspendedPosition: "beginning",
    });

    expect(order[0]).toBe(2);
    expect(order.slice(1)).toEqual([3, 1]);
  });

  it("groups suspended tabs at the end via legacy sort order", () => {
    const tabs = [
      tab(1, "https://google.com"),
      tab(2, "https://amazon.com", { discarded: true }),
      tab(3, "https://github.com"),
    ];

    const order = computeLegacyTabOrder(tabs, {
      comparisonFunction: comparisonByUrl,
      suspendedPosition: "end",
    });

    expect(order).toEqual([3, 1, 2]);
  });
});

describe("tab groups support (issue #19)", () => {
  it("sorts within groups while preserving group positions", () => {
    const tabs = [
      tab(1, "https://github.com", { groupId: 100 }),
      tab(2, "https://youtube.com"),
      tab(3, "https://google.com", { groupId: 100 }),
      tab(4, "https://amazon.com", { groupId: 200 }),
      tab(5, "https://wikipedia.org", { groupId: 100 }),
      tab(6, "https://reddit.com", { groupId: 200 }),
    ];

    const order = computeGroupAwareTabOrder(tabs, {
      comparisonFunction: comparisonByUrl,
    });

    expect(order).toEqual([1, 3, 5, 2, 4, 6]);
  });

  it("organizeTabsByGroup separates grouped and ungrouped tabs", () => {
    const tabs = [
      tab(1, "https://github.com", { groupId: 42 }),
      tab(2, "https://google.com"),
      tab(3, "https://amazon.com", { groupId: 42 }),
    ];

    const { groups, ungrouped } = organizeTabsByGroup(tabs);
    expect(groups.size).toBe(1);
    expect(groups.get(42).tabs).toHaveLength(2);
    expect(ungrouped).toHaveLength(1);
  });
});

describe("removeParenthesisNotification", () => {
  it("removes notification counts from titles", () => {
    expect(removeParenthesisNotification("(20) My Video")).toBe("My Video");
  });
});

function extractHostname(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}
