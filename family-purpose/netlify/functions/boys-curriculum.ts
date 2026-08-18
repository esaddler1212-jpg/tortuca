import type { Config } from "@netlify/functions";
import { findGroupById } from "../../../shared/boys/groups";
import { getCurriculumMonth } from "../../../shared/boys/curriculum";
import {
  getActiveCurriculumMonth,
  getCurrentMonthKey,
  isBeforeCurriculum,
  canSubmitResponses,
  isGroupSessionWeek,
  monthStatusLabel,
  sessionWeekHint,
} from "../../../shared/boys/monthSchedule";
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  loadMonthResponse,
  loadStudentByToken,
  saveStudent,
  sessionTokenFromRequest,
} from "./_boys-store";

export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const token = sessionTokenFromRequest(req);
  if (!token) return errorResponse("Missing session", 401);

  const student = await loadStudentByToken(token);
  if (!student) return errorResponse("Session expired — join again with your class code.", 401);

  const now = new Date().toISOString();
  student.lastActiveAt = now;
  await saveStudent(student);

  const nowDate = new Date();
  const url = new URL(req.url);
  const requestedMonth = url.searchParams.get("month")?.trim();
  const monthKey = requestedMonth || getCurrentMonthKey(nowDate);
  const month = requestedMonth
    ? getCurriculumMonth(requestedMonth)
    : getActiveCurriculumMonth(nowDate);

  const group = findGroupById(student.groupId);
  const responses = month ? await loadMonthResponse(student.id, month.monthKey) : null;

  return jsonResponse({
    monthKey: month?.monthKey ?? monthKey,
    monthLabel: month?.monthLabel ?? monthStatusLabel(nowDate),
    month,
    beforeCurriculum: isBeforeCurriculum(nowDate),
    isSessionWeek: group ? isGroupSessionWeek(group, nowDate) : false,
    canSubmit: group ? canSubmitResponses(group, nowDate) : false,
    sessionHint: group ? sessionWeekHint(group, nowDate) : "",
    responses: responses
      ? {
          warmUp: responses.warmUp ?? "",
          exitTicket: responses.exitTicket ?? "",
          warmUpDone: Boolean(responses.warmUp?.trim()),
          exitTicketDone: Boolean(responses.exitTicket?.trim()),
        }
      : null,
    student: {
      id: student.id,
      name: student.name,
      grade: student.grade,
      groupId: student.groupId,
    },
    group: group
      ? {
          id: group.id,
          name: group.name,
          classCode: group.classCode,
          period: group.period,
          sessionWeekOfMonth: group.sessionWeekOfMonth,
        }
      : null,
  });
};

export const config: Config = {
  path: "/api/boys/curriculum",
};
