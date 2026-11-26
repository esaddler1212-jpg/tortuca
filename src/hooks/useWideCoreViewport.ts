import { useEffect, useState } from "react";

/** Command deck + Dust core band — matches Tailwind `lg` (iPad landscape, Chromebook, desktop). */
const MQ = "(min-width: 833px)";

export function useWideCoreViewport(): boolean {
  const [wide, setWide] = useState(
    () => typeof globalThis.matchMedia !== "undefined" && globalThis.matchMedia(MQ).matches,
  );

  useEffect(() => {
    const mq = globalThis.matchMedia(MQ);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return wide;
}