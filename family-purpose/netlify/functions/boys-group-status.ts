import type { Config } from "@netlify/functions";
import { findGroupByCode, findGroupById } from "../../../shared/boys/groups";
import { getCurriculumWeek } from "../../../shared/boys/curriculum";
import { getCurrentWeekNumber, weekStatusLabel } from "../../../shared/boys/weekSchedule";
import type { BoysGroupStatus, BoysGroupStatusStudent } from "../../../shared/boys/types";
import {
  corsHeaders,
  errorResponse,
  isActiveToday,
  jsonResponse,
  loadGroupRoster,
  loadWeekResponse,
} from "./_boys-store";

export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const groupId = url.searchParams.get("groupId")?.trim();
  const classCode = url.searchParams.get("classCode")?.trim();
  const weekParam = url.searchParams.get("week");
  const weekNumber = weekParam ? Number(weekParam) : getCurrentWeekNumber();

  const group =
    (groupId ? findGroupById(groupId) : undefined) ??
    (classCode ? findGroupByCode(classCode) : undefined);

  if (!group) {
    return errorResponse("Provide groupId or classCode.", 400);
  }

  const roster = await loadGroupRoster(group.id);
  const students: BoysGroupStatusStudent[] = [];

  for (const student of roster) {
    const response =
      weekNumber > 0 ? await loadWeekResponse(student.id, weekNumber) : null;
    students.push({
      studentId: student.id,
      name: student.name,
      grade: student.grade,
      activeToday: isActiveToday(student.lastActiveAt),
      warmUpDone: Boolean(response?.warmUp?.trim()),
      exitTicketDone: Boolean(response?.exitTicket?.trim()),
      lastActiveAt: student.lastActiveAt,
    });
  }

  const week = weekNumber > 0 ? getCurriculumWeek(weekNumber) : null;
  const status: BoysGroupStatus = {
    group,
    weekNumber,
    weekLabel: weekStatusLabel(weekNumber),
    theme: week ? `${week.theme}: ${week.subtitle}` : "",
    students,
  };

  return jsonResponse(status);
};

export const config: Config = {
  path: "/api/boys/group-status",
};
