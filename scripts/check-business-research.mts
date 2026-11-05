// Business Researcher check: pause_turn continuation must yield a report (like Iris).
import http from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { runBusinessResearch } from "../netlify/functions/_businessResearch.ts";

const seen: any[] = [];
const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const j = JSON.parse(body);
    seen.push({ path: req.url, j });
    const base = {
      id: `msg_${seen.length}`,
      type: "message",
      role: "assistant",
      model: j.model,
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10, server_tool_use: { web_search_requests: seen.length === 1 ? 1 : 0 } },
    };
    const out =
      seen.length === 1
        ? {
            ...base,
            stop_reason: "pause_turn",
            content: [
              { type: "server_tool_use", id: "srvtoolu_1", name: "web_search", input: { query: "Bay Area doc sponsors" } },
              {
                type: "web_search_tool_result",
                tool_use_id: "srvtoolu_1",
                content: [{ type: "web_search_result", url: "https://example.com", title: "Sponsors", encrypted_content: "x", page_age: null }],
              },
            ],
          }
        : {
            ...base,
            stop_reason: "end_turn",
            content: [
              {
                type: "text",
                text: "## Executive summary\n- One sponsor found\n\n## Sources\n- [Example](https://example.com)",
              },
            ],
          };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(out));
  });
});
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as { port: number }).port;
const client = new Anthropic({ apiKey: "test", baseURL: `http://127.0.0.1:${port}`, maxRetries: 0 });
const r = await runBusinessResearch(client, {
  query: "Who sponsors Bay Area YouTube doc series?",
  area: "Tortuga",
  context: "",
});
server.close();

const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

ok("calls messages API twice on pause_turn", seen.length === 2);
ok("second hop includes assistant partial", seen[1].j.messages.at(-1).role === "assistant");
ok("searched flag set", r.searched === true);
ok("report has executive summary", /Executive summary/i.test(r.report));
ok("not refused", !r.refused && r.report.length > 20);
