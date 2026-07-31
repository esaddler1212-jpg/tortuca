import type { Film } from "@/types/film";

export interface AccessResult {
  allowed: boolean;
  reason?: "sign_in" | "premium" | "geo";
  message?: string;
}

export function checkFilmAccess(options: {
  film: Film;
  isAuthenticated: boolean;
  hasPremium: boolean;
  viewerCountry: string | null;
}): AccessResult {
  const { film, isAuthenticated, hasPremium, viewerCountry } = options;

  if (film.allowedCountries?.length) {
    const allowed = film.allowedCountries.map((c) => c.toUpperCase());
    if (viewerCountry && !allowed.includes(viewerCountry)) {
      return {
        allowed: false,
        reason: "geo",
        message: "This title is not available in your region.",
      };
    }
  }

  if (film.requiresPremium && !hasPremium) {
    if (!isAuthenticated) {
      return {
        allowed: false,
        reason: "sign_in",
        message: "Sign in and subscribe to watch this title.",
      };
    }
    return {
      allowed: false,
      reason: "premium",
      message: "Upgrade to Tortuca Premium to watch this title.",
    };
  }

  return { allowed: true };
}
