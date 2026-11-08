import { existsSync } from "node:fs";
import { parseHttpUrlFromText, readHttpLinkFromClipboard } from "../shared/httpClipboard.ts";

const paths = ["cobalt/CHERRY_PICK.md", "cobalt/README.md", "cobalt/bootstrap.sh", "shared/httpClipboard.ts"];
let ok = true;
for (const p of paths) {
  if (!existsSync(p)) {
    console.error(`missing ${p}`);
    ok = false;
  }
}

let n = 0;
const check = (label: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${label}`);
  if (!cond) ok = false;
};

check("parse https", parseHttpUrlFromText("https://example.com/feed") === "https://example.com/feed");
check("parse uri-list line", parseHttpUrlFromText("https://a.com/x\n") === "https://a.com/x");
check("reject javascript", parseHttpUrlFromText("javascript:alert(1)") === null);
check("clipboard API typed", typeof readHttpLinkFromClipboard === "function");

if (!process.exitCode && !ok) process.exitCode = 1;
console.log(ok ? `cobalt-cherry ok (${n})` : "cobalt-cherry failed");
