const BASE = "/vendor/dust-orb";

const SCRIPT_IDS = ["dust-orb-three", "dust-orb-motion", "dust-orb-material", "dust-orb-ce"] as const;

const SCRIPTS: { id: (typeof SCRIPT_IDS)[number]; src: string }[] = [
  { id: "dust-orb-three", src: `${BASE}/vendor/three-r180.js` },
  { id: "dust-orb-motion", src: `${BASE}/vendor/motion.js` },
  { id: "dust-orb-material", src: `${BASE}/material.js` },
  { id: "dust-orb-ce", src: `${BASE}/dust-orb.js` },
];

let loadPromise: Promise<void> | null = null;

function injectScript(id: string, src: string): Promise<void> {
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.id = id;
    el.src = src;
    el.async = false;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

/** Lazy-load Ship Notes Dust Orb scripts once per tab. */
export function loadDustOrbScripts(): Promise<void> {
  if (typeof customElements !== "undefined" && customElements.get("dust-orb")) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    for (const s of SCRIPTS) {
      await injectScript(s.id, s.src);
    }
    if (!customElements.get("dust-orb")) {
      await customElements.whenDefined("dust-orb");
    }
  })().catch((e) => {
    loadPromise = null;
    throw e;
  });
  return loadPromise;
}