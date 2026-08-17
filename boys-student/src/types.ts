export type BoysGrade = "6" | "7" | "8";

export interface BoysGroup {
  id: string;
  name: string;
  classCode: string;
  period: string;
}

export interface BoysStudent {
  id: string;
  name: string;
  grade: BoysGrade;
  groupId: string;
}

export interface BoysCurriculumWeek {
  weekNumber: number;
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
  weekNumber: number;
  week: BoysCurriculumWeek | null;
}

export interface CurriculumResult {
  weekNumber: number;
  weekLabel: string;
  week: BoysCurriculumWeek | null;
  responses: BoysResponses | null;
  student: BoysStudent;
  group: BoysGroup | null;
}
