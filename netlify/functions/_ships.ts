import { BAY_BOX, parseAisMessages, type Ship } from "../../shared/ships";

let shipCache: { at: number; ships: Ship[] } | null = null;

/**
 * Listen to AISStream for a few seconds and return the ships it heard in the
 * Bay. Needs AISSTREAM_API_KEY (free at aisstream.io). Returns undefined when
 * no key is set, so the card can say how to turn ships on.
 */
export async function bayShips(listenMs = 6000): Promise<Ship[] | undefined> {
  const key = process.env.AISSTREAM_API_KEY?.trim();
  if (!key) return undefined;
  if (shipCache && Date.now() - shipCache.at < 120_000) return shipCache.ships;
  const WS = (globalThis as { WebSocket?: typeof WebSocket }).WebSocket;
  if (!WS) throw new Error("WebSocket not available");

  const messages: unknown[] = await new Promise((resolve, reject) => {
    const got: unknown[] = [];
    const ws = new WS("wss://stream.aisstream.io/v0/stream");
    const finish = () => {
      try {
        ws.close();
      } catch {
        /* already closed */
      }
      resolve(got);
    };
    const timer = setTimeout(finish, listenMs);
    ws.onopen = () =>
      ws.send(
        JSON.stringify({
          APIKey: key,
          BoundingBoxes: [BAY_BOX],
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        }),
      );
    ws.onmessage = async (ev: MessageEvent) => {
      try {
        const text = typeof ev.data === "string" ? ev.data : await new Response(ev.data as Blob).text();
        const msg = JSON.parse(text);
        if (msg?.error) {
          clearTimeout(timer);
          ws.close();
          reject(new Error(String(msg.error)));
          return;
        }
        got.push(msg);
      } catch {
        /* skip a bad frame */
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      if (got.length) resolve(got);
      else reject(new Error("AISStream connection failed"));
    };
  });

  const ships = parseAisMessages(messages);
  shipCache = { at: Date.now(), ships };
  return ships;
}
