#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const rawVersion = String(process.argv[2] || process.env.GITHUB_SHA || "local").trim();
const version = rawVersion.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40) || "local";
const routeIndexDirs = [
  "announcements",
  "athletes",
  "calendar",
  "coach-profile",
  "competition",
  "favorites",
  "home",
  "journal",
  "media",
  "messages",
  "parent",
  "permissions",
  "plans",
  "profile",
  "scouting",
  "today",
  "tournament",
  "training"
];

async function updateFile(path, transform) {
  const original = await readFile(path, "utf8");
  const next = transform(original);
  if (next !== original) {
    await writeFile(path, next);
    console.log(`[stamp-assets] ${relative(root, path)} -> ${version}`);
  }
}

await updateFile(join(root, "index.html"), (content) => content
  .replace(/styles\.css\?v=[^"'\s<>]+/g, `styles.css?v=${version}`)
  .replace(/app\.js\?v=[^"'\s<>]+/g, `app.js?v=${version}`));

await updateFile(join(root, "app.js"), (content) => content
  .replace(/const DOMAIN_ASSET_VERSION = "([^"]*)";/, `const DOMAIN_ASSET_VERSION = "${version}";`));

for (const dir of routeIndexDirs) {
  await updateFile(join(root, dir, "index.html"), (content) => content
    .replace(/route-loader\.js\?v=[^"'\s<>]+/g, `route-loader.js?v=${version}`));
}

await writeFile(join(root, "version.json"), `${JSON.stringify({
  version,
  generatedAt: new Date().toISOString()
}, null, 2)}\n`);
console.log(`[stamp-assets] version.json -> ${version}`);
