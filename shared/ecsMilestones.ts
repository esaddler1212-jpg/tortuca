/**
 * ECS Network / Vantage roadmap milestones (from the Tortuga Productions 2027
 * plan). Shared by the Woodhouse roadmap node and the Chief of Staff.
 */
export interface Milestone {
  id: string;
  division: "Tortuga Productions" | "Easy Supply Co." | "North Star Network" | "2EASY" | "ECS Network";
  title: string;
  /** Inclusive YYYY-MM-DD */
  start: string;
  /** Inclusive YYYY-MM-DD; omit for single-day milestones */
  end?: string;
  action?: string;
}

export const MILESTONES: Milestone[] = [
  {
    id: "bay-sponsor-pitch",
    division: "Tortuga Productions",
    title: "$BAY sponsor + grant pitching",
    start: "2026-12-01",
    end: "2027-01-31",
    action: "Pitch $BAY presenting, pop-up and episode sponsors; apply to city arts councils",
  },
  {
    id: "bay-concept-legal",
    division: "Tortuga Productions",
    title: "$BAY concept + legal locked",
    start: "2026-11-01",
    end: "2026-12-15",
    action: "Lock $BAY concept, releases and legal by mid-December",
  },
  {
    id: "bay-casting",
    division: "Tortuga Productions",
    title: "$BAY casting (7 participants)",
    start: "2027-01-01",
    end: "2027-02-28",
    action: "Cast $BAY participants for all seven cities",
  },
  {
    id: "bay-test-spend",
    division: "Tortuga Productions",
    title: "$BAY test spend (Insta360 Go 3 rental)",
    start: "2027-02-01",
    end: "2027-02-28",
    action: "Book the 3-day Insta360 Go 3 test rental",
  },
  {
    id: "bay-shoot",
    division: "Tortuga Productions",
    title: "$BAY shoot: Saturdays, one city a week",
    start: "2027-03-06",
    end: "2027-05-01",
    action: "Prep this Saturday's $BAY city shoot",
  },
  {
    id: "festival-eligibility",
    division: "Tortuga Productions",
    title: "Ask SFFILM + DocLands about Director's Cut eligibility",
    start: "2027-05-15",
    end: "2027-06-11",
    action: "Email SFFILM and DocLands before $BAY episodes go public",
  },
  {
    id: "bay-season",
    division: "Tortuga Productions",
    title: "$BAY season: weekly YouTube drops",
    start: "2027-06-12",
    end: "2027-07-31",
    action: "Publish this week's $BAY episode, vertical cuts and city-edition merch",
  },
  {
    id: "bay-popup",
    division: "Tortuga Productions",
    title: "$BAY Fourth of July pop-up",
    start: "2027-07-03",
    action: "Run the July 3 pop-up and film the recap",
  },
  {
    id: "recluse",
    division: "Tortuga Productions",
    title: "Recluse Without a Cause (short film)",
    start: "2027-08-01",
    end: "2027-08-31",
    action: "Produce Recluse Without a Cause; cut the $BAY sizzle reel",
  },
  {
    id: "cinequest-submit",
    division: "Tortuga Productions",
    title: "Cinequest submission window",
    start: "2027-08-01",
    end: "2027-11-30",
    action: "Submit $BAY Director's Cut / Recluse to Cinequest",
  },
  {
    id: "sffilm-submit",
    division: "Tortuga Productions",
    title: "SFFILM submission window",
    start: "2027-09-01",
    end: "2027-12-31",
    action: "Submit to SFFILM (if eligible)",
  },
  {
    id: "sample-sales-2027",
    division: "2EASY",
    title: "Sample Sales (Q2 & Q3)",
    start: "2027-04-01",
    end: "2027-09-30",
  },
];
