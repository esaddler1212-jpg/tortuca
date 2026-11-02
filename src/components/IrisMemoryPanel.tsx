import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { authHeaders, ensureSession } from "../lib/google";

type Fact = { id: string; fact: string; at: string };

/** Settings: what Iris remembers about E, with delete. */
export function IrisMemoryPanel({ googleConnected }: { googleConnected: boolean }) {
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (method: "GET" | "DELETE", query = "") => {
    await ensureSession();
    const res = await fetch(`/api/iris-memory${query}`, { method, headers: authHeaders() });
    const data = (await res.json().catch(() => ({}))) as { facts?: Fact[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Couldn't load Iris's memory.");
    setFacts(data.facts ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    if (googleConnected) void call("GET").catch((e: Error) => setError(e.message));
  }, [googleConnected, call]);

  if (!googleConnected) return <p className="text-sm text-alfred-mist">Connect Google to see what Iris remembers.</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-alfred-mist">
        Tell Iris “remember…” and she keeps it for future conversations. Say “forget…” or delete it here. She never stores student details,
        passwords or account numbers.
      </p>
      {error && <p className="text-xs text-amber-300/90">{error}</p>}
      {facts && !facts.length && <p className="text-sm text-alfred-mist">Nothing yet.</p>}
      <ul className="space-y-1.5">
        {(facts ?? []).map((f) => (
          <li key={f.id} className="flex items-start justify-between gap-2 text-sm">
            <span>{f.fact}</span>
            <button
              type="button"
              className="btn-ghost p-1 shrink-0"
              onClick={() => void call("DELETE", `?id=${encodeURIComponent(f.id)}`).catch((e: Error) => setError(e.message))}
              aria-label={`Forget: ${f.fact}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {facts && facts.length > 1 && (
        <button
          type="button"
          className="text-[11px] text-alfred-mist underline"
          onClick={() => {
            if (window.confirm("Have Iris forget everything she remembers?")) void call("DELETE", "?all=1").catch((e: Error) => setError(e.message));
          }}
        >
          Forget everything
        </button>
      )}
    </div>
  );
}
