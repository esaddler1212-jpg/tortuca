import type { HealthSignal } from "../../shared/types";

const styles: Record<HealthSignal["severity"], string> = {
  good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  watch: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  action: "border-rose-500/40 bg-rose-500/10 text-rose-100",
};

export function HealthCard({ signal }: { signal: HealthSignal }) {
  return (
    <div className={`rounded-xl border p-4 ${styles[signal.severity]}`}>
      <p className="font-medium">{signal.title}</p>
      <p className="mt-1 text-sm opacity-80">{signal.detail}</p>
    </div>
  );
}
