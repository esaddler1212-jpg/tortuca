import Anthropic from "@anthropic-ai/sdk";
import { clampIrisContext, TIER_A_SMS_DAILY_TURNS } from "../../shared/agentGuardrails";
import { runIris } from "./_iris";

export async function smsAskOneTurn(userText: string, context: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "IRIS SMS is offline — open the app.";
  const client = new Anthropic({ timeout: 45_000, maxRetries: 0 });
  const turns = [{ role: "user" as const, content: userText.slice(0, 500) }];
  const { reply, refused } = await runIris(client, turns, clampIrisContext(context), []);
  if (refused) return "I can't help with that one — open IRIS for more.";
  return reply.slice(0, 320) || "Got it.";
}

export { TIER_A_SMS_DAILY_TURNS };
