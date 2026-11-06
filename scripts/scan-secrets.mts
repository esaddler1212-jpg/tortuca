#!/usr/bin/env npx tsx
/**
 * Run gitleaks when available; otherwise print a skip message and exit 0 so CI
 * and local dev aren't blocked, but `npm run scan:secrets` never silently no-ops
 * as success when gitleaks is missing (the shell used to exit 0 on "not found").
 */
import { spawnSync } from "node:child_process";

const cfg = ".gitleaks.toml";

function gitleaksOk(): boolean {
  const r = spawnSync("gitleaks", ["version"], { encoding: "utf8" });
  return r.status === 0;
}

function run(args: string[]): void {
  const r = spawnSync("gitleaks", args, { stdio: "inherit" });
  process.exit(r.status === null ? 1 : r.status);
}

if (!gitleaksOk()) {
  console.log(
    "[scan:secrets] gitleaks not found — install from https://github.com/gitleaks/gitleaks/releases or use `brew install gitleaks`. Skipping scan.",
  );
  process.exit(0);
}

run(["git", ".", "--config", cfg, "--redact", "--no-banner"]);
run(["dir", ".", "--config", cfg, "--redact", "--no-banner"]);
