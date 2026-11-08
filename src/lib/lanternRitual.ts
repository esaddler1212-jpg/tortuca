import { dayKey } from "../../shared/timezone";

const PREFIX = "gods-eye-lantern-unlock";

export function lanternUnlockKey(timezone: string): string {
  return `${PREFIX}-${dayKey(timezone)}`;
}

export function isLanternUnlockedToday(timezone: string): boolean {
  try {
    return localStorage.getItem(lanternUnlockKey(timezone)) === "1";
  } catch {
    return false;
  }
}

export function markLanternUnlockedToday(timezone: string): void {
  localStorage.setItem(lanternUnlockKey(timezone), "1");
}
