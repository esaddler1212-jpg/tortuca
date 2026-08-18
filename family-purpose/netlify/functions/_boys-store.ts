import { getStore } from "@netlify/blobs";
import type { BoysMonthResponse, BoysStudent } from "../../../shared/boys/types";
import { normalizeName } from "../../../shared/boys/normalize";

const STORE_NAME = "boys-curriculum";

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Boys-Session",
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders() });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

export async function saveStudent(student: BoysStudent): Promise<void> {
  const s = store();
  await s.setJSON(`student:${student.id}`, student);
  await s.set(`token:${student.sessionToken}`, student.id);
  const rosterKey = `roster:${student.groupId}`;
  const existing = ((await s.get(rosterKey, { type: "json" })) as string[] | null) ?? [];
  if (!existing.includes(student.id)) {
    await s.setJSON(rosterKey, [...existing, student.id]);
  }
}

export async function loadStudentByToken(token: string): Promise<BoysStudent | null> {
  const s = store();
  const studentId = await s.get(`token:${token}`);
  if (!studentId) return null;
  return loadStudent(studentId);
}

export async function loadStudent(studentId: string): Promise<BoysStudent | null> {
  const raw = await store().get(`student:${studentId}`, { type: "json" });
  return (raw as BoysStudent | null) ?? null;
}

export async function loadGroupRoster(groupId: string): Promise<BoysStudent[]> {
  const s = store();
  const ids = ((await s.get(`roster:${groupId}`, { type: "json" })) as string[] | null) ?? [];
  const students: BoysStudent[] = [];
  for (const id of ids) {
    const student = await loadStudent(id);
    if (student) students.push(student);
  }
  return students.sort((a, b) => a.name.localeCompare(b.name));
}

export async function findStudentInGroup(
  groupId: string,
  name: string,
): Promise<BoysStudent | null> {
  const key = normalizeName(name);
  const roster = await loadGroupRoster(groupId);
  return roster.find((s) => normalizeName(s.name) === key) ?? null;
}

function responseKey(studentId: string, monthKey: string): string {
  return `response:${studentId}:${monthKey}`;
}

export async function loadMonthResponse(
  studentId: string,
  monthKey: string,
): Promise<BoysMonthResponse | null> {
  const raw = await store().get(responseKey(studentId, monthKey), { type: "json" });
  return (raw as BoysMonthResponse | null) ?? null;
}

/** @deprecated Legacy week-number keys from earlier builds. */
export async function loadLegacyWeekResponse(
  studentId: string,
  weekNumber: number,
): Promise<BoysMonthResponse | null> {
  const raw = await store().get(`response:${studentId}:${weekNumber}`, { type: "json" });
  if (!raw || typeof raw !== "object") return null;
  const r = raw as BoysMonthResponse & { weekNumber?: number };
  if ("monthKey" in r && r.monthKey) return r;
  return null;
}

export async function saveMonthResponse(response: BoysMonthResponse): Promise<void> {
  await store().setJSON(responseKey(response.studentId, response.monthKey), response);
}

export function sessionTokenFromRequest(req: Request): string | null {
  return req.headers.get("x-boys-session")?.trim() || null;
}

export function todayKeyPacific(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
  }).format(new Date());
}

export function isActiveToday(lastActiveAt: string): boolean {
  const day = todayKeyPacific();
  return lastActiveAt.startsWith(day) || dayKeyOfIso(lastActiveAt) === day;
}

function dayKeyOfIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
  }).format(new Date(iso));
}
