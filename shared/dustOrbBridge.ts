/**
 * Ship Notes Dust Orb v2 — state bridge for a future <dust-orb> embed.
 * @see docs/DEEP_DIVE_DUST_ORB.md
 */
export type DustOrbState = "idle" | "listening" | "thinking" | "speaking" | "agitated";

export type IrisCorePhase = "idle" | "listening" | "thinking" | "speaking";

export interface DustOrbDriverInput {
  phase: IrisCorePhase;
  speaking: boolean;
  waitingGreeting?: boolean;
  askError?: boolean;
  systemDegraded?: boolean;
  /** Optional 0–1 envelope; when missing, speaking uses a simple on/off level */
  voiceLevel?: number;
}

export function mapIrisToDustOrb(input: DustOrbDriverInput): { state: DustOrbState; voiceLevel: number } {
  if (input.askError || input.systemDegraded) {
    return { state: "agitated", voiceLevel: 0 };
  }
  if (input.speaking || input.phase === "speaking") {
    const voiceLevel = input.voiceLevel ?? 0.55;
    return { state: "speaking", voiceLevel };
  }
  if (input.phase === "thinking") {
    return { state: "thinking", voiceLevel: 0 };
  }
  if (input.phase === "listening") {
    return { state: "listening", voiceLevel: 0 };
  }
  if (input.waitingGreeting) {
    return { state: "idle", voiceLevel: 0 };
  }
  return { state: "idle", voiceLevel: 0 };
}

/** Minimal DOM driver when custom element is on the page (lazy integration). */
export function applyDustOrbToElement(el: HTMLElement & { setState?: (s: string) => void; setVoiceLevel?: (n: number) => void }, input: DustOrbDriverInput): void {
  if (typeof el.setState !== "function") return;
  const { state, voiceLevel } = mapIrisToDustOrb(input);
  el.setState(state);
  el.setVoiceLevel?.(voiceLevel);
}