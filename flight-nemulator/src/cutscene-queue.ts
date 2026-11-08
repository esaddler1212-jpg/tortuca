export type DialogueLine = {
  id: string;
  speaker: string;
  text: string;
  side: 'hero' | 'foe' | 'narrator' | 'ally';
};

let queue: DialogueLine[] = [];
let current: DialogueLine | null = null;
let defeatThrottleUntil = 0;

const DEFEAT_THROTTLE_MS = 7_500;

export function queueDialogue(lines: DialogueLine[]): void {
  if (!lines.length) return;
  if (!current) {
    current = lines[0]!;
    queue.push(...lines.slice(1));
    return;
  }
  queue.push(...lines);
}

export function acknowledgeDialogue(): void {
  if (queue.length === 0) {
    current = null;
    return;
  }
  current = queue.shift() ?? null;
}

export function cutsceneHudFields(): {
  cutsceneActive: boolean;
  cutsceneSpeaker: string | null;
  cutsceneText: string | null;
  cutsceneSide: DialogueLine['side'] | null;
  cutsceneQueued: number;
} {
  if (!current) {
    return {
      cutsceneActive: false,
      cutsceneSpeaker: null,
      cutsceneText: null,
      cutsceneSide: null,
      cutsceneQueued: 0
    };
  }
  return {
    cutsceneActive: true,
    cutsceneSpeaker: current.speaker,
    cutsceneText: current.text,
    cutsceneSide: current.side,
    cutsceneQueued: queue.length
  };
}

export function canQueueGenericDefeatLine(nowMs: number): boolean {
  return nowMs >= defeatThrottleUntil;
}

export function markGenericDefeatLine(nowMs: number): void {
  defeatThrottleUntil = nowMs + DEFEAT_THROTTLE_MS;
}

export function clearDialogueQueue(): void {
  queue = [];
  current = null;
}
