import type { CurriculumResult, JoinResult } from "./types";

function apiBase(): string {
  return import.meta.env.VITE_BOYS_API_URL?.replace(/\/$/, "") ?? "";
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["X-Boys-Session"] = token;
  return h;
}

async function parseError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string };
    return json.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function joinSession(
  classCode: string,
  name: string,
  grade: string,
): Promise<JoinResult> {
  const res = await fetch(`${apiBase()}/api/boys/join`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ classCode, name, grade }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<JoinResult>;
}

export async function fetchCurriculum(token: string): Promise<CurriculumResult> {
  const res = await fetch(`${apiBase()}/api/boys/curriculum`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<CurriculumResult>;
}

export async function submitResponses(
  token: string,
  payload: { warmUp?: string; exitTicket?: string; weekNumber?: number },
): Promise<{ responses: CurriculumResult["responses"] }> {
  const res = await fetch(`${apiBase()}/api/boys/responses`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ responses: CurriculumResult["responses"] }>;
}
