import type { BoysCurriculumWeek } from "./types";

export const BOYS_CURRICULUM: BoysCurriculumWeek[] = [
  {
    weekNumber: 1,
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
    weekNumber: 2,
    theme: "Respect",
    subtitle: "Earned, Given, or Demanded?",
    warmUpPrompt: "What makes you respect someone?",
    sessionType: "socratic",
    activityTitle: "Socratic Seminar",
    activityDescription:
      "Is respect earned or automatic? Can you respect someone you disagree with? What does respect look like when nobody is watching?",
    exitTicketPrompt: "What is one way you can show more respect this week?",
    gradePrompts: {
      "6": "What does respect look like in your classroom?",
      "7": "Can you respect someone you disagree with? How?",
      "8": "Is respect earned, given, or demanded? Defend your answer.",
    },
  },
  {
    weekNumber: 3,
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
    weekNumber: 4,
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
    weekNumber: 5,
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
    weekNumber: 6,
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
    weekNumber: 7,
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
    weekNumber: 8,
    theme: "Resilience",
    subtitle: "Keep Going",
    warmUpPrompt: "What was hard at first but got easier?",
    sessionType: "impact",
    activityTitle: "Never Quit Challenge",
    activityDescription: "Teams practice persistence after setbacks.",
    exitTicketPrompt: "What do you do when something doesn't go your way?",
  },
  {
    weekNumber: 9,
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
      "7": "How can one decision change your week?",
      "8": "What should you consider before a big decision?",
    },
  },
  {
    weekNumber: 10,
    theme: "Goals",
    subtitle: "Where Are You Going?",
    warmUpPrompt:
      "If you could accomplish one thing this school year, what would it be?",
    sessionType: "impact",
    activityTitle: "Goal Builder",
    activityDescription:
      "Goal, why, first step, obstacles, support, deadline.",
    exitTicketPrompt: "What is the first step toward your goal?",
  },
  {
    weekNumber: 11,
    theme: "Brotherhood",
    subtitle: "We All Win",
    warmUpPrompt: "What does being a good friend or teammate look like?",
    sessionType: "impact",
    activityTitle: "Team Challenge",
    activityDescription:
      "Everyone must contribute for the team to succeed.",
    exitTicketPrompt: "What can you do to make the people around you better?",
  },
  {
    weekNumber: 12,
    theme: "Purpose",
    subtitle: "I Move With Purpose",
    warmUpPrompt: "What does it mean to move with purpose?",
    sessionType: "socratic",
    activityTitle: "Socratic Seminar",
    activityDescription:
      "What do you want your life to stand for? What influences your choices? What does moving with purpose look like at school, home, and with friends?",
    exitTicketPrompt:
      '"I move with purpose when I…" and "One thing I will do differently is…"',
    gradePrompts: {
      "6": "What does moving with purpose mean to you?",
      "7": "What influences the choices you make?",
      "8": "What do you want your life to stand for?",
    },
  },
];

export function getCurriculumWeek(weekNumber: number): BoysCurriculumWeek | undefined {
  return BOYS_CURRICULUM.find((w) => w.weekNumber === weekNumber);
}
