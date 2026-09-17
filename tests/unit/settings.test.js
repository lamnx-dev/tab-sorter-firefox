import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  STORAGE_DEFAULT_VALUE_AUTO_SORT_ON_NEW_TAB,
  STORAGE_DEFAULT_VALUE_DEFAULT_SORT_METHOD,
} from "../../template-extension/lib/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(
  __dirname,
  "../../template-extension/manifest.json",
);

describe("settings defaults and manifest shortcuts", () => {
  it("defaults auto-sort on new tab to true", () => {
    expect(STORAGE_DEFAULT_VALUE_AUTO_SORT_ON_NEW_TAB).toBe(true);
  });

  it("defaults sort method to sort_tabs_domain", () => {
    expect(STORAGE_DEFAULT_VALUE_DEFAULT_SORT_METHOD).toBe("sort_tabs_domain");
  });

  it("has no default shortcut for command_sort_tabs_mru in manifest", () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const mruCommand = manifest.commands?.command_sort_tabs_mru;
    expect(mruCommand).toBeDefined();
    expect(mruCommand.suggested_key).toBeUndefined();
  });
});
