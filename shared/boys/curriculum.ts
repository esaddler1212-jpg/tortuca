import type { BoysCurriculumMonth } from "./types";

/** One theme per school month; each group meets one week (groups A/B/C = weeks 1/2/3). */
export const BOYS_CURRICULUM: BoysCurriculumMonth[] = [
  {
    monthKey: "2026-09",
    monthLabel: "September 2026",
    theme: "Identity",
    subtitle: "Who Am I?",
    warmUpPrompt: "What are three things that make you who you are?",
    sessionType: "impact",
    activityTitle: "Identity Map",
    activityDescription:
      "Map your interests, strengths, values, influences, and goals.",
    exitTicketPrompt:
      "What did you learn about yourself? What is one strength you bring to others?",
  },
  {
    monthKey: "2026-10",
    monthLabel: "October 2026",
    theme: "Respect",
    subtitle: "Earned, Given, or Demanded?",
    warmUpPrompt: "What makes you respect someone?",
    sessionType: "socratic",
    activityTitle: "Socratic Seminar",
    activityDescription:
      "Is respect earned or automatic? Can you respect someone you disagree with? What does respect look like when nobody is watching?",
    exitTicketPrompt: "What is one way you can show more respect this month?",
    gradePrompts: {
      "6": "What does respect look like in your classroom?",
      "7": "Can you respect someone you disagree with? How?",
      "8": "Is respect earned, given, or demanded? Defend your answer.",
    },
  },
  {
    monthKey: "2026-11",
    monthLabel: "November 2026",
    theme: "Confidence",
    subtitle: "Knowing Your Worth",
    warmUpPrompt:
      "What is something you're good at that you don't always get credit for?",
    sessionType: "impact",
    activityTitle: "Confidence Challenge",
    activityDescription:
      "Identify one strength, one growth area, and one challenge.",
    exitTicketPrompt:
      "What is one thing you are more confident about after today?",
  },
  {
    monthKey: "2026-12",
    monthLabel: "December 2026",
    theme: "Peer Pressure",
    subtitle: "Stand on Business",
    warmUpPrompt: "Why is it hard to say no when friends are doing something?",
    sessionType: "socratic",
    activityTitle: "Socratic Seminar",
    activityDescription:
      "Why do people follow the crowd? Can you be yourself and still belong? What does having your own mind look like?",
    exitTicketPrompt:
      "Where do you need to be more comfortable making your own decision?",
    gradePrompts: {
      "6": "When is it hardest to say no to friends?",
      "7": "Can you belong and still be yourself? How?",
      "8": "What does standing on business mean in your life?",
    },
  },
  {
    monthKey: "2027-01",
    monthLabel: "January 2027",
    theme: "Leadership",
    subtitle: "Everybody Doesn't Have to Be the Loudest",
    warmUpPrompt: "What makes someone a good leader?",
    sessionType: "impact",
    activityTitle: "Leadership Challenge",
    activityDescription:
      "Teams solve a problem and reflect on different leadership styles.",
    exitTicketPrompt: "What kind of leader are you?",
  },
  {
    monthKey: "2027-02",
    monthLabel: "February 2027",
    theme: "Communication",
    subtitle: "Say What You Mean",
    warmUpPrompt: "What makes someone a good listener?",
    sessionType: "impact",
    activityTitle: "Communication Challenge",
    activityDescription:
      "Complete a task using specific communication rules.",
    exitTicketPrompt:
      "What is one thing you can do to become a better communicator?",
  },
  {
    monthKey: "2027-03",
    monthLabel: "March 2027",
    theme: "Accountability",
    subtitle: "Own Your Actions",
    warmUpPrompt: "What does it mean to take responsibility?",
    sessionType: "socratic",
    activityTitle: "Socratic Seminar",
    activityDescription:
      "Why is it easier to blame someone else? Does a mistake make you a failure? What does accountability look like after you mess up?",
    exitTicketPrompt:
      "What is the difference between an excuse and taking responsibility?",
    gradePrompts: {
      "6": "What does it mean to own your mistakes?",
      "7": "Why do people make excuses?",
      "8": "How does accountability affect how other people trust you?",
    },
  },
  {
    monthKey: "2027-04",
    monthLabel: "April 2027",
    theme: "Resilience",
    subtitle: "Keep Going",
    warmUpPrompt: "What was hard at first but got easier?",
    sessionType: "impact",
    activityTitle: "Never Quit Challenge",
    activityDescription: "Teams practice persistence after setbacks.",
    exitTicketPrompt: "What do you do when something doesn't go your way?",
  },
  {
    monthKey: "2027-05",
    monthLabel: "May 2027",
    theme: "Decision Making",
    subtitle: "Think Before You Move",
    warmUpPrompt: "What decision had a bigger impact than you expected?",
    sessionType: "socratic",
    activityTitle: "Socratic Seminar",
    activityDescription:
      "Why do people make bad decisions when they know better? How can one decision change your future? What should you consider before a big decision?",
    exitTicketPrompt:
      "What question should you ask yourself before making a big decision?",
    gradePrompts: {
      "6": "What helps you think before you act?",
      "7": "How can one decision change your month?",
      "8": "What should you consider before a big decision?",
    },
  },
  {
    monthKey: "2027-06",
    monthLabel: "June 2027",
    theme: "Purpose",
    subtitle: "I Move With Purpose",
    warmUpPrompt: "What does it mean to move with purpose?",
    sessionType: "socratic",
    activityTitle: "Socratic Seminar",
    activityDescription:
      "What do you want your life to stand for? How do brotherhood and teamwork help you move with purpose at school, home, and with friends?",
    exitTicketPrompt:
      '"I move with purpose when I…" and "One thing I will do differently is…"',
    gradePrompts: {
      "6": "What does moving with purpose mean to you?",
      "7": "What can you do to make the people around you better?",
      "8": "What do you want your life to stand for?",
    },
  },
];

export function getCurriculumMonth(
  monthKey: string,
): BoysCurriculumMonth | undefined {
  return BOYS_CURRICULUM.find((m) => m.monthKey === monthKey);
}

export const LAST_CURRICULUM_MONTH =
  BOYS_CURRICULUM[BOYS_CURRICULUM.length - 1]?.monthKey ?? "2027-06";
