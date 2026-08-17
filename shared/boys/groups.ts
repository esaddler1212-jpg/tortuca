import type { BoysGroup } from "./types";

/** Three BOYS mentoring groups — one class code each. */
export const BOYS_GROUPS: BoysGroup[] = [
  {
    id: "boys-group-a",
    name: "BOYS Group A",
    classCode: "PURPOSE-A",
    period: "4",
  },
  {
    id: "boys-group-b",
    name: "BOYS Group B",
    classCode: "PURPOSE-B",
    period: "5",
  },
  {
    id: "boys-group-c",
    name: "BOYS Group C",
    classCode: "PURPOSE-C",
    period: "6",
  },
];

export function findGroupByCode(classCode: string): BoysGroup | undefined {
  const normalized = classCode.trim().toUpperCase();
  return BOYS_GROUPS.find((g) => g.classCode === normalized);
}

export function findGroupById(groupId: string): BoysGroup | undefined {
  return BOYS_GROUPS.find((g) => g.id === groupId);
}
