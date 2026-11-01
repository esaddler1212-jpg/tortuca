/**
 * E's plan: yearly goals and the ECS task breakdown behind them.
 *
 * Sources (Google Drive, ECS NETWORK → VANTAGE): "2027 To-do list" (Tortuga /
 * $BAY / Recluse / Easy2See merch), "North Star Network: Business Plan (Oct
 * 2026)" next steps, and the ECS Master Blueprint (2EASY). Months follow the
 * plan's own timeline (concept + legal locked by mid-Dec 2026, sponsors Dec–Jan,
 * casting Jan–Feb, shoots Mar–May, drops Jun 12–Jul 31, Recluse in August).
 *
 * AI tags:
 *   claude  Claude can do it: drafting, research, decks, emails, plans
 *   assist  Claude helps: prep, comparisons, scripts; E does the real-world part
 *   you     Hands-on: buying, shooting, casting, meetings
 */

export type Area = "Tortuga" | "North Star" | "Easy Supply" | "2EASY" | "ECS" | "Personal";
export type AiTag = "claude" | "assist" | "you";

export interface YearGoal {
  id: string;
  year: number;
  title: string;
  area: Area;
  /** Short "why"/definition of done shown under the goal. */
  detail?: string;
  /** Marked complete (for goals without tasks). */
  complete?: boolean;
}

export interface PlanTask {
  id: string;
  title: string;
  area: Area;
  goalId: string;
  /** Target month, YYYY-MM. */
  month: string;
  section: string;
  ai: AiTag;
  /** What Claude should produce (used by the prompt generator). */
  deliverable?: string;
  /** Already done when the plan was written. */
  doneAtStart?: boolean;
}

export const YEAR_GOALS: YearGoal[] = [
  // ── Rest of 2026 (the runway) ─────────────────────────────────────────
  { id: "g26-bay-lock", year: 2026, area: "Tortuga", title: "Lock $BAY concept and legal by Dec 15",
    detail: "Budget, trademark, releases, insurance quotes, sponsor deck." },
  { id: "g26-ns-foundation", year: 2026, area: "North Star", title: "North Star foundation: fiscal sponsor, board, pilot site",
    detail: "Everything the 2027–28 pilot needs signed before spring." },
  { id: "g26-alfred", year: 2026, area: "Personal", title: "AI Agents: Alfred live on iMac and iPhone",
    detail: "Alfred runs the day across both devices.", complete: true },
  { id: "g26-mwfs", year: 2026, area: "Personal", title: "MWFS: Music · Meditate · Master, 4 days a week",
    detail: "Mon · Wed · Fri · Sat." },

  // ── 2027 ──────────────────────────────────────────────────────────────
  { id: "g27-bay", year: 2027, area: "Tortuga", title: "Release $BAY Season 1 (Jun 12 – Jul 31)",
    detail: "7 city episodes + recap, Fourth of July pop-up, festival run with the Director's Cut." },
  { id: "g27-recluse", year: 2027, area: "Tortuga", title: "Make Recluse Without a Cause (August)",
    detail: "First short film: 7 minutes, festival-ready." },
  { id: "g27-northstar", year: 2027, area: "North Star", title: "Launch the North Star pilot (2027–28)",
    detail: "18 students at one MDUSD site; first grant secured." },
  { id: "g27-merch", year: 2027, area: "Easy Supply", title: "Drop Easy2See Part 1 + $BAY city editions",
    detail: "Merch revenue toward the monthly goal ladder." },
  { id: "g27-2easy", year: 2027, area: "2EASY", title: "Trilogy Deluxe + Sample Sales",
    detail: "Deluxe release and documentary (Q1), Sample Sales in Q2 and Q3." },
  { id: "g27-mwfs", year: 2027, area: "Personal", title: "MWFS: Music · Meditate · Master, 4 days a week",
    detail: "Mon · Wed · Fri · Sat, plus gym Tue/Thu/Sun." },
];

const T = (
  id: string, month: string, goalId: string, area: Area, section: string, ai: AiTag, title: string,
  deliverable?: string, doneAtStart?: boolean,
): PlanTask => ({ id, month, goalId, area, section, ai, title, deliverable, doneAtStart });

