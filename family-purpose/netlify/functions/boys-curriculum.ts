import type { Config } from "@netlify/functions";
import { findGroupById } from "../../../shared/boys/groups";
import { getCurriculumWeek } from "../../../shared/boys/curriculum";
import { getCurrentWeekNumber, weekStatusLabel } from "../../../shared/boys/weekSchedule";
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  loadStudentByToken,
  loadWeekResponse,
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

  const url = new URL(req.url);
  const requestedWeek = Number(url.searchParams.get("week"));
  const weekNumber =
    Number.isFinite(requestedWeek) && requestedWeek > 0
      ? requestedWeek
      : getCurrentWeekNumber();

  const week = weekNumber > 0 ? getCurriculumWeek(weekNumber) : null;
  const responses =
    weekNumber > 0 ? await loadWeekResponse(student.id, weekNumber) : null;

  const group = findGroupById(student.groupId);

  return jsonResponse({
    weekNumber,
    weekLabel: weekStatusLabel(weekNumber),
    week,
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
        }
      : null,
  });
};

export const config: Config = {
  path: "/api/boys/curriculum",
};
