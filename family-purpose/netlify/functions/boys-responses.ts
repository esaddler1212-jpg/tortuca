import type { Config } from "@netlify/functions";
import { getCurrentWeekNumber } from "../../../shared/boys/weekSchedule";
import type { BoysWeekResponse } from "../../../shared/boys/types";
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  loadStudentByToken,
  loadWeekResponse,
  saveStudent,
  saveWeekResponse,
  sessionTokenFromRequest,
} from "./_boys-store";

interface ResponseBody {
  weekNumber?: number;
  warmUp?: string;
  exitTicket?: string;
}

export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const token = sessionTokenFromRequest(req);
  if (!token) return errorResponse("Missing session", 401);

  const student = await loadStudentByToken(token);
  if (!student) return errorResponse("Session expired — join again with your class code.", 401);

  let body: ResponseBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const currentWeek = getCurrentWeekNumber();
  if (currentWeek === 0) {
    return errorResponse("Curriculum starts next week. Check back then!", 403);
  }
  if (currentWeek > 12) {
    return errorResponse("This year's curriculum is complete.", 403);
  }

  const weekNumber = body.weekNumber ?? currentWeek;
  if (weekNumber !== currentWeek) {
    return errorResponse("You can only submit responses for this week's lesson.", 403);
  }

  const warmUp = body.warmUp?.trim();
  const exitTicket = body.exitTicket?.trim();
  if (!warmUp && !exitTicket) {
    return errorResponse("Write a response before saving.", 400);
  }

  const now = new Date().toISOString();
  const existing =
    (await loadWeekResponse(student.id, weekNumber)) ??
    ({
      id: crypto.randomUUID(),
      studentId: student.id,
      groupId: student.groupId,
      weekNumber,
    } satisfies BoysWeekResponse);

  const next: BoysWeekResponse = { ...existing };
  if (warmUp) {
    next.warmUp = warmUp;
    next.warmUpAt = now;
  }
  if (exitTicket) {
    next.exitTicket = exitTicket;
    next.exitTicketAt = now;
  }

  await saveWeekResponse(next);
  student.lastActiveAt = now;
  await saveStudent(student);

  return jsonResponse({
    ok: true,
    responses: {
      warmUp: next.warmUp ?? "",
      exitTicket: next.exitTicket ?? "",
      warmUpDone: Boolean(next.warmUp?.trim()),
      exitTicketDone: Boolean(next.exitTicket?.trim()),
    },
  });
};

export const config: Config = {
  path: "/api/boys/responses",
};
