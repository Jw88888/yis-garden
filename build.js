#!/usr/bin/env node
/* Build step for Yi's Garden.
 *
 * Copies public/ -> dist/, then content-hashes style.css and
 * js/affiliate.js (e.g. style.a1b2c3d4e5.css) and rewrites every
 * HTML reference to point at the hashed filename. Because the filename
 * changes whenever the file's contents change, browsers can never serve
 * a stale cached copy — no manual version bumping needed.
 *
 * No dependencies: uses only Node built-ins. Cloudflare Pages runs this
 * via the project's build command; output directory is dist/.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SRC = path.join(__dirname, "public");
const OUT = path.join(__dirname, "dist");

// Assets to content-hash (relative to the site root).
const HASHED = ["style.css", "js/affiliate.js"];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function contentHash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 10);
}

function hashedName(rel, h) {
  const dir = path.posix.dirname(rel);
  const ext = path.posix.extname(rel);
  const base = path.posix.basename(rel, ext);
  const name = `${base}.${h}${ext}`;
  return dir === "." ? name : `${dir}/${name}`;
}

// 1. Fresh copy of the source tree.
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(SRC, OUT);

// 2. Hash + rename each asset, remembering old -> new.
const renamed = {};
for (const rel of HASHED) {
  const abs = path.join(OUT, rel);
  if (!fs.existsSync(abs)) throw new Error(`asset not found: ${rel}`);
  const newRel = hashedName(rel, contentHash(abs));
  fs.renameSync(abs, path.join(OUT, newRel));
  renamed[rel] = newRel;
}

// 3. Rewrite references in every HTML file. Matches optional ../ or /
//    prefix and an optional ?v=NN query, e.g. href="../style.css?v=4".
const names = HASHED.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const refRe = new RegExp(`(href|src)="((?:\\.\\./|/)?)(${names})(\\?[^"]*)?"`, "g");

function rewriteHtml(file) {
  const s = fs.readFileSync(file, "utf8");
  const out = s.replace(refRe, (m, attr, prefix, name) => `${attr}="${prefix}${renamed[name]}"`);
  if (out !== s) fs.writeFileSync(file, out);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) rewriteHtml(p);
  }
}
walk(OUT);

console.log("Built dist/ with content-hashed assets:");
for (const [k, v] of Object.entries(renamed)) console.log(`  ${k}  ->  ${v}`);
