export type BoysGrade = "6" | "7" | "8";

export interface BoysGroup {
  id: string;
  name: string;
  classCode: string;
  /** Class period students are excused from during BOYS session. */
  period: string;
  /** Which week of the month this group meets (1, 2, or 3). */
  sessionWeekOfMonth: 1 | 2 | 3;
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

export interface BoysMonthResponse {
  id: string;
  studentId: string;
  groupId: string;
  /** YYYY-MM */
  monthKey: string;
  warmUp?: string;
  warmUpAt?: string;
  exitTicket?: string;
  exitTicketAt?: string;
}

export interface BoysCurriculumMonth {
  /** YYYY-MM */
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
  monthKey: string;
  monthLabel: string;
  theme: string;
  sessionWeekOfMonth: number;
  weekOfMonth: number;
  isSessionWeek: boolean;
  students: BoysGroupStatusStudent[];
}
