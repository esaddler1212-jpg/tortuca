import type { BoysGroup } from "./types";

/**
 * Three BOYS mentoring groups — one class code each.
 * Each group meets one week per month (weeks 1, 2, and 3).
 */
export const BOYS_GROUPS: BoysGroup[] = [
  {
    id: "boys-group-a",
    name: "BOYS Group A",
    classCode: "PURPOSE-A",
    period: "7",
    sessionWeekOfMonth: 1,
  },
  {
    id: "boys-group-b",
    name: "BOYS Group B",
    classCode: "PURPOSE-B",
    period: "7",
    sessionWeekOfMonth: 2,
  },
  {
    id: "boys-group-c",
    name: "BOYS Group C",
    classCode: "PURPOSE-C",
    period: "7",
    sessionWeekOfMonth: 3,
  },
];

export function findGroupByCode(classCode: string): BoysGroup | undefined {
  const normalized = classCode.trim().toUpperCase();
  return BOYS_GROUPS.find((g) => g.classCode === normalized);
}

export function findGroupById(groupId: string): BoysGroup | undefined {
  return BOYS_GROUPS.find((g) => g.id === groupId);
}
