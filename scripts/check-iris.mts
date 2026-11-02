// Iris brain check: runs runIris against a local stand-in for the Claude API
// (web search with a pause_turn, then a cited answer). No network or API key.
import http from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { runIris } from "../netlify/functions/_iris.ts";

const seen: any[] = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const j = JSON.parse(body);
    seen.push({ path: req.url, beta: req.headers["anthropic-beta"], j });
    const base = { id: `msg_${seen.length}`, type: "message", role: "assistant", model: j.model, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } };
    const out =
      seen.length === 1
        ? { ...base, stop_reason: "pause_turn", content: [
            { type: "server_tool_use", id: "srvtoolu_1", name: "web_search", input: { query: "Warriors score last night" } },
            { type: "web_search_tool_result", tool_use_id: "srvtoolu_1", content: [{ type: "web_search_result", url: "https://www.nba.com/game", title: "Warriors beat Lakers", encrypted_content: "x", page_age: null }] },
          ] }
        : { ...base, stop_reason: "end_turn", content: [{ type: "text", text: "Per NBA.com, the **Warriors** beat the Lakers 118-112 ([recap](https://www.nba.com/game)). Want me to add the next game to your list?" }] };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(out));
  });
});
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as any).port;
const client = new Anthropic({ apiKey: "test", baseURL: `http://127.0.0.1:${port}`, maxRetries: 0 });
const r = await runIris(client, [{ role: "user", content: "did the Warriors win last night?" }], "It is Monday.");
server.close();

const ok = (name: string, cond: boolean) => { console.log(`${cond ? "✓" : "✗"} ${name}`); if (!cond) process.exitCode = 1; };
const first = seen[0].j;
ok("calls /v1/messages with the fallback beta", seen[0].path?.startsWith("/v1/messages") && String(seen[0].beta).includes("server-side-fallback-2026-07-01"));
ok("model claude-opus-5-5, low effort, fallbacks default", first.model === "claude-opus-5-5" && first.output_config?.effort === "low" && first.fallbacks === "default");
ok("tools: add_todo + web_search_20260209 + web_fetch_20260209", JSON.stringify(first.tools.map((t: any) => t.type ?? t.name)) === JSON.stringify(["add_todo", "web_search_20260209", "web_fetch_20260209"]));
ok("search located in Vallejo", first.tools[1].user_location?.city === "Vallejo");
ok("persona is cached; day notes are not", first.system[0].cache_control?.type === "ephemeral" && !first.system[1].cache_control);
ok("pause_turn → continued with the partial turn", seen.length === 2 && seen[1].j.messages.at(-1).role === "assistant" && seen[1].j.messages.at(-1).content[0].type === "server_tool_use");
ok("reports it searched", r.searched === true);
console.log("  spoken reply:", JSON.stringify(r.reply));
ok("no URLs, markdown or link stubs in what she says", !/https?:|\*\*|\]\(|\(recap\)/.test(r.reply) && /Per NBA.com, the Warriors beat the Lakers 118-112\. Want me/.test(r.reply));
if (process.exitCode) process.exit(1);
