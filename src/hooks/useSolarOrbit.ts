import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_DEG_PER_MS = 360 / (1000 * 240); // one full orbit every 4 minutes

/** Continuous slow orbit plus user drag / wheel spin. */
export function useSolarOrbit(initial = 0) {
  const [userDeg, setUserDeg] = useState(initial);
  const [autoDeg, setAutoDeg] = useState(0);
  const dragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!dragging.current) {
        setAutoDeg((a) => (a + AUTO_DEG_PER_MS * dt) % 360);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const totalDeg = autoDeg + userDeg;

  const addSpin = useCallback((delta: number) => {
    setUserDeg((u) => u + delta);
  }, []);

  const setFrontForSlot = useCallback(
    (slotDeg: number) => {
      setUserDeg(() => 180 - slotDeg - autoDeg);
    },
    [autoDeg],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta === 0) return;
      e.preventDefault();
      addSpin(delta * 0.15);
    },
    [addSpin],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      addSpin(dx * 0.35);
    },
    [addSpin],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return {
    totalDeg,
    setFrontForSlot,
    orbitHandlers: { onWheel, onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerUp },
  };
}
