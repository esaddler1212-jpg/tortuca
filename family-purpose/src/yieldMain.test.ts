import { describe, expect, it } from "vitest";
import { isLikelyLowPowerDevice, yieldToMain } from "./yieldMain";

describe("yieldToMain", () => {
  it("returns a promise that resolves", async () => {
    await expect(yieldToMain()).resolves.toBeUndefined();
  });
});

describe("isLikelyLowPowerDevice", () => {
  it("treats two cores as low power", () => {
    const original = navigator.hardwareConcurrency;
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 2,
    });
    expect(isLikelyLowPowerDevice()).toBe(true);
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: original,
    });
  });
});
