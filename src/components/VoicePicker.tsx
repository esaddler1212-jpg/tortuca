import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { greetingEnabled, setGreetingEnabled } from "../hooks/useConversation";
import {
  accentLabel,
  getVoicePrefs,
  listEnglishVoices,
  setVoicePrefs,
  speechOutputSupported,
  useVoiceOutput,
} from "../hooks/useVoiceOutput";
import { irisVoiceOptionLabel, isRecommendedIrisVoice } from "../../shared/irisVoices";

/** Settings: choose Iris's voice, speed, and pitch (saved on this device). */
export function VoicePicker() {
  const voice = useVoiceOutput();
  const [showAll, setShowAll] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => listEnglishVoices());
  const [name, setName] = useState<string>(() => getVoicePrefs().name ?? "");
  const [rate, setRate] = useState<number>(() => getVoicePrefs().rate);
  const [pitch, setPitch] = useState<number>(() => getVoicePrefs().pitch);
  const [greet, setGreet] = useState<boolean>(() => greetingEnabled());

  useEffect(() => {
    if (!speechOutputSupported()) return;
    const load = () => setVoices(listEnglishVoices({ includeMale: showAll }));
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, [showAll]);

  const { recommended, other } = useMemo(() => {
    const rec: SpeechSynthesisVoice[] = [];
    const rest: SpeechSynthesisVoice[] = [];
    for (const v of voices) {
      (isRecommendedIrisVoice(v.name) ? rec : rest).push(v);
    }
    return { recommended: rec, other: rest };
  }, [voices]);

  if (!speechOutputSupported()) return <p className="text-sm text-alfred-mist">This browser can&apos;t speak out loud.</p>;

  const preview = () => {
    voice.prime();
    voice.speak("Hey boss, it's Iris. This is how I'll sound on this device.", { force: true });
  };

  const voiceOptions = (list: SpeechSynthesisVoice[]) =>
    list.map((v) => (
      <option key={v.name} value={v.name}>
        {irisVoiceOptionLabel(v, accentLabel(v.lang))}
      </option>
    ));

  return (
    <div className="space-y-3">
      <label className="block text-sm text-alfred-mist" htmlFor="iris-voice">
        Voice ({voices.length} on this device)
      </label>
      <div className="flex gap-2">
        <select
          id="iris-voice"
          className="input-field flex-1"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setVoicePrefs({ name: e.target.value || null });
          }}
        >
          <option value="">Automatic — best US English female on this device</option>
          {recommended.length > 0 && (
            <optgroup label="Recommended for Iris">
              {voiceOptions(recommended)}
            </optgroup>
          )}
          {other.length > 0 && (
            <optgroup label={recommended.length ? "More English voices" : "English voices"}>
              {voiceOptions(other)}
            </optgroup>
          )}
        </select>
        <button type="button" className="btn-gold px-3" onClick={preview} aria-label="Preview Iris's voice">
          <Play className="h-4 w-4" />
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-alfred-mist">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        Show all English voices (including male system voices)
      </label>
      <label className="block text-sm text-alfred-mist" htmlFor="iris-rate">
        Speed: {rate.toFixed(2)}×
      </label>
      <input
        id="iris-rate"
        type="range"
        min={0.8}
        max={1.25}
        step={0.05}
        value={rate}
        onChange={(e) => {
          const r = Number(e.target.value);
          setRate(r);
          setVoicePrefs({ rate: r });
        }}
        className="w-full accent-current"
      />
      <label className="block text-sm text-alfred-mist" htmlFor="iris-pitch">
        Pitch: {pitch.toFixed(2)}×
      </label>
      <input
        id="iris-pitch"
        type="range"
        min={0.85}
        max={1.15}
        step={0.05}
        value={pitch}
        onChange={(e) => {
          const p = Number(e.target.value);
          setPitch(p);
          setVoicePrefs({ pitch: p });
        }}
        className="w-full accent-current"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={greet}
          onChange={(e) => {
            setGreet(e.target.checked);
            setGreetingEnabled(e.target.checked);
          }}
        />
        Greet me when I open IRIS (brief, or something else?)
      </label>
      <div className="text-xs text-alfred-mist leading-relaxed space-y-2">
        <p>
          Iris uses your phone or computer&apos;s built-in voices — not a single cloud voice. Tap Preview after you change
          voice, speed, or pitch.
        </p>
        <p>
          <strong className="text-alfred-cream/90">iPhone / iPad:</strong> Settings → Accessibility → Spoken Content →
          Voices → English — download <strong>Enhanced</strong> or <strong>Premium</strong> (Ava, Zoe, Samantha, Nicky).
          Reopen IRIS and pick them under Recommended.
        </p>
        <p>
          <strong className="text-alfred-cream/90">Mac:</strong> System Settings → Accessibility → Spoken Content → System
          voice — same Enhanced voices appear here.
        </p>
        <p>
          <strong className="text-alfred-cream/90">Chrome / Android:</strong> use Google voices listed in the menu; quality
          varies by device.
        </p>
      </div>
    </div>
  );
}
