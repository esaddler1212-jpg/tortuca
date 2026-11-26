/** VantageGames developer group — org chart sanity. Run: npm run test:game-studio-org */
import {
  VANTAGEGAMES_DEVELOPER_GROUP,
  gameDeveloperById,
  reportingChain,
  sliceOwnerDevelopers,
} from "../shared/gameStudioDevelopers.ts";
import { GAME_STUDIO_AGENTS } from "../shared/gameFinishProgram.ts";

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("developer group has woodhouse lead", VANTAGEGAMES_DEVELOPER_GROUP.some((d) => d.id === "woodhouse"));
ok("seven game developers", VANTAGEGAMES_DEVELOPER_GROUP.length === 7);

for (const d of VANTAGEGAMES_DEVELOPER_GROUP) {
  ok(`${d.id} has verify`, d.verify.length > 3);
  ok(`${d.id} has responsibility`, d.responsibility.length > 10);
}

const owners = sliceOwnerDevelopers();
ok("two slice owners", owners.length === 2);
for (const sliceAgent of GAME_STUDIO_AGENTS) {
  ok(`slice owner ${sliceAgent.id} in group`, Boolean(gameDeveloperById(sliceAgent.id)?.sliceOwner));
}

const kilnChain = reportingChain("kiln");
ok("kiln reports up to woodhouse", kilnChain.some((r) => r.id === "woodhouse") && kilnChain[0]?.id === "kiln");

if (failed) process.exitCode = 1;
else console.log("check-game-studio-org: ok");