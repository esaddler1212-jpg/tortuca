import { useState } from "react";
import { Mic, MicOff, MessageSquare, Send, Terminal, Volume2, VolumeX } from "lucide-react";
import { useVoiceOutput } from "../hooks/useVoiceOutput";
import { useSpeechInput } from "../hooks/useSpeechInput";
import type { UserSettings } from "../types";
import type { LeaveByPlan } from "../lib/leaveBy";
import type { BedtimePlan } from "../lib/bedtime";
import { parseCommand } from "../lib/commandParser";
import type { WorkoutType } from "../lib/fitness";

interface Props {
  settings: UserSettings;
  leaveBy: LeaveByPlan | null;
  bedtime: BedtimePlan | null;
  onAddTodo: (title: string, dueDate?: string) => void;
  onLogWorkout: (type: WorkoutType) => void;
  onAddEvent: (title: string, start: string, end?: string) => void;
  onAddShopping: (name: string, inPantry?: boolean) => void;
  /** "hud" renders the pill-shaped console prompt under the core ring. */
  variant?: "panel" | "hud";
}

export function CommandBar({
  settings,
  leaveBy,
  bedtime,
  onAddTodo,
  onLogWorkout,
  onAddEvent,
  onAddShopping,
  variant = "panel",
}: Props) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const voiceOut = useVoiceOutput();

  const run = (input: string = text) => {
    if (!input.trim()) return;
    const cmd = parseCommand(input, settings, leaveBy, bedtime);
    switch (cmd.kind) {
      case "todo":
        onAddTodo(cmd.title, cmd.dueDate);
        break;
      case "fitness":
        onLogWorkout(cmd.type);
        break;
      case "shopping":
        onAddShopping(cmd.name, cmd.inPantry);
        break;
      case "event": {
        const start = new Date(cmd.start);
        const end = new Date(start.getTime() + 2 * 60 * 60_000);
        onAddEvent(cmd.title, cmd.start, end.toISOString());
        break;
      }
      case "reply":
      case "noop":
        break;
    }
    setFeedback(cmd.message);
    voiceOut.speak(cmd.message); // Iris answers out loud (unless muted)
    setText("");
    setTimeout(() => setFeedback(null), 6000);
  };

  // Speak a command: the transcript runs as soon as you stop talking.
  const voice = useSpeechInput((spoken) => {
    setText(spoken);
    run(spoken);
  });
  const shownText = voice.listening ? voice.interim : text;

  const speakerButton = (className: string) =>
    voiceOut.supported ? (
      <button
        type="button"
        className={className}
        onClick={() => voiceOut.setMuted(!voiceOut.muted)}
        aria-label={voiceOut.muted ? "Turn Iris's voice on" : "Mute Iris's voice"}
        aria-pressed={!voiceOut.muted}
        title={voiceOut.muted ? "Iris's voice is off" : "Iris answers out loud"}
      >
        {voiceOut.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    ) : null;

  const micButton = (className: string) => (
    <button
      type="button"
      className={className}
      onClick={() => {
        voiceOut.prime(); // unlock speech on iPhone inside this tap
        if (voice.listening) voice.stop();
        else voice.start();
      }}
      aria-label={voice.listening ? "Stop listening" : "Speak a command"}
      aria-pressed={voice.listening}
      title={voice.supported ? "Speak a command" : "Voice input not supported here"}
    >
      {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );

  if (variant === "hud") {
    return (
      <section className="mx-auto w-full max-w-md">
        <form
          className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/30 pl-4 pr-1 py-0.5 shadow-hud focus-within:border-cyan-300"
          onSubmit={(e) => {
            e.preventDefault();
            voiceOut.prime();
            run();
          }}
        >
          <Terminal className="h-4 w-4 text-cyan-300 shrink-0" aria-hidden />
          <label htmlFor="alfred-command" className="sr-only">
            Command
          </label>
          <input
            id="alfred-command"
            className="h-11 flex-1 min-w-0 bg-transparent font-mono text-sm uppercase tracking-[0.2em] text-cyan-100 placeholder:text-cyan-300/70 focus:outline-none"
            placeholder={voice.listening ? "Listening..." : "Awaiting command..."}
            value={shownText}
            onChange={(e) => setText(e.target.value)}
          />
          {speakerButton("flex h-11 w-11 items-center justify-center rounded-full text-cyan-300/70 hover:bg-cyan-400/15")}
          {micButton(
            `flex h-11 w-11 items-center justify-center rounded-full hover:bg-cyan-400/15 ${voice.listening ? "text-black bg-cyan-300 animate-hud-pulse" : "text-cyan-300"}`,
          )}
          <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-full text-cyan-300 hover:bg-cyan-400/15" aria-label="Run command">
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-cyan-400/40">
          🎤 or type · “buy chicken” · “leave by” · “bedtime”
        </p>
        {voice.error && <p className="mt-2 text-center text-xs text-amber-300/90">{voice.error}</p>}
        {feedback && (
          <p className="mt-2 text-center font-mono text-sm text-cyan-200">IRIS: {feedback}</p>
        )}
      </section>
    );
  }

  return (
    <section className="panel-hud p-4">
      <label className="hud-label flex items-center gap-1.5 mb-2" htmlFor="alfred-command">
        <MessageSquare className="h-3.5 w-3.5" /> Voice command
      </label>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          voiceOut.prime();
          run();
        }}
      >
        <input
          id="alfred-command"
          className="input-field flex-1"
          placeholder={voice.listening ? "Listening…" : '“buy chicken”, “log legs”, “leave by”, “bedtime”, “what can I make”'}
          value={shownText}
          onChange={(e) => setText(e.target.value)}
        />
        {speakerButton("btn-ghost px-2")}
        {micButton(`btn-gold px-3 ${voice.listening ? "animate-hud-pulse" : ""}`)}
        <button type="submit" className="btn-gold px-4" aria-label="Run command">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {voice.error && <p className="text-xs text-amber-300/90 mt-2">{voice.error}</p>}
      {feedback && (
        <p className="text-sm text-alfred-mist mt-2 font-mono border-l-2 border-cyan-400/40 pl-3">
          IRIS: {feedback}
        </p>
      )}
    </section>
  );
}
