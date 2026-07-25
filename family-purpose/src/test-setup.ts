import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearCheckInCache } from "./storage";

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearCheckInCache();
});
