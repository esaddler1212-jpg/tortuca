import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

// Netlify's adapter resolves to different driver types at build vs runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: any = null;

export function getDb() {
  if (!process.env.NETLIFY_DB_URL) return null;
  if (!cached) {
    cached = drizzle({ schema });
  }
  return cached as ReturnType<typeof drizzle<typeof schema>>;
}

export { schema };
