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

// 4. Collect post metadata straight from each post's <head>, newest first.
const SITE = "https://yisgarden.com";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const meta = (html, re) => (html.match(re) || [])[1];

const postsDir = path.join(OUT, "posts");
const posts = fs.readdirSync(postsDir)
  .filter((f) => f.endsWith(".html"))
  .map((f) => {
    const html = fs.readFileSync(path.join(postsDir, f), "utf8");
    const slug = f.slice(0, -5);
    const published = meta(html, /property="article:published_time" content="([^"]+)"/);
    if (!published) throw new Error(`posts/${f} is missing article:published_time`);
    return {
      file: path.join(postsDir, f),
      slug,
      url: `${SITE}/posts/${slug}`,
      title: meta(html, /property="og:title" content="([^"]+)"/),
      description: meta(html, /name="description" content="([^"]+)"/),
      image: meta(html, /property="og:image" content="([^"]+)"/),
      published,
      modified: meta(html, /"dateModified": "([^"]+)"/) || published,
    };
  })
  .sort((a, b) => b.published.localeCompare(a.published));

// 5. Previous/next links at the foot of every post.
posts.forEach((p, i) => {
  const newer = posts[i - 1], older = posts[i + 1];
  const link = (q, cls, label) =>
    q ? `<a class="${cls}" href="/posts/${q.slug}"><span>${label}</span>${q.title}</a>` : "";
  const nav = `<nav class="post-nav" aria-label="More posts">${link(older, "prev", "← Earlier")}${link(newer, "next", "Later →")}</nav>\n  `;
  const html = fs.readFileSync(p.file, "utf8");
  fs.writeFileSync(p.file, html.replace(/<\/article>/, `${nav}</article>`));
});

// 6. sitemap.xml, generated so a new post can never be left out.
const latest = posts.reduce((m, p) => (p.modified > m ? p.modified : m), "");
const urls = [
  `  <url><loc>${SITE}/</loc><lastmod>${latest}</lastmod></url>`,
  ...posts.map((p) => `  <url><loc>${p.url}</loc><lastmod>${p.modified}</lastmod></url>`),
  `  <url><loc>${SITE}/about</loc></url>`,
];
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);

// 7. RSS feed for feed readers.
const rfc822 = (d) => new Date(`${d}T12:00:00Z`).toUTCString();
const items = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${p.url}</link>
      <guid>${p.url}</guid>
      <pubDate>${rfc822(p.published)}</pubDate>
      <description>${esc(`<p><img src="${p.image}" alt=""></p><p>${p.description}</p>`)}</description>
    </item>`);
fs.writeFileSync(path.join(OUT, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Yi's Garden</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>A journal of one backyard's flowers through the seasons.</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(posts[0].published)}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`);

console.log("Built dist/ with content-hashed assets:");
for (const [k, v] of Object.entries(renamed)) console.log(`  ${k}  ->  ${v}`);
console.log(`Generated sitemap.xml and feed.xml (${posts.length} posts), post prev/next links.`);
