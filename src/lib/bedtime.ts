import type { UserSettings } from "../types";
import type { LeaveByPlan } from "./leaveBy";
import {
  computeSuggestedBedtime as computeShared,
  type BedtimePlan as SharedBedtimePlan,
} from "../../shared/bedtime";

export interface BedtimePlan extends SharedBedtimePlan {
  tomorrowLeaveBy: LeaveByPlan | null;
}

export function computeSuggestedBedtime(
  settings: UserSettings,
  tomorrowLeaveBy: LeaveByPlan | null,
  now = new Date(),
): BedtimePlan {
  const base = computeShared(
    settings,
    tomorrowLeaveBy
      ? { leaveBy: tomorrowLeaveBy.leaveBy, destination: tomorrowLeaveBy.destination }
      : null,
    now,
  );
  return { ...base, tomorrowLeaveBy };
}

export function isWindDownTime(plan: BedtimePlan, now = new Date()): boolean {
  return now >= plan.windDownStart;
}

export function isPastLightsOut(plan: BedtimePlan, now = new Date()): boolean {
  return now >= plan.lightsOut;
}
