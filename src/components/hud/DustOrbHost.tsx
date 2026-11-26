import { useEffect, useRef, useState } from "react";
import type { IrisCorePhase } from "../../../shared/dustOrbBridge";
import { applyDustOrbToElement, mapIrisToDustOrb } from "../../../shared/dustOrbBridge";
import { loadDustOrbScripts } from "../../lib/dustOrbLoader";

type DustOrbEl = HTMLElement & {
  setState?: (s: string) => void;
  setVoiceLevel?: (n: number) => void;
  setQuality?: (q: string | number) => void;
  pause?: (p: boolean) => void;
  pulse?: () => void;
  destroy?: () => void;
};

interface Props {
  phase: IrisCorePhase;
  speaking: boolean;
  waiting: boolean;
  degraded: boolean;
  askError?: boolean;
  replyTick: number;
  voiceTick: number;
  paused?: boolean;
}

/** Ship Notes `<dust-orb>` — loaded only on wide viewports from CoreRing. */
export function DustOrbHost({
  phase,
  speaking,
  waiting,
  degraded,
  askError,
  replyTick,
  voiceTick,
  paused,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<DustOrbEl | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadDustOrbScripts()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mountRef.current || failed) return;
    let orb = mountRef.current.querySelector("dust-orb") as DustOrbEl | null;
    if (!orb) {
      orb = document.createElement("dust-orb") as DustOrbEl;
      orb.setAttribute("style", "display:block;width:100%;height:100%;min-height:200px");
      orb.setAttribute("aria-hidden", "true");
      mountRef.current.appendChild(orb);
    }
    orbRef.current = orb;
    orb.setQuality?.("auto");

    return () => {
      orb?.destroy?.();
      orb?.remove();
      orbRef.current = null;
    };
  }, [ready, failed]);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    applyDustOrbToElement(orb, {
      phase,
      speaking,
      waitingGreeting: waiting,
      askError,
      systemDegraded: degraded,
    });
  }, [phase, speaking, waiting, degraded, askError]);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb?.setVoiceLevel) return;
    const { voiceLevel } = mapIrisToDustOrb({ phase, speaking, voiceLevel: speaking ? 0.5 : 0 });
    if (speaking) {
      const wobble = 0.12 * Math.sin(voiceTick * 0.55);
      orb.setVoiceLevel(Math.min(1, voiceLevel + wobble));
    } else {
      orb.setVoiceLevel(0);
    }
  }, [speaking, voiceTick, phase]);

  useEffect(() => {
    if (replyTick > 0) orbRef.current?.pulse?.();
  }, [replyTick]);

  useEffect(() => {
    orbRef.current?.pause?.(Boolean(paused));
  }, [paused]);

  if (failed) return null;

  return <div ref={mountRef} className="absolute inset-0 z-0" aria-hidden />;
}