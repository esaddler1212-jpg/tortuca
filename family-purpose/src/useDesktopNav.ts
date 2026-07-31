import { useEffect, useState } from "react";

/** True when the sidebar layout is active (desktop / wide). Defaults to true for SSR and tests. */
export function useDesktopNav(): boolean {
  const [desktop, setDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const update = () => setDesktop(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return desktop;
}
