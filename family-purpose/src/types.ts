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

/** A student on the group's standing roster. */
export interface GroupMember {
  name: string;
  grade: string;
}

/** One meeting of the group, with the members who signed in that day. */
export interface GroupSession {
  id: string;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  topic: string;
  notes: string;
  attendees: string[];
  updatedAt: string;
}

export interface DebriefSettings {
  staffEmail: string;
  companyEmail: string;
  yourName: string;
  yourRole: string;
  schoolName: string;
  groupName: string;
}

export const DEFAULT_DEBRIEF_SETTINGS: DebriefSettings = {
  staffEmail: "",
  companyEmail: "",
  yourName: "",
  yourRole: "",
  schoolName: "",
  groupName: "BOYS Group",
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
