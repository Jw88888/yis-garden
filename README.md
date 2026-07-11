# Yi's Garden

A static garden blog — plain HTML/CSS, no build step. Everything that deploys
lives in `public/`; the original iPhone photos (HEIC/MOV) stay out of git.

## Structure

- `public/` — the deployable site (HTML, CSS, images)
- `public/js/affiliate.js` — **the one place to edit affiliate products.**
  Set `AMAZON_TAG` here once your Amazon Associates account is approved
  (e.g. `"yisgarden-20"`); all Amazon links pick it up automatically. The
  `GARDEN_SHED` object holds every "From my garden shed" box, one list per
  post — edit the `text`, `url`, and `note` of any item, or add/remove items,
  and the boxes re-render themselves. No HTML editing needed.
- `photos/` — web-sized JPEGs converted from the originals (not deployed, kept
  locally as source material)

## Deploying to Cloudflare Pages

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages →
   Connect to Git**, pick this repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `public`
4. Deploy. Every `git push` redeploys automatically.

## Adding a post

1. Convert/resize the photo:
   `sips -s format jpeg -s formatOptions 82 --resampleHeightWidthMax 1600 IMG_XXXX.HEIC --out public/images/descriptive-name.jpg`
2. Copy an existing file in `public/posts/` as a template and edit.
3. Add a card for it at the top of the grid in `public/index.html`
   (make a thumb: `sips -s format jpeg -s formatOptions 75 --resampleHeightWidthMax 800 public/images/descriptive-name.jpg --out public/images/thumb-descriptive-name.jpg`).

## Editing the affiliate product boxes

All products live in `GARDEN_SHED` in `public/js/affiliate.js`, keyed by post
slug (the filename without `.html`). Each item is `{ text, url, note }`:

```js
"june-roses": [
  { text: "A sturdy metal obelisk trellis",
    url:  "https://www.amazon.com/s?k=garden+obelisk+trellis",
    note: "the climber's whole personality depends on it." },
],
```

Change the text or link, add or remove items — the box on that post rebuilds
itself. **After editing, bump the version** in the `<script src=".../affiliate.js?v=N">`
tags (browsers cache the file otherwise). Notes:

- Links point at Amazon search results so they never go stale; swap in a
  specific product URL any time.
- `rel="nofollow sponsored"`, the per-box disclosure, and the footer disclosure
  are added automatically — Amazon requires them, so leave them in.
