import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const required = [
  "workshops/tortuca-creative.json",
  "docs/CREATIVE_WORKSHOPS.md",
  "shared/workshops.ts",
  "tools/open-generative-ai/README.md",
  "tools/open-generative-ai/CHERRY_PICK.md",
  "tools/open-generative-ai/bootstrap.sh",
  "src/components/WorkshopsPanel.tsx",
];

for (const rel of required) {
  const f = path.join(root, rel);
  if (!existsSync(f)) {
    console.error(`creative-workshops missing ${rel}`);
    process.exit(1);
  }
}

const catalog = JSON.parse(readFileSync(path.join(root, "workshops/tortuca-creative.json"), "utf8")) as {
  entries: { id: string }[];
};
const ids = new Set(catalog.entries.map((e) => e.id));
if (!ids.has("open-generative-ai")) {
  console.error("catalog must include open-generative-ai");
  process.exit(1);
}

const cherry = readFileSync(path.join(root, "tools/open-generative-ai/CHERRY_PICK.md"), "utf8");
if (!/safeFact|MuAPI|Netlify/.test(cherry)) {
  console.error("CHERRY_PICK should mention guardrails (safeFact / MuAPI / Netlify)");
  process.exit(1);
}

console.log(`check-creative-workshops: ok (${catalog.entries.length} entries)`);
