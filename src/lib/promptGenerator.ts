/**
 * Prompt generator: turns any task or upcoming event into a ready-to-paste
 * Claude prompt with E's context, so the work starts from the right place.
 * Pure text, built on the device; nothing is sent anywhere.
 */
import type { AiTag, Area, PlanTask, YearGoal } from "../../shared/planData";
import type { CalendarEvent } from "../types";

const ABOUT_E =
  "I'm E (Eric Saddler II), a founder in Vallejo, CA. I run ECS Network: Tortuga Productions (film/media), " +
  "Easy Supply Co. (merch), North Star Network (nonprofit afterschool program) and 2EASY (my music). " +
  "I'm also an SEL counselor at Family Purpose. Near-term target: $100K/month across ECS.";

const AREA_CONTEXT: Record<Area, string> = {
  Tortuga:
    "Tortuga Productions' 2027 flagship is $BAY: a one-season doc series where 7 Bay Area locals each get $100 to show off " +
    "their city (Vallejo, Richmond, Berkeley, Oakland, SF, Hayward, San Jose). All POV (cap camera + camera glasses, car rig), " +
    "8 episodes of 8–12 min, free weekly on YouTube Jun 12–Jul 31, 2027, a July 3 Oakland pop-up, then a Director's Cut for " +
    "festivals and Tubi via Filmhub. Shoots are Saturdays Mar 6–May 1. Sponsors fund the show but never steer the spend, and every " +
    "sponsored credit is disclosed. The first short film, Recluse Without a Cause, shoots in August.",
  "North Star":
    "North Star Network is an afterschool program (4 days/week, 3–5 PM, Title I priority) where students pick a real school or " +
    "community problem, build a solution with AI tools, pitch it (principal → families → school board), and film the journey for a " +
    "student film festival. Pilot: 2027–28 in Mt. Diablo Unified (Oak Grove or Valley View), 18 students, ~$35K total cost, " +
    "~$28.6K to raise. Funded alongside schools' California ASES money. Path: fiscal sponsor first, 501(c)(3) as backup.",
  "Easy Supply":
    "Easy Supply Co. is ECS's merch and product company: $80 sweat suits as the flagship, Easy2See Part 1 capsule, and $BAY " +
    "city editions ($BAY: VALLEJO, $BAY: OAKLAND...) released the same Saturday as each episode, plus Sample Sale drops.",
  "2EASY":
    "2EASY is my artist identity: the Tomorrow Starts Today trilogy, Trilogy Deluxe + documentary in Q1 2027, and Sample Sales " +
    "(listening party + merch drop + community event) in Q2 and Q3.",
  ECS: "ECS Network is the parent company; Vantage is its operating company over the four divisions.",
  Personal: "This is a personal goal (habits, health, growth).",
};

const AI_ASK: Record<AiTag, string> = {
  claude: "Do this for me and give me the finished draft I can use as-is (or with light edits).",
  assist: "Get me ready to do this myself: give me what to prepare, what to say or check, and the decisions I need to make.",
  you: "Help me plan it so it's quick: a short checklist, what to bring or buy, and anything I might forget.",
};

const GUARDRAILS = [
  "Before you start, ask me up to 3 questions only if something essential is missing; otherwise make sensible assumptions and list them at the end.",
  "Plain language, short sections, no filler.",
  "If anything has legal, tax or insurance implications, flag exactly what a professional should confirm.",
  "Don't invent facts about my organizations; mark anything you're unsure of as [check].",
];

export function promptForTask(task: PlanTask, goal?: YearGoal): string {
  const month = new Date(`${task.month}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return [
    ABOUT_E,
    "",
    `Context — ${task.area}: ${AREA_CONTEXT[task.area]}`,
    "",
    `Task: ${task.title}`,
    goal ? `This serves my goal: "${goal.title}". Target: ${month}.` : `Target: ${month}.`,
    task.deliverable ? `What I want from you: ${task.deliverable}.` : "",
    AI_ASK[task.ai],
    "",
    ...GUARDRAILS.map((g) => `- ${g}`),
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();
}

/** Guess the area from an item's title or source label. */
export function guessArea(text: string): Area {
  const t = text.toLowerCase();
  if (/\$bay|tortuga|episode|film|shoot|recluse|festival/.test(t)) return "Tortuga";
  if (/north star|grant|ases|board|fiscal sponsor|pilot site/.test(t)) return "North Star";
  if (/easy supply|merch|shopify|order|sweat ?suit|drop/.test(t)) return "Easy Supply";
  if (/2easy|easy2see|sample sale|album|trilogy|listening party/.test(t)) return "2EASY";
  if (/family purpose|student|follow-up|check-in|boys group/.test(t)) return "Personal";
  return "ECS";
}

/** Prompt for any to-do or app item on the Do today list. */
export function promptForTodo(title: string, sourceLabel: string): string {
  const area = guessArea(`${title} ${sourceLabel}`);
  const isFamilyPurpose = /family purpose|student|follow-up|check-in/i.test(`${title} ${sourceLabel}`);
  return [
    ABOUT_E,
    "",
    isFamilyPurpose
      ? "Context — Family Purpose (my SEL counselor work with middle schoolers). Never include students' names or identifying details; refer to \"a student\"."
      : `Context — ${area}: ${AREA_CONTEXT[area]}`,
    "",
    `Task on my list today: ${title}`,
    "Help me get it done fast: the next concrete steps, and draft anything that needs writing (message, email, plan).",
    "",
    ...GUARDRAILS.map((g) => `- ${g}`),
  ].join("\n");
}

/** Prompt to prepare for an upcoming calendar event. */
export function promptForEvent(event: CalendarEvent, timeZone: string): string {
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(event.start));
  const area = guessArea(`${event.title} ${event.location ?? ""}`);
  return [
    ABOUT_E,
    "",
    `Context — ${area}: ${AREA_CONTEXT[area]}`,
    "",
    `Upcoming: "${event.title}" on ${when}${event.location ? ` (${event.location})` : ""}.`,
    "Help me walk in prepared: the goal of this meeting/event for me, a short agenda or talking points, questions to ask, what to bring, and a follow-up message I can send afterward.",
    "",
    ...GUARDRAILS.map((g) => `- ${g}`),
  ].join("\n");
}

/** Link that opens Claude with the prompt filled in (falls back to copy/paste). */
export function claudeLink(prompt: string): string {
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
}

export const AI_TAG_LABEL: Record<AiTag, { short: string; long: string }> = {
  claude: { short: "🤖 Claude can do this", long: "Claude can draft this for you" },
  assist: { short: "🤝 Claude helps", long: "Claude preps you; you do the real-world part" },
  you: { short: "🙋 You", long: "Hands-on; Claude can make you a checklist" },
};

/** Prompt to riff on today's creative spark with Claude. */
export function promptForSpark(spark: { theme: string; mindset: string; prompt: string }, themeLabel: string): string {
  return [
    ABOUT_E,
    "",
    `Today's creative spark (${themeLabel}).`,
    `Mindset: ${spark.mindset}`,
    `Prompt: ${spark.prompt}`,
    "",
    "Be my creative partner for 10 minutes. Give me three quick takes on this prompt in different directions (one safe, one weird, one personal), then ask me one question that pushes my favorite further. Keep it short and playful; I'll do the making.",
  ].join("\n");
}
