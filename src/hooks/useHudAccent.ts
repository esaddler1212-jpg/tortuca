import { useEffect, useState } from "react";
import { readHudAccent, type HudAccent } from "../lib/hudAccent";

/** Live accent triplets when `html[data-focus]` changes (school / network / weekend …). */
export function useHudAccent(): HudAccent & { focus: string } {
  const [focus, setFocus] = useState(() => document.documentElement.getAttribute("data-focus") ?? "school");
  const [accent, setAccent] = useState(() => readHudAccent());

  useEffect(() => {
    const sync = () => {
      setFocus(document.documentElement.getAttribute("data-focus") ?? "school");
      setAccent(readHudAccent());
    };
    sync();
    const ob = new MutationObserver(sync);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ["data-focus"] });
    return () => ob.disconnect();
  }, []);

  return { ...accent, focus };
}
