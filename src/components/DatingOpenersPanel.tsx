import { useCallback, useMemo, useState } from "react";
import { Copy, Heart, RefreshCw, Sparkles } from "lucide-react";
import {
  type OpenerChannel,
  type OpenerContext,
  type OpenerEnergy,
  type OpenerTone,
  generateOpenerLine,
  getChannelHint,
} from "../lib/datingOpeners";

const TONES: { value: OpenerTone; label: string }[] = [
  { value: "playful", label: "Playful" },
  { value: "warm", label: "Warm" },
  { value: "witty", label: "Witty" },
  { value: "direct", label: "Direct" },
  { value: "curious", label: "Curious" },
];

const ENERGIES: { value: OpenerEnergy; label: string }[] = [
  { value: "chill", label: "Chill" },
  { value: "upbeat", label: "Upbeat" },
  { value: "bold", label: "Bold" },
];

const CHANNELS: { value: OpenerChannel; label: string }[] = [
  { value: "generic", label: "Any app" },
  { value: "hinge", label: "Hinge" },
  { value: "bumble", label: "Bumble" },
  { value: "tinder", label: "Tinder" },
];

export function DatingOpenersPanel() {
  const [tone, setTone] = useState<OpenerTone>("warm");
  const [energy, setEnergy] = useState<OpenerEnergy>("chill");
  const [channel, setChannel] = useState<OpenerChannel>("generic");
  const [theirName, setTheirName] = useState("");
  const [detail, setDetail] = useState("");
  const [userName, setUserName] = useState("");
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const context: OpenerContext = useMemo(
    () => ({
      theirName: theirName || undefined,
      detail: detail || undefined,
      userName: userName || undefined,
    }),
    [theirName, detail, userName],
  );

  const line = useMemo(
    () =>
      generateOpenerLine(
        { tone, energy, channel, seed },
        context,
      ),
    [tone, energy, channel, seed, context],
  );

  const hint = useMemo(() => getChannelHint(channel), [channel]);

  const regenerate = useCallback(() => {
    setSeed((s) => s + 1);
    setCopied(false);
  }, []);

  const copyLine = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(line);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [line]);

  return (
    <section className="panel p-5 border-alfred-border/80" aria-labelledby="dating-openers-heading">
      <h3 id="dating-openers-heading" className="font-display text-lg text-alfred-gold mb-1 flex items-center gap-2">
        <Heart className="h-4 w-4 text-rose-400/90" aria-hidden />
        Opening lines
        <span className="text-xs font-normal text-alfred-mist normal-case tracking-normal">
          (dating apps)
        </span>
      </h3>
      <p className="text-xs text-alfred-mist mb-4">
        Pick a tone and vibe, add one detail from their profile (or leave blank for placeholders), then generate and copy.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-alfred-mist mb-1.5">Tone</p>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTone(value);
                    setCopied(false);
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    tone === value
                      ? "border-rose-400/50 bg-rose-500/10 text-rose-100"
                      : "border-alfred-border/60 hover:border-rose-400/25 text-alfred-mist"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-alfred-mist mb-1.5">Energy</p>
            <div className="flex flex-wrap gap-1.5">
              {ENERGIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setEnergy(value);
                    setCopied(false);
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    energy === value
                      ? "border-alfred-gold/50 bg-alfred-gold/10 text-alfred-gold"
                      : "border-alfred-border/60 hover:border-alfred-gold/25 text-alfred-mist"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-alfred-mist mb-1.5">App</p>
            <select
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value as OpenerChannel);
                setCopied(false);
              }}
              className="w-full rounded-lg border border-alfred-border/60 bg-alfred-ink/60 px-3 py-2 text-sm text-alfred-cream focus:border-alfred-gold/50 focus:outline-none"
            >
              {CHANNELS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="opener-their-name" className="text-xs uppercase tracking-wider text-alfred-mist mb-1 block">
              Their first name <span className="text-alfred-mist/70 normal-case">(optional)</span>
            </label>
            <input
              id="opener-their-name"
              type="text"
              autoComplete="given-name"
              placeholder="Alex"
              value={theirName}
              onChange={(e) => setTheirName(e.target.value)}
              className="w-full rounded-lg border border-alfred-border/60 bg-alfred-ink/60 px-3 py-2 text-sm text-alfred-cream placeholder:text-alfred-mist/50 focus:border-alfred-gold/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="opener-detail" className="text-xs uppercase tracking-wider text-alfred-mist mb-1 block">
              Profile detail <span className="text-alfred-mist/70 normal-case">(hobby, prompt, photo)</span>
            </label>
            <input
              id="opener-detail"
              type="text"
              placeholder="e.g. hiking in Patagonia, sourdough era, vinyl collection"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="w-full rounded-lg border border-alfred-border/60 bg-alfred-ink/60 px-3 py-2 text-sm text-alfred-cream placeholder:text-alfred-mist/50 focus:border-alfred-gold/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="opener-user-name" className="text-xs uppercase tracking-wider text-alfred-mist mb-1 block">
              Your first name <span className="text-alfred-mist/70 normal-case">(optional)</span>
            </label>
            <input
              id="opener-user-name"
              type="text"
              autoComplete="given-name"
              placeholder="Only if a template uses it"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border border-alfred-border/60 bg-alfred-ink/60 px-3 py-2 text-sm text-alfred-cream placeholder:text-alfred-mist/50 focus:border-alfred-gold/50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-alfred-border/50 bg-alfred-ink/40 p-4">
        <p className="text-xs uppercase tracking-wider text-alfred-mist mb-2 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Suggested line
        </p>
        <p className="text-base text-alfred-cream/95 leading-relaxed mb-4" data-testid="dating-opener-line">
          {line}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={regenerate}
            className="inline-flex items-center gap-2 rounded-lg border border-alfred-gold/40 bg-alfred-gold/10 px-4 py-2 text-sm text-alfred-gold hover:bg-alfred-gold/15 transition-colors"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Another line
          </button>
          <button
            type="button"
            onClick={() => void copyLine()}
            className="inline-flex items-center gap-2 rounded-lg border border-alfred-border/60 px-4 py-2 text-sm text-alfred-cream hover:border-alfred-gold/30 transition-colors"
          >
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <p className="text-xs text-alfred-mist mt-3 border-t border-alfred-border/40 pt-3">{hint}</p>
    </section>
  );
}
