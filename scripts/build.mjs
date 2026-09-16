import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "template-extension");
const buildDir = path.join(rootDir, "build");

const args = process.argv.slice(2);
const isWatch = args.includes("--watch");
const targets = args.filter((a) => !a.startsWith("--"));
const target = targets[0] || "all"; // 'chrome', 'firefox', or 'all'

function buildChrome() {
  const outDir = path.join(buildDir, "chrome-extension");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Copy all template files
  fs.cpSync(templateDir, outDir, { recursive: true });

  // Chrome MV3 uses service_worker directly, background-tab-sorter.html is not needed
  const bgHtml = path.join(outDir, "background-tab-sorter.html");
  if (fs.existsSync(bgHtml)) {
    fs.unlinkSync(bgHtml);
  }

  // Adjust manifest.json for Chrome
  const manifestPath = path.join(templateDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  delete manifest.browser_specific_settings;
  manifest.background = {
    service_worker: "tab-sorter.js",
    type: "module",
  };

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );

  console.log("✔ Chrome extension built to build/chrome-extension");
}

function buildFirefox() {
  const outDir = path.join(buildDir, "firefox-extension");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Copy all template files
  fs.cpSync(templateDir, outDir, { recursive: true });

  // Adjust manifest.json for Firefox MV3 (uses background page)
  const manifestPath = path.join(templateDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  manifest.background = {
    page: "background-tab-sorter.html",
  };

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );

  console.log("✔ Firefox extension built to build/firefox-extension");
}

function runBuild() {
  if (target === "chrome" || target === "all") {
    buildChrome();
  }
  if (target === "firefox" || target === "all") {
    buildFirefox();
  }
}

// Initial run
runBuild();

if (isWatch) {
  console.log(`\n👀 Watching for changes in template-extension/ [target: ${target}]...`);
  let debounceTimeout = null;

  fs.watch(templateDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log(`\n[${new Date().toLocaleTimeString()}] File changed: ${filename}`);
      runBuild();
    }, 100);
  });
}
