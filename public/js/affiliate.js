// Amazon Associates tracking ID. Set this once your account is approved,
// e.g. "myflowerblog-20". Leave empty to link to Amazon without a tag.
const AMAZON_TAG = "";

document.addEventListener("DOMContentLoaded", () => {
  if (!AMAZON_TAG) return;
  document.querySelectorAll('a[href^="https://www.amazon.com"]').forEach((a) => {
    try {
      const url = new URL(a.href);
      url.searchParams.set("tag", AMAZON_TAG);
      a.href = url.toString();
    } catch (_) {
      /* leave link as-is */
    }
  });
});
