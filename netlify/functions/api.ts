import type { Handler, HandlerEvent } from "@netlify/functions";
import { handleApiRequest } from "../../shared/api-router";

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  try {
    let pathname = event.path;
    if (pathname.includes("/api/")) {
      pathname = pathname.slice(pathname.indexOf("/api/"));
    } else if (event.rawUrl) {
      const u = new URL(event.rawUrl);
      pathname = u.pathname;
    } else {
      pathname = "/api/metrics";
    }
    const result = await handleApiRequest(event.httpMethod, pathname, event.body ?? undefined);
    return json(result.status, result.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(500, { error: message });
  }
};
