/* ============================================================
   Yi's Garden — affiliate configuration
   ------------------------------------------------------------
   EDIT THE SECTION BELOW to change the "From my garden shed"
   product boxes. Everything is in this one file — you don't
   need to touch any HTML.

   After you change anything here, bump the version number on the
   <script src="js/affiliate.js?v=N"> line in the HTML files (or
   just ask Claude to) so visitors' browsers load the new version.
   ============================================================ */

/* Your Amazon Associates tracking ID, e.g. "yisgarden-20".
   Leave it "" until your account is approved — the links still
   work, they're just untagged until then. Set it once and every
   Amazon link on the site is tagged automatically. */
const AMAZON_TAG = "";

/* The product boxes, one list per post (keyed by the post's slug —
   the filename without ".html").  Each product has:
     text : the clickable link text
     url  : the Amazon link (a search URL, or a specific product URL)
     note : the bit after the " — " dash (leave "" for none)
   Add, remove, or reorder items freely. */
const GARDEN_SHED = {
  "june-roses": [
    { text: "A sturdy metal obelisk trellis", url: "https://www.amazon.com/s?k=garden+obelisk+trellis+for+climbing+roses", note: "the climber's whole personality depends on it." },
    { text: "Espoma Rose-tone", url: "https://www.amazon.com/s?k=espoma+rose-tone+organic+fertilizer", note: "I feed after each flush; the repeat bloom is noticeably better." },
    { text: "Bypass pruners", url: "https://www.amazon.com/s?k=felco+f-2+bypass+pruning+shears", note: "for the every-few-days deadheading rounds." }
  ],
  "azaleas-and-tree-peony": [
    { text: "Espoma Holly-tone", url: "https://www.amazon.com/s?k=espoma+holly-tone+organic+fertilizer", note: "one feeding after bloom keeps the azaleas and the peony happy; they're all acid-lovers." },
    { text: "Pine bark mulch", url: "https://www.amazon.com/s?k=pine+bark+mulch", note: "shallow azalea roots dry out fast; two inches of this fixes it." }
  ],
  "garden-after-dark": [
    { text: "Solar hanging lanterns", url: "https://www.amazon.com/s?k=solar+hanging+lantern+outdoor+garden", note: "the pair flanking the camellia; zero wiring, they just work." },
    { text: "Warm-white landscape spotlights", url: "https://www.amazon.com/s?k=low+voltage+landscape+spotlight+warm+white", note: "one under the hydrangea does more than ten anywhere else." }
  ],
  "wisteria-week": [
    { text: "Long-reach loppers", url: "https://www.amazon.com/s?k=long+reach+bypass+loppers", note: "for the twice-a-year negotiation session with the top of the arbor." },
    { text: "Soft stretch plant tie", url: "https://www.amazon.com/s?k=soft+stretch+plant+tie+tape", note: "trains new runners along the fence without cutting into the bark." }
  ],
  "tulip-roll-call": [
    { text: "A bulb auger for the drill", url: "https://www.amazon.com/s?k=bulb+auger+drill+bit", note: "turned two hours of trowel work into twenty minutes. November-me's best purchase." },
    { text: "Espoma Bulb-tone", url: "https://www.amazon.com/s?k=espoma+bulb-tone+fertilizer", note: "a handful in every planting hole; the difference shows in year two." }
  ],
  "creeping-phlox-carpet": [
    { text: "Creeping phlox starter plants", url: "https://www.amazon.com/s?k=creeping+phlox+live+plants", note: "plant on 18-inch centers in fall; by spring three they'll have merged." },
    { text: "A garden kneeler", url: "https://www.amazon.com/s?k=garden+kneeler+seat+foldable", note: "the post-bloom shearing happens at ground level, and my knees vote yes." }
  ],
  "kwanzan-cherry": [
    { text: "A folding pruning saw", url: "https://www.amazon.com/s?k=folding+pruning+saw", note: "cherries only need dead or crossing branches removed, but do it in summer; they hate winter cuts." }
  ]
};

/* Heading shown above each product list, and the required
   affiliate-disclosure line (singular/plural chosen automatically). */
const SHED_HEADING = "From my garden shed";
const DISCLOSURE_ONE = "This is an Amazon affiliate link — if you buy through it I may earn a small commission at no extra cost to you. I only list things I actually use.";
const DISCLOSURE_MANY = "These are Amazon affiliate links — if you buy through them I may earn a small commission at no extra cost to you. I only list things I actually use.";

/* ============================================================
   Rendering logic — no need to edit past this point.
   ============================================================ */

function withAmazonTag(url) {
  if (!AMAZON_TAG) return url;
  try {
    const u = new URL(url);
    if (/(^|\.)amazon\.com$/.test(u.hostname)) u.searchParams.set("tag", AMAZON_TAG);
    return u.toString();
  } catch (_) {
    return url;
  }
}

function renderShed(aside, items) {
  const heading = document.createElement("h3");
  heading.textContent = SHED_HEADING;

  const ul = document.createElement("ul");
  items.forEach(function (item) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = withAmazonTag(item.url);
    a.rel = "nofollow sponsored";
    a.textContent = item.text;
    li.appendChild(a);
    if (item.note) li.appendChild(document.createTextNode(" — " + item.note));
    ul.appendChild(li);
  });

  const fine = document.createElement("p");
  fine.className = "fineprint";
  fine.textContent = items.length === 1 ? DISCLOSURE_ONE : DISCLOSURE_MANY;

  aside.replaceChildren(heading, ul, fine);
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".garden-shed[data-shed]").forEach(function (aside) {
    const items = GARDEN_SHED[aside.getAttribute("data-shed")];
    if (items && items.length) renderShed(aside, items);
  });

  // Safety net: tag any stray Amazon links that live outside a shed box.
  if (AMAZON_TAG) {
    document.querySelectorAll('a[href^="https://www.amazon.com"]').forEach(function (a) {
      a.href = withAmazonTag(a.href);
    });
  }
});
