import { format } from "date-fns";
import { Moon, X } from "lucide-react";
import { useState } from "react";
import type { BedtimePlan } from "../lib/bedtime";
import { isPastLightsOut } from "../lib/bedtime";

interface Props {
  bedtime: BedtimePlan;
}

export function WindDownBanner({ bedtime }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const now = new Date();
  const pastLights = isPastLightsOut(bedtime, now);

  if (dismissed) return null;

  return (
    <section
      className={`panel px-4 py-3 flex items-start gap-3 ${
        pastLights ? "border-amber-400/40 bg-amber-400/5" : "border-alfred-gold/40 bg-alfred-gold/10"
      }`}
    >
      <Moon className={`h-4 w-4 shrink-0 mt-0.5 ${pastLights ? "text-amber-300" : "text-alfred-gold"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-alfred-cream font-medium">
          {pastLights ? "Past lights-out" : "Wind-down time"}
        </p>
        <p className="text-xs text-alfred-mist mt-1">
          {pastLights
            ? `Target was ${format(bedtime.lightsOut, "h:mm a")} — rest when you can.`
            : `Lights out ${format(bedtime.lightsOut, "h:mm a")} · wake ${format(bedtime.wakeUp, "h:mm a")}`}
        </p>
        <p className="text-xs text-alfred-mist/70 mt-0.5">{bedtime.reason}</p>
      </div>
      <button
        type="button"
        className="btn-ghost p-1 shrink-0"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </section>
  );
}
