/** Lets the browser paint before heavy work (PDF generation on slow CPUs). */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    const run = () => resolve();
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(run, { timeout: 150 });
    } else {
      setTimeout(run, 0);
    }
  });
}

/** Chromebooks and similar devices often report two cores. */
export function isLikelyLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency;
  return typeof cores === "number" && cores > 0 && cores <= 2;
}
