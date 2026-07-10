# My Flower Journey

A static garden blog — plain HTML/CSS, no build step. Everything that deploys
lives in `public/`; the original iPhone photos (HEIC/MOV) stay out of git.

## Structure

- `public/` — the deployable site (HTML, CSS, images)
- `public/js/affiliate.js` — set `AMAZON_TAG` here once your Amazon Associates
  account is approved (e.g. `"myflowerblog-20"`). All Amazon links on the site
  pick it up automatically; until then links work untagged.
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

## Amazon Associates notes

- Product links point at Amazon search results, so they never go stale; swap
  any of them for specific product URLs if you prefer.
- Affiliate links carry `rel="nofollow sponsored"` and each "From my garden
  shed" box includes a disclosure line; a site-wide disclosure sits in the
  footer. Keep those — Amazon requires them.
