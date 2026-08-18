import type { Config } from "@netlify/functions";
import {
  getActiveCurriculumMonth,
  getCurrentMonthKey,
  isBeforeCurriculum,
  canSubmitResponses,
} from "../../../shared/boys/monthSchedule";
import type { BoysMonthResponse } from "../../../shared/boys/types";
import { findGroupById } from "../../../shared/boys/groups";
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  loadMonthResponse,
  loadStudentByToken,
  saveMonthResponse,
  saveStudent,
  sessionTokenFromRequest,
} from "./_boys-store";

interface ResponseBody {
  monthKey?: string;
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

  const nowDate = new Date();
  if (isBeforeCurriculum(nowDate)) {
    return errorResponse("Curriculum starts in September. Check back then!", 403);
  }

  const activeMonth = getActiveCurriculumMonth(nowDate);
  if (!activeMonth) {
    return errorResponse("This year's curriculum is complete.", 403);
  }

  const monthKey = body.monthKey ?? getCurrentMonthKey(nowDate);
  if (monthKey !== activeMonth.monthKey) {
    return errorResponse("You can only submit responses for this month's lesson.", 403);
  }

  const group = findGroupById(student.groupId);
  if (group && !canSubmitResponses(group, nowDate)) {
    return errorResponse(
      `Your group meets during week ${group.sessionWeekOfMonth} of each month. Come back then to submit.`,
      403,
    );
  }

  const warmUp = body.warmUp?.trim();
  const exitTicket = body.exitTicket?.trim();
  if (!warmUp && !exitTicket) {
    return errorResponse("Write a response before saving.", 400);
  }

  const now = new Date().toISOString();
  const existing =
    (await loadMonthResponse(student.id, monthKey)) ??
    ({
      id: crypto.randomUUID(),
      studentId: student.id,
      groupId: student.groupId,
      monthKey,
    } satisfies BoysMonthResponse);

  const next: BoysMonthResponse = { ...existing };
  if (warmUp) {
    next.warmUp = warmUp;
    next.warmUpAt = now;
  }
  if (exitTicket) {
    next.exitTicket = exitTicket;
    next.exitTicketAt = now;
  }

  await saveMonthResponse(next);
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