export const PLAN_TASKS: PlanTask[] = [
  // ── $BAY: 1. Lock the concept ─────────────────────────────────────────
  T("bay-title", "2026-11", "g26-bay-lock", "Tortuga", "Lock the concept", "you", "Pick the final series title: $BAY", undefined, true),
  T("bay-platform", "2026-11", "g26-bay-lock", "Tortuga", "Lock the concept", "you", "Decide the release platform: free on YouTube, vertical cuts on Instagram and TikTok", undefined, true),
  T("bay-budget", "2026-11", "g26-bay-lock", "Tortuga", "Lock the concept", "claude", "Set a per-episode budget, including participant stipends", "a per-episode and season budget table with line items, unknowns flagged, and a low/target/high version"),
  T("bay-rules", "2026-11", "g26-bay-lock", "Tortuga", "Lock the concept", "claude", "Finalize the rules of the $100", "a one-page rules sheet for participants: what counts as spending, what's off limits, receipts, and edge cases"),
  T("bay-uspto", "2026-11", "g26-bay-lock", "Tortuga", "Lock the concept", "assist", "Search USPTO for $BAY, SBAY and DOLLAR BAY (classes 25 and 41)", "step-by-step instructions for searching tmsearch.uspto.gov and a checklist for reading the results before a lawyer call"),
  T("bay-handles", "2026-11", "g26-bay-lock", "Tortuga", "Lock the concept", "you", "Claim $BAY social handles on Instagram, TikTok and YouTube"),
  T("bay-domain", "2026-11", "g26-bay-lock", "Tortuga", "Lock the concept", "assist", "Register a $BAY domain", "a short list of available-looking domain options to check and how to pick one"),
  T("bay-tm-consult", "2026-12", "g26-bay-lock", "Tortuga", "Lock the concept", "assist", "Book a trademark attorney consult and file before merch drops", "a list of questions to bring to the trademark attorney and what documents to prepare"),
  // ── $BAY: 2. Legal and gear ───────────────────────────────────────────
  T("bay-consent", "2026-12", "g26-bay-lock", "Tortuga", "Legal and gear", "assist", "Get legal guidance on California recording consent", "a plain-language summary of California recording-consent issues for a POV street series, with the specific questions to confirm with a lawyer"),
  T("bay-releases", "2026-12", "g26-bay-lock", "Tortuga", "Legal and gear", "claude", "Draft release forms for participants, businesses and bystanders", "draft participant, location/business and appearance release forms covering YouTube, festivals and third-party streaming (Tubi), marked for attorney review"),
  T("bay-insurance", "2026-12", "g26-bay-lock", "Tortuga", "Gaps to close", "assist", "Get production insurance quotes (general liability)", "what coverage to ask for, a quote-request email, and a comparison table to fill in"),
  T("bay-briefing", "2027-01", "g27-bay", "Tortuga", "Legal and gear", "claude", "Write the participant briefing (what we tell them, what we don't)", "a participant briefing script and handout"),
  T("bay-gear-buy", "2027-01", "g27-bay", "Tortuga", "Legal and gear", "you", "Buy Rokid AI Glasses Style ($299) and a used Insta360 Go Ultra (~$304)"),
  T("bay-lav", "2027-01", "g27-bay", "Tortuga", "Legal and gear", "assist", "Buy a wireless lav mic for the participant", "3 wireless lav mic options under $200 that pair with a phone or the Insta360, with tradeoffs"),
  T("bay-go3-rent", "2027-02", "g27-bay", "Tortuga", "Legal and gear", "you", "Rent an Insta360 Go 3 for 3 days in February (~$36)"),
  T("bay-sitdown-cam", "2027-02", "g27-bay", "Tortuga", "Legal and gear", "you", "Line up a sit-down camera and lav mic"),
  T("bay-car-rig", "2027-02", "g27-bay", "Tortuga", "Legal and gear", "you", "Get a dash suction mount and a second camera for the car rig"),
  T("bay-drivers", "2027-02", "g27-bay", "Tortuga", "Legal and gear", "you", "Book and vet a driver for each Saturday shoot (license, insurance, background check)"),
  // ── $BAY: 4. Funding and partners ─────────────────────────────────────
  T("bay-sponsor-deck", "2026-12", "g26-bay-lock", "Tortuga", "Funding and partners", "claude", "Build a one-page sponsor deck from the treatment", "a one-page sponsor deck: the pitch, audience, sponsorship tiers (presenting, pop-up, episode $100), what sponsors get, and disclosure rules"),
  T("bay-foundations", "2026-12", "g27-bay", "Tortuga", "Funding and partners", "claude", "List community foundations and arts councils in all seven cities", "a table of community foundations and city arts councils in Vallejo, Richmond, Berkeley, Oakland, San Francisco, Hayward and San Jose with grant programs, deadlines and links to verify"),
  T("bay-credit-unions", "2027-01", "g27-bay", "Tortuga", "Funding and partners", "assist", "Pitch local credit unions to sponsor each episode's $100", "a target list of local credit unions per city and a short pitch email + follow-up"),
  T("bay-city-merch", "2027-03", "g27-merch", "Easy Supply", "Funding and partners", "assist", "Design $BAY city-edition merch with Easy Supply Co.", "a design brief for seven city editions ($BAY: VALLEJO, $BAY: OAKLAND...) with drop schedule tied to episodes"),
  T("bay-dj", "2027-04", "g27-bay", "Tortuga", "Funding and partners", "assist", "Line up a DJ or artist for the pop-up", "an outreach message and simple performer agreement checklist"),
  // ── $BAY: casting + pilot ─────────────────────────────────────────────
  T("bay-casting-rules", "2027-01", "g27-bay", "Tortuga", "Cast the season", "claude", "Set casting rules (18+, lives in the city) and a casting call", "casting rules plus a casting-call post and short application form"),
  T("bay-cast-vallejo", "2027-01", "g27-bay", "Tortuga", "Pilot: Vallejo", "you", "Cast the Vallejo participant"),
  T("bay-cast-rest", "2027-02", "g27-bay", "Tortuga", "Cast the season", "you", "Cast Richmond, Berkeley, Oakland, SF, Hayward and San Jose"),
  T("bay-editor", "2027-01", "g27-bay", "Tortuga", "Gaps to close", "assist", "Decide who edits the episodes and lock their schedule for Mar–May", "an editor job post, rate expectations, and a Mar–May delivery schedule"),
  T("bay-businesses", "2027-02", "g27-bay", "Tortuga", "Pilot: Vallejo", "assist", "Pick and call ahead to likely Vallejo businesses", "a call script and a simple location-release explanation for business owners"),
  T("bay-test-spend", "2027-02", "g27-bay", "Tortuga", "Pilot: Vallejo", "you", "Run the glasses tutorial and a test spend"),
  T("bay-storage", "2027-02", "g27-bay", "Tortuga", "Gaps to close", "claude", "Set up footage storage: two drives plus a cloud copy after every shoot", "a footage workflow checklist: folder naming, offload steps, backup rule, and a shopping list"),
  T("bay-music", "2027-02", "g27-bay", "Tortuga", "Gaps to close", "assist", "Choose episode music: Easy2See tracks or licensed library music", "the tradeoffs (cost, streaming clearance for Tubi) and a recommendation"),
  T("bay-permit", "2027-02", "g27-bay", "Tortuga", "Release and pop-up", "assist", "Apply early for Oakland's special event permit for the Jul 3 pop-up", "the permit steps, documents needed, and a timeline back from July 3"),
  T("bay-shoot-vallejo", "2027-03", "g27-bay", "Tortuga", "Pilot: Vallejo", "you", "Shoot the Vallejo pilot (pre-interview, spend, post-interview)"),
  T("bay-edit-pilot", "2027-03", "g27-bay", "Tortuga", "Pilot: Vallejo", "you", "Edit the pilot episode"),
  T("bay-offthegrid", "2027-03", "g27-bay", "Tortuga", "Release and pop-up", "claude", "Reach out to Off the Grid about partnering on the pop-up", "a partnership pitch email to Off the Grid with what $BAY brings and what we're asking for"),
  // ── $BAY: release + pop-up ────────────────────────────────────────────
  T("bay-release-cal", "2027-04", "g27-bay", "Tortuga", "Release and pop-up", "claude", "Set the weekly release calendar (Jun 12 – Jul 31)", "a release calendar: episode order, drop dates, vertical cuts, merch drops, and promo posts"),
  T("bay-popup-plan", "2027-05", "g27-bay", "Tortuga", "Release and pop-up", "claude", "Plan the Jul 3 Oakland pop-up (lot, permit, food trucks, screen, sound, generator)", "a pop-up run-of-show, vendor checklist, budget and permit timeline"),
  T("bay-festivals", "2027-05", "g27-bay", "Tortuga", "Gaps to close", "claude", "Email SFFILM and DocLands about Director's Cut eligibility before Jun 12", "a short, clear eligibility question email to each festival"),
  T("bay-captions", "2027-05", "g27-bay", "Tortuga", "Gaps to close", "claude", "Plan captions and thumbnails for each weekly drop", "a caption + thumbnail template system and a per-episode checklist"),
  T("bay-key-art", "2027-05", "g27-bay", "Tortuga", "Gaps to close", "assist", "Make key art: vertical poster, horizontal art, hero image", "a design brief and image-generation prompts for the key art"),
  T("bay-music-clear", "2027-05", "g27-bay", "Tortuga", "Gaps to close", "assist", "Clear all episode music for streaming, not just YouTube", "a music clearance checklist and a request email template"),
  T("bay-metrics", "2027-06", "g27-bay", "Tortuga", "Gaps to close", "claude", "Track views, watch time, subscribers, pop-up turnout and merch sales from day one", "a simple tracking sheet layout and weekly review questions"),
  T("bay-popup-film", "2027-06", "g27-bay", "Tortuga", "Release and pop-up", "assist", "Plan filming at the pop-up for social cuts", "a shot list and social-cut plan for the pop-up"),
  T("bay-city-drops", "2027-06", "g27-merch", "Easy Supply", "Release and pop-up", "you", "Release each $BAY city edition the same Saturday as its episode"),
  T("bay-prores", "2027-07", "g27-bay", "Tortuga", "Gaps to close", "you", "Have the editor deliver a ProRes master and separate audio tracks"),
  T("bay-sizzle", "2027-08", "g27-bay", "Tortuga", "Gaps to close", "assist", "Cut a 2–3 minute sizzle reel right after the season wraps", "a sizzle-reel structure and the stats to feature"),
  T("bay-dc", "2027-10", "g27-bay", "Tortuga", "Gaps to close", "you", "Cut the $BAY Director's Cut (45–60 min)"),
  T("bay-cinequest", "2027-10", "g27-bay", "Tortuga", "Gaps to close", "claude", "Submit the Director's Cut to Cinequest (regular deadline, Oct)", "the submission synopsis, logline, director bio and festival checklist"),
  // ── Recluse Without a Cause ───────────────────────────────────────────
  T("rec-script", "2027-06", "g27-recluse", "Tortuga", "Recluse Without a Cause", "assist", "Finish the script around the three-part loop and the two mantras", "script notes and a revision pass that keeps E's voice"),
  T("rec-cast", "2027-07", "g27-recluse", "Tortuga", "Recluse Without a Cause", "you", "Cast and lock locations"),
  T("rec-schedule", "2027-07", "g27-recluse", "Tortuga", "Recluse Without a Cause", "claude", "Schedule the August shoot", "a shooting schedule and call-sheet template"),
  T("rec-wardrobe", "2027-07", "g27-recluse", "Tortuga", "Recluse Without a Cause", "you", "Pull a muted $BAY tee for wardrobe"),
  T("rec-song", "2027-07", "g27-recluse", "Tortuga", "Recluse Without a Cause", "you", "Choose the Easy2See song for the credit roll"),
  T("rec-shoot", "2027-08", "g27-recluse", "Tortuga", "Recluse Without a Cause", "you", "Shoot Recluse Without a Cause"),
  // ── Easy2See Part 1 merch ─────────────────────────────────────────────
  T("e2s-capsule", "2027-01", "g27-merch", "Easy Supply", "Easy2See Part 1 merch", "assist", "Pick the Part 1 capsule pieces from the Universe Bible", "a capsule line sheet: pieces, colorways, price points and margins"),
  T("e2s-vendors", "2027-02", "g27-merch", "Easy Supply", "Easy2See Part 1 merch", "claude", "Source heavyweight blanks and an embroidery vendor", "a shortlist of heavyweight blank brands and Bay Area embroidery vendors with what to ask and a quote-request email"),
  T("e2s-collabs", "2027-02", "g27-merch", "Easy Supply", "Easy2See Part 1 merch", "claude", "Ask the Richmond barbershop and Tennessee St taco truck about collabs", "two short, personal collab pitch messages"),
  T("e2s-drop", "2027-04", "g27-merch", "Easy Supply", "Easy2See Part 1 merch", "claude", "Time the drop to the Part 1 listening party (Sample Sale)", "a drop timeline and launch checklist tied to the listening party"),
  // ── 2EASY ─────────────────────────────────────────────────────────────
  T("2e-deluxe", "2027-03", "g27-2easy", "2EASY", "Trilogy Era", "assist", "Release the Trilogy Deluxe + documentary (Q1)", "a release rollout plan (pre-save, content calendar, documentary drop)"),
  T("2e-sample-q2", "2027-06", "g27-2easy", "2EASY", "Trilogy Era", "claude", "Run the Q2 Sample Sale", "a Sample Sale run-of-show, promo plan and checklist"),
  T("2e-sample-q3", "2027-09", "g27-2easy", "2EASY", "Trilogy Era", "claude", "Run the Q3 Sample Sale", "a Sample Sale run-of-show, promo plan and checklist"),
  // ── North Star (business plan next steps) ─────────────────────────────
  T("ns-site", "2026-12", "g26-ns-foundation", "North Star", "Pilot site", "assist", "Choose Oak Grove vs Valley View; open talks with the principal and MDUSD", "a comparison of the two sites and an intro email to the Valley View principal"),
  T("ns-fiscal", "2026-12", "g26-ns-foundation", "North Star", "Organization", "claude", "Identify and approach a fiscal sponsor", "a shortlist of Bay Area fiscal sponsors for youth programs, their fees and fit, and an inquiry email"),
  T("ns-board", "2026-12", "g26-ns-foundation", "North Star", "Organization", "claude", "Seat the board and adopt a conflict-of-interest policy", "a conflict-of-interest policy draft and a first board meeting agenda"),
  T("ns-ases", "2027-01", "g27-northstar", "North Star", "Pilot site", "assist", "Confirm the site's ASES contract and per-student contribution", "the questions to ask the site and a one-page cost-share summary"),
  T("ns-grant-writer", "2027-01", "g27-northstar", "North Star", "Funding", "claude", "Engage a grant writer on a flat fee; target a pilot-year grant", "a grant-writer scope of work (flat fee) and 5 pilot-year grant targets to verify"),
  T("ns-grants", "2027-03", "g27-northstar", "North Star", "Funding", "claude", "Apply for the first grants", "a reusable grant narrative: need, program, outcomes, budget summary"),
  T("ns-posterchild", "2027-03", "g27-northstar", "North Star", "Partnerships", "claude", "Explore PosterChild as an AI/creative partner", "a short partnership outline and a note to the CEO"),
  T("ns-intern", "2027-04", "g27-northstar", "North Star", "Staffing", "claude", "Recruit a community college intern", "an intern job post and interview questions"),
  T("ns-mentors", "2027-04", "g27-northstar", "North Star", "Staffing", "assist", "Recruit local filmmaker mentors", "a mentor outreach message and what mentors commit to"),
  T("ns-agreement", "2027-05", "g27-northstar", "North Star", "Pilot site", "you", "Sign the site agreement"),
  T("ns-iphones", "2027-06", "g27-northstar", "North Star", "Pilot kit", "assist", "Source refurbished iPhones for the pilot kit", "a kit list with refurbished iPhone sources and a donation request letter"),
];
