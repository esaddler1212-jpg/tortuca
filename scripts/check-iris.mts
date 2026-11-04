// Iris brain check: runs runIris against a local stand-in for the Claude API
// (web search with a pause_turn, then a cited answer). No network or API key.
import http from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { matchesForget, runIris, safeFact } from "../netlify/functions/_iris.ts";

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
const toolIds = first.tools.map((t: any) => t.type ?? t.name);
ok("tools: add_todo, open_planet, memory, web_search_20260209, web_fetch_20260209", ["add_todo", "open_planet", "remember", "forget", "web_search_20260209", "web_fetch_20260209"].every((t) => toolIds.includes(t)));
ok("track_flight only offered when the server can run it", !toolIds.includes("track_flight"));
ok("search located in Vallejo", first.tools.find((t: any) => t.type === "web_search_20260209")?.user_location?.city === "Vallejo");
ok("persona is cached; day notes are not", first.system[0].cache_control?.type === "ephemeral" && !first.system[1].cache_control);
ok("pause_turn → continued with the partial turn", seen.length === 2 && seen[1].j.messages.at(-1).role === "assistant" && seen[1].j.messages.at(-1).content[0].type === "server_tool_use");
ok("reports it searched", r.searched === true);
console.log("  spoken reply:", JSON.stringify(r.reply));
ok("no URLs, markdown or link stubs in what she says", !/https?:|\*\*|\]\(|\(recap\)/.test(r.reply) && /Per NBA.com, the Warriors beat the Lakers 118-112\. Want me/.test(r.reply));

// ── memory: Iris remembers lasting facts (and never sensitive ones)
const seen2: any[] = [];
const server2 = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const j = JSON.parse(body);
    seen2.push(j);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: j.model, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: "tool_use", content: [
      { type: "tool_use", id: "t1", name: "remember", input: { fact: "E meets the $BAY sponsor every other Thursday" } },
      { type: "tool_use", id: "t2", name: "remember", input: { fact: "E's bank PIN is 4821" } },
      { type: "tool_use", id: "t3", name: "forget", input: { about: "the gym schedule" } },
    ] }));
  });
});
await new Promise<void>((r) => server2.listen(0, r));
const client2 = new Anthropic({ apiKey: "test", baseURL: `http://127.0.0.1:${(server2.address() as any).port}`, maxRetries: 0 });
const m = await runIris(client2, [{ role: "user", content: "remember I meet the $BAY sponsor every other Thursday" }], "", ["E likes short briefs"]);
server2.close();
const tools2 = seen2[0].tools.map((t: any) => t.name);
ok("memory tools offered (remember, forget)", tools2.includes("remember") && tools2.includes("forget"));
ok("remembered facts reach Iris (uncached block)", /What you remember about E:\n- E likes short briefs/.test(seen2[0].system[2]?.text ?? "") && !seen2[0].system[2]?.cache_control);
ok("keeps the lasting fact", JSON.stringify(m.remember) === JSON.stringify(["E meets the $BAY sponsor every other Thursday"]));
ok("refuses to store a PIN", !m.remember.some((f) => /PIN/.test(f)));
ok("passes the forget request", m.forget[0] === "the gym schedule");
ok("safeFact blocks card numbers and passwords", safeFact("card 4111 1111 1111 1111") === null && safeFact("my password is hunter2") === null && safeFact("E likes short briefs") !== null);
ok("forget matches by meaning words", matchesForget("E trains legs on Thursday at the gym", "the gym schedule") && !matchesForget("E likes short briefs", "the gym schedule"));

// ── flight tracking: Iris calls track_flight, gets the live data back, then answers
const seen3: any[] = [];
const server3 = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const j = JSON.parse(body);
    seen3.push(j);
    const base = { id: `m${seen3.length}`, type: "message", role: "assistant", model: j.model, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } };
    const out =
      seen3.length === 1
        ? { ...base, stop_reason: "tool_use", content: [{ type: "tool_use", id: "tf1", name: "track_flight", input: { flight: "UA 123" } }] }
        : { ...base, stop_reason: "end_turn", content: [{ type: "text", text: "United 123 is cruising at 36,000 feet and should land around 12:32, boss." }] };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(out));
  });
});
await new Promise<void>((r) => server3.listen(0, r));
const client3 = new Anthropic({ apiKey: "test", baseURL: `http://127.0.0.1:${(server3.address() as any).port}`, maxRetries: 0 });
const asked: string[] = [];
const f = await runIris(client3, [{ role: "user", content: "where's UA 123?" }], "", [], {
  trackFlight: async (q) => {
    asked.push(q);
    return "United 123 from Chicago to San Francisco is at 36000 feet. Estimated landing around 12:32 PM.";
  },
});
server3.close();
ok("track_flight offered when available", seen3[0].tools.some((t: any) => t.name === "track_flight"));
ok("runs the lookup with what E said", asked[0] === "UA 123");
const back = seen3[1]?.messages.at(-1);
ok("hands the flight data back as a tool_result", back?.role === "user" && back.content[0].type === "tool_result" && back.content[0].tool_use_id === "tf1" && /36000 feet/.test(back.content[0].content));
ok("answers from it", /United 123 is cruising/.test(f.reply));
ok("usage: adds up tokens across hops", r.usage.hops === 2 && r.usage.inTok === 20 && r.usage.outTok === 20);
ok("usage: records tool names, never words", JSON.stringify(f.usage.tools) === JSON.stringify(["track_flight"]) && !JSON.stringify(f.usage).includes("UA 123"));
if (process.exitCode) process.exit(1);
