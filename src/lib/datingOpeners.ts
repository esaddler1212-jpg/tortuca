/**
 * Local, template-based opening lines for dating apps (no external API).
 * Uses a deterministic seed so “another line” can cycle without pure randomness in tests.
 */

export type OpenerTone = "playful" | "warm" | "witty" | "direct" | "curious";
export type OpenerEnergy = "chill" | "upbeat" | "bold";
export type OpenerChannel = "hinge" | "bumble" | "tinder" | "generic";

export interface OpenerContext {
  /** Their first name, if comfortable using it */
  theirName?: string;
  /** Something specific from their profile (hobby, photo, prompt) */
  detail?: string;
  /** Your first name, optional */
  userName?: string;
}

export interface GenerateOpenersOptions {
  tone: OpenerTone;
  energy: OpenerEnergy;
  channel: OpenerChannel;
  /** Increments each generation so lines vary */
  seed: number;
}

/** FNV-1a 32-bit — stable string hash for indexing */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DEFAULT_DETAIL = "that detail in your profile";
const PLACEHOLDER_DETAIL = "{detail}";
const PLACEHOLDER_THEIR = "{theirName}";
const PLACEHOLDER_USER = "{userName}";

function formatTheirName(name: string | undefined): string {
  const t = name?.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function substitute(
  template: string,
  context: OpenerContext,
): string {
  const detail = context.detail?.trim() || DEFAULT_DETAIL;
  const their = formatTheirName(context.theirName);
  const user = context.userName?.trim() || "";

  let line = template
    .replaceAll(PLACEHOLDER_DETAIL, detail)
    .replaceAll(PLACEHOLDER_THEIR, their)
    .replaceAll(PLACEHOLDER_USER, user || "I");

  // Clean greeting spacing when no name: "Hi ," / "Hi  —"
  line = line.replace(/\bHi\s+,/g, "Hi —");
  line = line.replace(/\s+,/g, ",");
  line = line.replace(/\s{2,}/g, " ");
  line = line.trim();
  return line;
}

/* -------------------------------------------------------------------------- */
/* Templates: tone × energy → string[] with optional placeholders */

const TEMPLATES: Record<OpenerTone, Record<OpenerEnergy, string[]>> = {
  playful: {
    chill: [
      `Okay I have to ask — ${PLACEHOLDER_DETAIL} is giving main-character energy. What's the most underrated part of it?`,
      `${PLACEHOLDER_THEIR ? `Hey ${PLACEHOLDER_THEIR}` : "Hey"} — ${PLACEHOLDER_DETAIL} caught my eye. If you had to pitch it to a skeptic in one sentence, what would you say?`,
      `Honest question: ${PLACEHOLDER_DETAIL} looks fun, but what's the part nobody warns you about until you're already committed?`,
      `I'm trying to decide if ${PLACEHOLDER_DETAIL} is more "Sunday reset" or "Tuesday chaos." Which camp are you in?`,
      `I'll trade you: one surprisingly good take about ${PLACEHOLDER_DETAIL} for one book, show, or playlist you swear by.`,
    ],
    upbeat: [
      `Not me getting actually excited about ${PLACEHOLDER_DETAIL} on a stranger's profile — okay go: what's your hot take?`,
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR}!` : "Quick one!"} ${PLACEHOLDER_DETAIL} — teach me something I wouldn't guess from the photos.`,
      `First message energy check: ${PLACEHOLDER_DETAIL} has me curious. What's the story in 10 words or less?`,
      `Plot twist: ${PLACEHOLDER_DETAIL} is the hook. What's the sequel — the hobby/skill you're low-key proud of?`,
      `I'm picturing you nerding out about ${PLACEHOLDER_DETAIL} and I need the beginner-friendly entry point. Where do I start?`,
    ],
    bold: [
      `Alright, ${PLACEHOLDER_DETAIL} — bold move putting that out there. Convince me it's not just aesthetic; what's the real payoff?`,
      `I'm going to be direct: ${PLACEHOLDER_DETAIL} is why I'm messaging. What's your unpopular opinion about it?`,
      `Hot take request: ${PLACEHOLDER_DETAIL}. What's overrated about it, and what's actually worth the hype?`,
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR}, ` : ""}I need you to defend ${PLACEHOLDER_DETAIL} like it's your thesis topic. Opening argument?`,
      `Rapid-fire: ${PLACEHOLDER_DETAIL} — best memory tied to it, and one thing you'd change if you could?`,
    ],
  },
  warm: {
    chill: [
      `${PLACEHOLDER_THEIR ? `Hi ${PLACEHOLDER_THEIR}` : "Hi"} — ${PLACEHOLDER_DETAIL} felt really genuine. What drew you to it?`,
      `I liked reading about ${PLACEHOLDER_DETAIL}. What's a small moment from this week that made you smile?`,
      `${PLACEHOLDER_DETAIL} is such a good glimpse into who you are. If we grabbed coffee, what's the first story you'd tell?`,
      `Something about ${PLACEHOLDER_DETAIL} feels intentional in a nice way. What's one thing you're looking forward to lately?`,
      `I appreciate profiles that aren't generic — ${PLACEHOLDER_DETAIL} stood out. What would a perfect slow weekend look like for you?`,
    ],
    upbeat: [
      `${PLACEHOLDER_THEIR ? `Hey ${PLACEHOLDER_THEIR}` : "Hey"}! ${PLACEHOLDER_DETAIL} made me smile — what's something small that always lifts your mood?`,
      `Your profile radiates good energy; ${PLACEHOLDER_DETAIL} especially. What's a win you're celebrating lately, tiny or big?`,
      `Okay, ${PLACEHOLDER_DETAIL} is charming. What's one thing you're excited to try or get better at this month?`,
      `I'm here for ${PLACEHOLDER_DETAIL} — what's a song or podcast that's been on repeat for you?`,
      `Real talk: ${PLACEHOLDER_DETAIL} feels like a window into your values. What kind of connection are you hoping to find here?`,
    ],
    bold: [
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR} — ` : ""}I'm going to skip small talk: ${PLACEHOLDER_DETAIL} matters to you. What does "chemistry" mean in practice for you?`,
      `I'm putting it out there: ${PLACEHOLDER_DETAIL} is why I'm interested. What would make a first date feel easy for you?`,
      `Bold question because ${PLACEHOLDER_DETAIL} seems central to you: what's a non-negotiable for you in dating right now?`,
      `I want to be upfront — ${PLACEHOLDER_DETAIL} resonated. What are you most proud of about how you show up for people?`,
      `${PLACEHOLDER_DETAIL} tells me you're intentional. What's something you're done tolerating in dating?`,
    ],
  },
  witty: {
    chill: [
      `If ${PLACEHOLDER_DETAIL} were a movie genre, what would the trailer voiceover say?`,
      `Pop quiz (pass/fail, no pressure): ${PLACEHOLDER_DETAIL} — genius branding or happy accident?`,
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR}, ` : ""}I need a field report: ${PLACEHOLDER_DETAIL} — what's the beginner trap and how do you dodge it?`,
      `I'm drafting a rulebook for first messages and ${PLACEHOLDER_DETAIL} just earned a footnote. Care to be quoted?`,
      `Two truths and a lie about ${PLACEHOLDER_DETAIL} — go. I'll guess (poorly).`,
    ],
    upbeat: [
      `Pitch me ${PLACEHOLDER_DETAIL} like it's a startup and I'm a skeptical investor — what's the ROI on joy?`,
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR}!` : "Hello!"} ${PLACEHOLDER_DETAIL} — what's the fan theory you secretly believe?`,
      `Emergency question: ${PLACEHOLDER_DETAIL} — underrated hack vs overrated flex?`,
      `I'm holding auditions for "most interesting thing on your profile" and ${PLACEHOLDER_DETAIL} is in the final round. Closing statement?`,
      `If ${PLACEHOLDER_DETAIL} had a group chat, who would be @everyone'd first?`,
    ],
    bold: [
      `Controversial alignment chart: ${PLACEHOLDER_DETAIL}. Where do you land and who's wrong?`,
      `I'm giving you the floor: ${PLACEHOLDER_DETAIL} — defend it against the haters in two sentences.`,
      `Debate mode: ${PLACEHOLDER_DETAIL} is either a lifestyle or a phase. Pick a lane and argue it.`,
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR} — ` : ""}${PLACEHOLDER_DETAIL} is the main plot. What's the twist ending?`,
      `Rate ${PLACEHOLDER_DETAIL}: life skill, personality cheat code, or happy accident? Fight me (politely).`,
    ],
  },
  direct: {
    chill: [
      `${PLACEHOLDER_THEIR ? `Hi ${PLACEHOLDER_THEIR}` : "Hi"} — ${PLACEHOLDER_DETAIL} stood out. What are you looking for on here?`,
      `Straightforward: ${PLACEHOLDER_DETAIL} is what made me message. What does a good week look like for you?`,
      `I'm interested. ${PLACEHOLDER_DETAIL} matters to you — what would you want to know about me first?`,
      `Clear ask: ${PLACEHOLDER_DETAIL} — want to swap two recommendations (food, music, anything) and see if we vibe?`,
      `${PLACEHOLDER_DETAIL} reads as something you actually do, not just list. What would you want to do on a low-key first meet?`,
    ],
    upbeat: [
      `${PLACEHOLDER_THEIR ? `Hey ${PLACEHOLDER_THEIR}` : "Hey"} — ${PLACEHOLDER_DETAIL} is a green flag for me. Coffee or a walk — which sounds more you?`,
      `I'm being direct: ${PLACEHOLDER_DETAIL} + your vibe = I'd like to talk more. What's your ideal first message back?`,
      `No games — ${PLACEHOLDER_DETAIL} is the reason I'm here. What's the best way to plan something simple this week?`,
      `I'll be upfront: ${PLACEHOLDER_DETAIL} is compelling. Are you more voice-notes or long-text energy?`,
      `Real question: ${PLACEHOLDER_DETAIL} — if we hit it off, what would you want date one to feel like?`,
    ],
    bold: [
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR} — ` : ""}I'm not here to drag out small talk; ${PLACEHOLDER_DETAIL} is why I messaged. What's your availability like this week?`,
      `Direct: ${PLACEHOLDER_DETAIL} sold me. Want to trade numbers and pick a time for a drink or walk?`,
      `I'll say it plainly: ${PLACEHOLDER_DETAIL} + your photos = I'd like to meet. What's the best next step for you?`,
      `Bold ask because life is short: ${PLACEHOLDER_DETAIL} resonates — want to skip the endless chat and do one concrete plan?`,
      `${PLACEHOLDER_DETAIL} is specific enough that I trust you're intentional. What's your stance on planning something in the next few days?`,
    ],
  },
  curious: {
    chill: [
      `${PLACEHOLDER_THEIR ? `Hi ${PLACEHOLDER_THEIR}` : "Hi"} — I'm curious how you got into ${PLACEHOLDER_DETAIL}. Was it gradual or a one-day decision?`,
      `${PLACEHOLDER_DETAIL} made me wonder: what part of it feels most "you" day to day?`,
      `What does ${PLACEHOLDER_DETAIL} give you that you don't get from other interests?`,
      `I'm genuinely curious: if ${PLACEHOLDER_DETAIL} disappeared tomorrow, what would you replace it with?`,
      `Tell me about ${PLACEHOLDER_DETAIL} like I'm new — what's the part you wish more people understood?`,
    ],
    upbeat: [
      `${PLACEHOLDER_THEIR ? `Hey ${PLACEHOLDER_THEIR}` : "Hey"} — I want the lore: how did ${PLACEHOLDER_DETAIL} become part of your life?`,
      `What's the plot twist in your relationship with ${PLACEHOLDER_DETAIL}?`,
      `${PLACEHOLDER_DETAIL} seems like it teaches you something — what's the latest lesson?`,
      `I'm asking because I'm interested: who got you into ${PLACEHOLDER_DETAIL}, or was it self-directed?`,
      `Curious question: ${PLACEHOLDER_DETAIL} — what's your "beginner me" vs "today me" story?`,
    ],
    bold: [
      `${PLACEHOLDER_THEIR ? `${PLACEHOLDER_THEIR}, ` : ""}I want the real answer: what does ${PLACEHOLDER_DETAIL} cost you in time or energy, and why is it still worth it?`,
      `Deep cut: ${PLACEHOLDER_DETAIL} — what's something vulnerable it reveals about you?`,
      `I'm asking directly: how does ${PLACEHOLDER_DETAIL} show up in how you date or connect with people?`,
      `Don't spare me: what's the hardest thing about ${PLACEHOLDER_DETAIL} that you power through anyway?`,
      `${PLACEHOLDER_DETAIL} — if it were a chapter title in your life story, what would the next chapter be?`,
    ],
  },
};

const CHANNEL_HINTS: Record<OpenerChannel, string> = {
  hinge: "Hinge: reference their prompt or photo in the first line when you can — specificity beats generic praise.",
  bumble: "Bumble: keep it inviting; your opener starts the chat, so a clear question helps.",
  tinder: "Tinder: short + specific often wins — one vivid detail beats a paragraph.",
  generic: "Tip: swap in one concrete detail from their profile so it doesn't read like a template.",
};

export function getChannelHint(channel: OpenerChannel): string {
  return CHANNEL_HINTS[channel];
}

export function generateOpenerLine(
  options: GenerateOpenersOptions,
  context: OpenerContext,
): string {
  const list = TEMPLATES[options.tone][options.energy];
  // Stable offset per (tone, energy, channel), then cycle templates with seed so "Another line" always advances.
  const base = hashString(`${options.tone}:${options.energy}:${options.channel}`);
  const idx = (base + options.seed) % list.length;
  const template = list[idx] ?? list[0];
  return substitute(template, context);
}
