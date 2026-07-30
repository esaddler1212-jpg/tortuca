export const AI_WATCHLIST: Array<{ symbol: string; name: string }> = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "META", name: "Meta" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "PLTR", name: "Palantir" },
  { symbol: "SMCI", name: "Super Micro" },
  { symbol: "ARM", name: "Arm Holdings" },
  { symbol: "SOUN", name: "SoundHound AI" },
  { symbol: "AI", name: "C3.ai" },
];

export const DRONE_WATCHLIST: Array<{ symbol: string; name: string }> = [
  { symbol: "AVAV", name: "AeroVironment" },
  { symbol: "RCAT", name: "Red Cat Holdings" },
  { symbol: "ONDS", name: "Ondas Holdings" },
  { symbol: "DPRO", name: "Draganfly" },
  { symbol: "EH", name: "EHang" },
  { symbol: "ACHR", name: "Archer Aviation" },
];

const IPO_KEYWORDS = [
  "ai",
  "artificial",
  "intelligence",
  "machine learning",
  "drone",
  "uav",
  "autonomous",
  "robot",
  "semiconductor",
  "chip",
  "software",
  "cloud",
  "data",
  "tech",
  "aerospace",
  "defense",
];

export function ipoMatchesTechThemes(name: string, symbol: string): Array<"ai" | "drones"> {
  const text = `${name} ${symbol}`.toLowerCase();
  const themes: Array<"ai" | "drones"> = [];
  const aiHit = ["ai", "artificial", "intelligence", "machine learning", "semiconductor", "chip", "software", "cloud", "data", "tech"].some(
    (k) => text.includes(k),
  );
  const droneHit = ["drone", "uav", "autonomous", "aerospace", "defense", "aviation", "aero"].some(
    (k) => text.includes(k),
  );
  if (aiHit) themes.push("ai");
  if (droneHit) themes.push("drones");
  if (themes.length === 0 && IPO_KEYWORDS.some((k) => text.includes(k))) themes.push("ai");
  return themes;
}
