/** Herald-derived speech helpers — run via npm run test:speech */
import { sanitizeForSpeech, SentenceChunker, isNoiseTranscript, isStopPhrase } from "../shared/speechText.ts";

let n = 0;
const ok = (label: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${label}`);
  if (!cond) process.exitCode = 1;
};

ok("sanitize strips markdown", !sanitizeForSpeech("## Hi\n**bold**").includes("#") && sanitizeForSpeech("## Hi\n**bold**").includes("bold"));
ok("sanitize strips URLs", !sanitizeForSpeech("see https://x.com").includes("https"));
ok("chunker yields sentence", new SentenceChunker().feed("Hello. Wait")[0] === "Hello.");
ok("noise transcript", isNoiseTranscript("uh") && !isNoiseTranscript("leave by 7"));
ok("stop phrase iris", isStopPhrase("thanks iris"));
ok("stop phrase not partial", !isStopPhrase("thanks iris for the brief"));

console.log(process.exitCode ? `speech-text failed (${n})` : `speech-text passed (${n}).`);
