import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { OvercommitmentWarning } from "../lib/overcommitment";

interface Props {
  warning: OvercommitmentWarning;
}

export function OvercommitmentBanner({ warning }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [warning.message, warning.reasons.join("|")]);

  if (dismissed) return null;

  return (
    <section
      className={`panel px-4 py-3 flex items-start gap-3 ${
        warning.level === "heavy"
          ? "border-amber-400/40 bg-amber-400/5"
          : "border-alfred-gold/30 bg-alfred-gold/5"
      }`}
    >
      <AlertTriangle
        className={`h-4 w-4 shrink-0 mt-0.5 ${
          warning.level === "heavy" ? "text-amber-300" : "text-alfred-gold"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-alfred-cream font-medium">{warning.message}</p>
        <p className="text-xs text-alfred-mist mt-1">{warning.reasons.join(" · ")}</p>
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
