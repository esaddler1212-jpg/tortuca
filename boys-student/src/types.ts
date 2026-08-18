export type BoysGrade = "6" | "7" | "8";

export interface BoysGroup {
  id: string;
  name: string;
  classCode: string;
  period: string;
  sessionWeekOfMonth: 1 | 2 | 3;
}

export interface BoysStudent {
  id: string;
  name: string;
  grade: BoysGrade;
  groupId: string;
}

export interface BoysCurriculumMonth {
  monthKey: string;
  monthLabel: string;
  theme: string;
  subtitle: string;
  warmUpPrompt: string;
  sessionType: "impact" | "socratic";
  activityTitle: string;
  activityDescription: string;
  exitTicketPrompt: string;
  gradePrompts?: Partial<Record<BoysGrade, string>>;
}

export interface BoysResponses {
  warmUp: string;
  exitTicket: string;
  warmUpDone: boolean;
  exitTicketDone: boolean;
}

export interface JoinResult {
  sessionToken: string;
  student: BoysStudent;
  group: BoysGroup;
  monthKey: string | null;
  monthLabel: string;
  month: BoysCurriculumMonth | null;
  beforeCurriculum: boolean;
  isSessionWeek: boolean;
  sessionHint: string;
}

export interface CurriculumResult {
  monthKey: string;
  monthLabel: string;
  month: BoysCurriculumMonth | null;
  beforeCurriculum: boolean;
  isSessionWeek: boolean;
  canSubmit: boolean;
  sessionHint: string;
  responses: BoysResponses | null;
  student: BoysStudent;
  group: BoysGroup | null;
}
