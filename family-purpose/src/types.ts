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

/**
 * Reasons grouped for trend reporting: whether time is going into putting out
 * fires, steady support, or forward-looking work with a student.
 */
export const REASON_CATEGORIES = {
  Intervention: [
    "Attendance / tardiness",
    "Behavior / classroom concerns",
    "Mediation / conflict",
    "Family / home situation",
    "Referral follow-up",
  ],
  Support: ["Academic support / tutoring", "Social-emotional / wellness"],
  Growth: [
    "Goal check-in / mentoring",
    "Career or college planning",
    "Celebration / positive recognition",
  ],
  Other: ["Other"],
} as const satisfies Record<string, readonly CheckInReason[]>;

export type ReasonCategory = keyof typeof REASON_CATEGORIES;

export const REASON_CATEGORY_ORDER: ReasonCategory[] = [
  "Intervention",
  "Support",
  "Growth",
  "Other",
];

export function categoryOf(reason: CheckInReason): ReasonCategory {
  for (const category of REASON_CATEGORY_ORDER) {
    if ((REASON_CATEGORIES[category] as readonly string[]).includes(reason)) {
      return category;
    }
  }
  return "Other";
}

/** What came out of the conversation, for outcome reporting. */
export const CHECK_IN_OUTCOMES = [
  "Issue resolved",
  "Plan or goal set",
  "Referred to staff or service",
  "Follow-up scheduled",
  "Ongoing support",
  "No action needed",
] as const;

export type CheckInOutcome = (typeof CHECK_IN_OUTCOMES)[number];

export interface CheckIn {
  id: string;
  studentName: string;
  grade: string;
  classPeriod: string;
  reasons: CheckInReason[];
  reasonNotes: string;
  /** Absent on check-ins logged before outcomes were tracked. */
  outcome?: CheckInOutcome;
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
