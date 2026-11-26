/**
 * Medusa (medusajs/medusa) — documented alternate to Shopify for Easy Supply.
 * Tortuca commerce integration remains Shopify-first until an explicit cutover.
 */
export const COMMERCE_PRIMARY = "shopify" as const;

export const MEDUSA_ENV = {
  backendUrl: "MEDUSA_BACKEND_URL",
  adminToken: "MEDUSA_ADMIN_API_TOKEN",
} as const;

/** Iris-facing strategy line — no live Medusa call until a medusa-store handler exists. */
export function medusaCommerceHintForIris(shopifyConfigured: boolean): string {
  const primary =
    COMMERCE_PRIMARY === "shopify"
      ? shopifyConfigured
        ? "Commerce: Shopify is primary (Easy Supply); Netlify read-only Admin API."
        : "Commerce: Shopify not connected — finish SHOPIFY_* env + launch checklist before Medusa."
      : "Commerce: Medusa primary.";
  return [
    primary,
    "Medusa (MIT headless) is a VPS alternative documented in DEEP_DIVE_MEDUSA.md — do not suggest migrating before thumbnails lead revenue and Shopify checklist fails or GMV fees justify replatforming.",
  ].join(" ");
}