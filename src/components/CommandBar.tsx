import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import type { UserSettings } from "../types";
import type { LeaveByPlan } from "../lib/leaveBy";
import { parseCommand } from "../lib/commandParser";
import type { WorkoutType } from "../lib/fitness";

interface Props {
  settings: UserSettings;
  leaveBy: LeaveByPlan | null;
  onAddTodo: (title: string, dueDate?: string) => void;
  onLogWorkout: (type: WorkoutType) => void;
  onAddEvent: (title: string, start: string, end?: string) => void;
  onAddShopping: (name: string, inPantry?: boolean) => void;
}

export function CommandBar({
  settings,
  leaveBy,
  onAddTodo,
  onLogWorkout,
  onAddEvent,
  onAddShopping,
}: Props) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const run = () => {
    const cmd = parseCommand(text, settings, leaveBy);
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
    setText("");
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <section className="panel p-4 border-alfred-gold/25">
      <label className="text-xs uppercase tracking-wider text-alfred-gold flex items-center gap-1.5 mb-2" htmlFor="alfred-command">
        <MessageSquare className="h-3.5 w-3.5" /> Alfred, ...
      </label>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <input
          id="alfred-command"
          className="input-field flex-1"
          placeholder='“buy chicken”, “log legs”, “leave by”, “what can I make”'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-gold px-4" aria-label="Run command">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {feedback && (
        <p className="text-sm text-alfred-mist mt-2 italic font-display">— {feedback}</p>
      )}
    </section>
  );
}
