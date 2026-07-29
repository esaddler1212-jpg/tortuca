import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { handleApiRequest } from "./shared/api-router";

function devApiPlugin(): Plugin {
  return {
    name: "easy-supply-api",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) return next();
        const pathname = url.split("?")[0] ?? url;
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", async () => {
          try {
            const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;
            const result = await handleApiRequest(req.method ?? "GET", pathname, body);
            res.setHeader("Content-Type", "application/json");
            res.statusCode = result.status;
            res.end(JSON.stringify(result.body));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
