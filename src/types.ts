export const CHECK_IN_REASONS = [
  "Academic support / tutoring",
  "Attendance / tardiness",
  "Behavior / classroom concerns",
  "Social-emotional / wellness",
  "Career or college planning",
  "Family / home situation",
  "Mediation / conflict",
  "Celebration / positive recognition",
  "Goal check-in / mentoring",
  "Referral follow-up",
  "Other",
] as const;

export type CheckInReason = (typeof CHECK_IN_REASONS)[number];

export interface CheckIn {
  id: string;
  studentName: string;
  grade: string;
  classPeriod: string;
  reasons: CheckInReason[];
  reasonNotes: string;
  createdAt: string;
}

export interface DebriefSettings {
  staffEmail: string;
  companyEmail: string;
  yourName: string;
  yourRole: string;
  schoolName: string;
}

export const DEFAULT_DEBRIEF_SETTINGS: DebriefSettings = {
  staffEmail: "",
  companyEmail: "",
  yourName: "",
  yourRole: "",
  schoolName: "",
};

export const GRADES = [
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
] as const;
