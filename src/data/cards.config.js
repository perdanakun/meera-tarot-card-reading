import placeholderCat from "../assets/background/cat_hero-04-04.svg";

// Array order = thumbnail order. slug must exactly match the asset folder.
export const CARD_METADATA = [
  {
    slug: "00-the-fool", number: "0", title: "THE FOOL",
    theme: { primary: "#496353", accent: "#FCCD4A", bg: "#142820", text: "#FFF5DB" },
    keyword: "Beginnings", element: "Air",
    stats: { luck: 88, mystery: 42, courage: 92 },
    description: "A curious paw at the edge of possibility. Follow one small adventure, even before you know where it leads.",
    motion: { propsFrom: "rise", mainFrom: "bottom" },
  },
  {
    slug: "01-the-magician", number: "I", title: "THE MAGICIAN",
    theme: { primary: "#8D292F", accent: "#FCCD4A", bg: "#30151C", text: "#FFF5DB" },
    keyword: "Creation", element: "Mercury",
    stats: { luck: 76, mystery: 84, courage: 90 },
    description: "Focus turns possibility into something real. Lucifur reminds you that the tools you need may already be within reach.",
    motion: { propsFrom: "pop", mainFrom: "bottom" },
  },
  {
    slug: "02-the-high-priestess", number: "II", title: "THE HIGH PRIESTESS",
    theme: { primary: "#23335A", accent: "#FCCD4A", bg: "#10192E", text: "#FFF5DB" },
    keyword: "Intuition", element: "Water",
    stats: { luck: 70, mystery: 95, courage: 50 },
    description: "Quiet eyes see what noise conceals. Pause beside the veil, trust your intuition, and let the answer arrive.",
    motion: { propsFrom: "fade", mainFrom: "bottom" },
  },
];

// Vite needs literal patterns. * matches one folder level; no recursive lookup.
// eager + ?url + default produces URL strings, not decoded image bytes.
const files = import.meta.glob(
  ["../assets/cards/*/*.png", "../assets/cards/*/*.webp", "../assets/cards/*/*.webm", "../assets/cards/*/*.mov"],
  { eager: true, query: "?url", import: "default" },
);
const groups = {};
for (const [path, url] of Object.entries(files)) {
  const [, slug, name] = path.match(/\/cards\/([^/]+)\/([^/]+)$/) || [];
  if (slug) (groups[slug] ||= {})[name] = url;
}
export const cards = CARD_METADATA.map((meta) => {
  const assets = groups[meta.slug] || {};
  const image = (name) => assets[`${name}.webp`] || assets[`${name}.png`];
  const propNames = [...new Set(Object.keys(assets)
    .filter((name) => /^assets(?:-\d+)?\.(png|webp)$/.test(name))
    .map((name) => name.replace(/\.(png|webp)$/, "")))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return { ...meta, urlId: meta.slug.replace(/^\d+-the-/, "").replace(/^\d+-/, ""), media: {
    bg: image("bg"), main: image("main") || placeholderCat,
    // Drop main.webm / main.mov in this card's folder. No import changes needed.
    webm: assets["main.webm"], mov: assets["main.mov"],
    props: propNames.map((name) => ({ id: name, src: image(name) })),
    placeholder: !image("main"),
  } };
});
export function cardIndexFromQuery(value) {
  return Math.max(0, cards.findIndex((card) => card.urlId === value || card.slug === value));
}
const decoded = new Map();
function decodeImage(src) {
  if (!src) return Promise.resolve();
  if (!decoded.has(src)) decoded.set(src, new Promise((resolve) => {
    const img = new Image(); img.decoding = "async";
    img.onload = async () => { try { await img.decode?.(); } catch { /* Loaded pixels remain usable. */ } resolve(); };
    img.onerror = resolve; // Missing optional images must never lock navigation.
    img.src = src;
  }));
  return decoded.get(src);
}
export function preloadCard(card) {
  if (!card) return Promise.resolve();
  return Promise.all([card.media.bg, card.media.main, ...card.media.props.map((prop) => prop.src)].map(decodeImage));
}
