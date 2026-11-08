import { existsSync, readFileSync } from "node:fs";

const paths = ["xtool/CHERRY_PICK.md", "xtool/README.md", "xtool/bootstrap.sh", "xtool/ios-qa.sh"];
let ok = true;
for (const p of paths) {
  if (!existsSync(p)) {
    console.error(`missing ${p}`);
    ok = false;
  }
}
const bootstrap = readFileSync("xtool/bootstrap.sh", "utf8");
if (!bootstrap.includes("xtool-org/xtool")) {
  console.error("bootstrap.sh missing upstream URL");
  ok = false;
}
if (!process.exitCode && !ok) process.exitCode = 1;
console.log(ok ? "xtool-cherry ok" : "xtool-cherry failed");
