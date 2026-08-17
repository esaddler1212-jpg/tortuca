import type { BoysGroupStatus } from "../../shared/boys/types";

export async function fetchBoysGroupStatus(
  classCode: string,
): Promise<BoysGroupStatus | null> {
  if (!classCode.trim()) return null;
  const params = new URLSearchParams({ classCode: classCode.trim().toUpperCase() });
  const res = await fetch(`/api/boys/group-status?${params}`);
  if (!res.ok) return null;
  return res.json() as Promise<BoysGroupStatus>;
}
