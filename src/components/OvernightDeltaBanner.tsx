import { Sparkles } from "lucide-react";
import type { OvernightDelta } from "../lib/overnightDelta";

interface Props {
  delta: OvernightDelta;
}

export function OvernightDeltaBanner({ delta }: Props) {
  if (delta.isFirstVisit && delta.lines.length <= 1) {
    return (
      <section className="panel px-4 py-3 border-cyan-400/30 bg-cyan-950/20">
        <p className="hud-label flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> {delta.headline}
        </p>
        <p className="text-sm text-alfred-mist mt-1">{delta.lines[0]}</p>
      </section>
    );
  }

  return (
    <section className="panel px-4 py-3 border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-transparent">
      <p className="hud-label flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" /> {delta.headline}
      </p>
      <p className="text-sm text-alfred-cream mt-1.5 leading-relaxed">
        {delta.lines.join(" ")}
      </p>
    </section>
  );
}
