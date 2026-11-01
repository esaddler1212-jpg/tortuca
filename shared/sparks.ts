/**
 * Daily spark: one mindset focus + one creative prompt, tuned to E's world
 * (2EASY music, Tortuga film, Easy Supply design, North Star community).
 * The same day always gives the same spark; "Another one" moves to the next.
 */
import { weekdayOfDay } from "./timezone";

export type SparkTheme = "music" | "story" | "design" | "community" | "reflect";

export const THEME_LABEL: Record<SparkTheme, string> = {
  music: "Music · 2EASY",
  story: "Story · Tortuga",
  design: "Design · Easy Supply",
  community: "Community · North Star",
  reflect: "Reflect · Vantage",
};

/** Weekday themes: music Mon/Fri, story Tue/Sat, design Wed, community Thu, reflect Sun. */
const DAY_THEME: Record<string, SparkTheme> = {
  Mon: "music",
  Tue: "story",
  Wed: "design",
  Thu: "community",
  Fri: "music",
  Sat: "story",
  Sun: "reflect",
};

export const MINDSETS: string[] = [
  "Win or learn. Name one thing today that's a lesson, not a loss.",
  "Tomorrow starts today: do the first 10 minutes of something you've been putting off.",
  "Make it before you make it good. Rough drafts are allowed.",
  "Small and finished beats big and imagined.",
  "Create before you consume: make something before you scroll.",
  "Curiosity over certainty. Ask one more question than usual.",
  "Your city is your studio. Notice one detail you've walked past a hundred times.",
  "Constraints are fuel. Give yourself a limit and see what it forces.",
  "Steal like an artist: borrow a structure, not a style.",
  "Show the work. Share one unfinished thing with someone you trust.",
  "Rest is part of the rhythm. Protect one quiet block today.",
  "Say it plainly. If a 12-year-old wouldn't get it, rewrite it.",
  "Build the platform for other people's stories, not just yours.",
  "Momentum over perfection: what's the smallest next move?",
  "Listen like a producer: what's missing from the room?",
  "Lead by making. Students copy what you do, not what you say.",
  "Taste is trained. Study one thing you admire and name why it works.",
  "Generational thinking: what would make this outlast you?",
  "Joy is a strategy. Do one thing today just because it's fun.",
  "Say no to one thing so you can say yes to the work.",
  "Trust the loop: make, share, learn, repeat.",
];

export const PROMPTS: Record<SparkTheme, string[]> = {
  music: [
    "Write 4 bars about Vallejo at 5 AM. No hook yet, just the picture.",
    "Hum a melody into your voice memos for 60 seconds. Don't judge it, title it.",
    "Sample a sound from your day (a door, traffic, a laugh) and build a loop around it.",
    "Write a hook that only uses words from today's headlines or your inbox.",
    "Rewrite one old verse from the point of view of someone else in the room.",
    "Make a 30-second beat using only three sounds.",
    "Pick a Mad Rich Mondays title for next week and write the first line.",
    "List 10 words that feel like 'Tomorrow Starts Today.' Circle the strongest three and rhyme them.",
    "Freestyle for two minutes about the last place you ate. Keep the best line.",
    "Write a bridge that answers a question your last song asked.",
  ],
  story: [
    "Describe a Bay Area street in three shots: wide, medium, close. What does the close-up reveal?",
    "Write the first line a $BAY participant might say when they get the $100.",
    "Film 15 seconds of something ordinary and give it a title that makes it extraordinary.",
    "Write a logline for a story about the last person you talked to today.",
    "What would Recluse Without a Cause look like from the antagonist's side? Two sentences.",
    "Pick a city on the $BAY list and write the one thing a tourist would never find there.",
    "Write a scene with no dialogue: just what the camera sees.",
    "Interview yourself: three questions you'd ask a $BAY participant, answered honestly.",
    "Storyboard a 10-second vertical cut with three frames on paper.",
    "Write the end of a story first, then the opening line that earns it.",
  ],
  design: [
    "Sketch a $BAY city-edition tee for a city not on the list yet.",
    "Pick three colors from something you saw today. Would they work as a colorway?",
    "Redesign a logo you see every day using only one shape.",
    "Write the tag line for a sweat suit drop in five words or fewer.",
    "Mock up a Sample Sale flyer with just type, no images.",
    "Find a texture on your walk (brick, chain-link, leaves) and imagine it as an embroidery.",
    "Name a capsule collection after a feeling, then list the three pieces.",
    "Design packaging that someone would keep after unboxing. What makes them keep it?",
    "Turn one 2EASY lyric into a graphic: just layout, any tool.",
    "Sketch the merch table for the July 3 pop-up from the customer's point of view.",
  ],
  community: [
    "Write a one-sentence problem a middle schooler might pitch to their principal.",
    "Design a five-minute icebreaker that gets students talking about their neighborhood.",
    "Who's a local business owner whose story nobody has told? Write three questions for them.",
    "Turn one North Star pillar into a game. What are the rules?",
    "Write a thank-you note to someone who opened a door for you. Send it or keep it.",
    "Imagine the North Star Story Festival marquee. What are the three film titles?",
    "List five 'small wins' a student could get in week one of the program.",
    "What would a 'Build Your Own Platform' project look like for your block?",
    "Write the speech you'd give at the first Story Festival, in five sentences.",
    "Pick one community problem and design the smallest possible test of a fix.",
  ],
  reflect: [
    "Three wins from this week, one lesson, one thing to drop.",
    "Which project gave you energy this week, and which took it? Why?",
    "Write a letter from you in December 2027 about what this week started.",
    "What did you make this week that you're proud of, even if nobody saw it?",
    "If you could only finish one thing next week, what would it be?",
    "Map your week: where did the hours actually go? What should move?",
    "Who helped you this week? How can you return the favor?",
    "What's one belief about your work you'd like to test next week?",
    "Rate your rest this week 1–10. What would make it one point better?",
    "Name the creative risk you're avoiding. What's the smallest version of it?",
  ],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Spark {
  day: string;
  theme: SparkTheme;
  mindset: string;
  prompt: string;
}

/** The spark for a day; `shuffle` = how many times "Another one" was tapped. */
export function sparkFor(day: string, shuffle = 0): Spark {
  const theme = DAY_THEME[weekdayOfDay(day)];
  const prompts = PROMPTS[theme];
  return {
    day,
    theme,
    mindset: MINDSETS[(hash(`m:${day}`) + shuffle) % MINDSETS.length],
    prompt: prompts[(hash(`p:${day}`) + shuffle) % prompts.length],
  };
}
