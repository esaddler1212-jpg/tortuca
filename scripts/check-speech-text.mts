/** Herald-derived speech helpers — run via npm run test:speech */
import {
  sanitizeForSpeech,
  SentenceChunker,
  chunkForSystemVoice,
  isNoiseTranscript,
  isStopPhrase,
} from "../shared/speechText.ts";
import { fastModuleNavigation, stripVoiceFillers } from "../shared/voiceIntents.ts";

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
ok("chunk first short", chunkForSystemVoice("Hello there. Second sentence here.")[0]!.length <= 210);
ok("strip fillers", stripVoiceFillers("Hey Iris, open inbox").toLowerCase().includes("open"));
ok("fast nav inbox", fastModuleNavigation("Hey Iris, open inbox") === "inbox");
ok("no fast nav heavy", fastModuleNavigation("open inbox and summarize") === null);

console.log(process.exitCode ? `speech-text failed (${n})` : `speech-text passed (${n}).`);
