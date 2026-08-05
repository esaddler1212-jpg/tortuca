import type { Handler } from "@netlify/functions";

interface DistanceMatrixResponse {
  rows?: Array<{
    elements?: Array<{
      status: string;
      duration?: { value: number; text: string };
      distance?: { value: number; text: string };
    }>;
  }>;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const origin = event.queryStringParameters?.origin?.trim();
  const destination = event.queryStringParameters?.destination?.trim();
  if (!origin || !destination) {
    return { statusCode: 400, body: JSON.stringify({ error: "origin and destination required" }) };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true, minutes: null, message: "Add GOOGLE_MAPS_API_KEY for live commute" }),
    };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    return { statusCode: 502, body: JSON.stringify({ error: "Distance Matrix API error" }) };
  }

  const data = (await res.json()) as DistanceMatrixResponse;
  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK" || !element.duration) {
    return { statusCode: 422, body: JSON.stringify({ error: "Could not calculate route", status: element?.status }) };
  }

  const minutes = Math.max(1, Math.ceil(element.duration.value / 60));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      minutes,
      durationText: element.duration.text,
      distanceText: element.distance?.text,
      fetchedAt: new Date().toISOString(),
    }),
  };
};
