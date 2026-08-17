export type BoysGrade = "6" | "7" | "8";

export interface BoysGroup {
  id: string;
  name: string;
  classCode: string;
  /** Class period students are excused from during BOYS session. */
  period: string;
}

export interface BoysStudent {
  id: string;
  groupId: string;
  name: string;
  grade: BoysGrade;
  joinedAt: string;
  lastActiveAt: string;
  sessionToken: string;
}

export interface BoysWeekResponse {
  id: string;
  studentId: string;
  groupId: string;
  weekNumber: number;
  warmUp?: string;
  warmUpAt?: string;
  exitTicket?: string;
  exitTicketAt?: string;
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

export interface BoysGroupStatusStudent {
  studentId: string;
  name: string;
  grade: BoysGrade;
  activeToday: boolean;
  warmUpDone: boolean;
  exitTicketDone: boolean;
  lastActiveAt: string;
}

export interface BoysGroupStatus {
  group: BoysGroup;
  weekNumber: number;
  weekLabel: string;
  theme: string;
  students: BoysGroupStatusStudent[];
}
