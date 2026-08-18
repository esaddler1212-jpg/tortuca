import type { Config } from "@netlify/functions";
import { findGroupByCode, findGroupById } from "../../../shared/boys/groups";
import { getCurriculumMonth } from "../../../shared/boys/curriculum";
import { getActiveCurriculumMonth, getCurrentMonthKey, getWeekOfMonth, isGroupSessionWeek, monthStatusLabel } from "../../../shared/boys/monthSchedule";
import type { BoysGroupStatus, BoysGroupStatusStudent } from "../../../shared/boys/types";
import {
  corsHeaders,
  errorResponse,
  isActiveToday,
  jsonResponse,
  loadGroupRoster,
  loadMonthResponse,
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
  const monthParam = url.searchParams.get("month")?.trim();

  const group =
    (groupId ? findGroupById(groupId) : undefined) ??
    (classCode ? findGroupByCode(classCode) : undefined);

  if (!group) {
    return errorResponse("Provide groupId or classCode.", 400);
  }

  const nowDate = new Date();
  const month = monthParam
    ? getCurriculumMonth(monthParam)
    : getActiveCurriculumMonth(nowDate);
  const monthKey = month?.monthKey ?? monthParam ?? getCurrentMonthKey(nowDate);

  const roster = await loadGroupRoster(group.id);
  const students: BoysGroupStatusStudent[] = [];

  for (const student of roster) {
    const response = month
      ? await loadMonthResponse(student.id, month.monthKey)
      : monthKey
        ? await loadMonthResponse(student.id, monthKey)
        : null;
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

  const status: BoysGroupStatus = {
    group,
    monthKey,
    monthLabel: month?.monthLabel ?? monthStatusLabel(nowDate),
    theme: month ? `${month.theme}: ${month.subtitle}` : "",
    sessionWeekOfMonth: group.sessionWeekOfMonth,
    weekOfMonth: getWeekOfMonth(nowDate),
    isSessionWeek: isGroupSessionWeek(group, nowDate),
    students,
  };

  return jsonResponse(status);
};

export const config: Config = {
  path: "/api/boys/group-status",
};
