import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearCheckInCache } from "./storage";

/** Desktop layout in tests — jsdom has no real viewport or matchMedia. */
function mockMatchMedia(width = 1280): void {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.matchMedia = (query: string): MediaQueryList => {
    const min = query.match(/min-width:\s*(\d+)px/);
    const max = query.match(/max-width:\s*(\d+)px/);
    let matches = true;
    if (min) matches = width >= Number(min[1]);
    if (max) matches = matches && width <= Number(max[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

mockMatchMedia(1280);

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearCheckInCache();
});
