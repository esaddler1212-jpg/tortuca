import type { Config } from "@netlify/functions";
import { findGroupByCode } from "../../../shared/boys/groups";
import { getActiveCurriculumMonth } from "../../../shared/boys/monthSchedule";
import type { BoysGrade } from "../../../shared/boys/types";
import { displayName } from "../../../shared/boys/normalize";
import {
  isGroupSessionWeek,
  isBeforeCurriculum,
  monthStatusLabel,
  sessionWeekHint,
} from "../../../shared/boys/monthSchedule";
import {
  corsHeaders,
  errorResponse,
  findStudentInGroup,
  jsonResponse,
  saveStudent,
} from "./_boys-store";

const GRADES = new Set(["6", "7", "8"]);

interface JoinBody {
  classCode?: string;
  name?: string;
  grade?: string;
}

export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: JoinBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const classCode = body.classCode?.trim();
  const name = displayName(body.name ?? "");
  const grade = body.grade?.trim();

  if (!classCode) return errorResponse("Enter your class code.", 400);
  if (!name) return errorResponse("Enter your name.", 400);
  if (!grade || !GRADES.has(grade)) {
    return errorResponse("Select your grade (6, 7, or 8).", 400);
  }

  const group = findGroupByCode(classCode);
  if (!group) return errorResponse("That class code is not recognized.", 404);

  const now = new Date().toISOString();
  const existing = await findStudentInGroup(group.id, name);
  const sessionToken = crypto.randomUUID();

  const student = existing
    ? {
        ...existing,
        grade: grade as BoysGrade,
        lastActiveAt: now,
        sessionToken,
      }
    : {
        id: crypto.randomUUID(),
        groupId: group.id,
        name,
        grade: grade as BoysGrade,
        joinedAt: now,
        lastActiveAt: now,
        sessionToken,
      };

  await saveStudent(student);

  const month = getActiveCurriculumMonth();
  const nowDate = new Date();

  return jsonResponse({
    sessionToken: student.sessionToken,
    student: {
      id: student.id,
      name: student.name,
      grade: student.grade,
      groupId: student.groupId,
    },
    group: {
      id: group.id,
      name: group.name,
      classCode: group.classCode,
      period: group.period,
      sessionWeekOfMonth: group.sessionWeekOfMonth,
    },
    monthKey: month?.monthKey ?? null,
    monthLabel: monthStatusLabel(nowDate),
    month,
    isSessionWeek: isGroupSessionWeek(group, nowDate),
    sessionHint: sessionWeekHint(group, nowDate),
    beforeCurriculum: isBeforeCurriculum(nowDate),
  });
};

export const config: Config = {
  path: "/api/boys/join",
};
