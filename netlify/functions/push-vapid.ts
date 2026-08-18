import type { Handler } from "@netlify/functions";
import { vapidPublicKey } from "./_push";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: vapidPublicKey() }),
  };
};
