import { useState } from "react";
import { Check, Copy, ExternalLink, Sparkles, X } from "lucide-react";
import { claudeLink } from "../lib/promptGenerator";

/**
 * "Prompt" chip: opens a ready-to-paste Claude prompt for this item, with
 * Copy and Open-in-Claude. The prompt is built only when opened.
 */
/**
 * `onUsed` runs when the dialog closes after the prompt was copied or opened
 * in Claude (e.g. to move a task to "With Claude" without closing the dialog early).
 */
export function PromptButton({ build, label = "Prompt", onUsed }: { build: () => string; label?: string; onUsed?: () => void }) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [used, setUsed] = useState(false);
  const close = () => {
    setPrompt(null);
    if (used) onUsed?.();
    setUsed(false);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: select-and-copy fallback.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setUsed(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-alfred-gold/30 px-3 text-[11px] font-mono uppercase tracking-wider text-alfred-gold hover:bg-alfred-gold/10"
        onClick={() => setPrompt(build())}
        aria-label={`${label}: open a Claude prompt for this`}
      >
        <Sparkles className="h-3 w-3" aria-hidden /> {label}
      </button>
      {prompt !== null && (
        <div onClick={(e) => e.target === e.currentTarget && close()} className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-3" role="dialog" aria-modal aria-label="Claude prompt">
          <div className="panel-hud w-full max-w-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="hud-label flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Prompt for Claude
              </p>
              <button type="button" className="btn-ghost p-1.5" onClick={close} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              className="input-field h-64 resize-none text-xs leading-relaxed"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              aria-label="Prompt text (you can edit it)"
            />
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-gold flex-1" onClick={() => void copy(prompt)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a className="btn-ghost flex-1 border border-alfred-gold/30" href={claudeLink(prompt)} target="_blank" rel="noreferrer" onClick={() => setUsed(true)}>
                <ExternalLink className="h-4 w-4" /> Open in Claude
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
