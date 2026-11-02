import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { greetingEnabled, setGreetingEnabled } from "../hooks/useConversation";
import { accentLabel, getVoicePrefs, listEnglishVoices, setVoicePrefs, speechOutputSupported, useVoiceOutput } from "../hooks/useVoiceOutput";

/** Settings: choose Iris's voice and speed (saved on this device). */
export function VoicePicker() {
  const voice = useVoiceOutput();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => listEnglishVoices());
  const [name, setName] = useState<string>(() => getVoicePrefs().name ?? "");
  const [rate, setRate] = useState<number>(() => getVoicePrefs().rate);
  const [greet, setGreet] = useState<boolean>(() => greetingEnabled());

  // Voices load asynchronously (and change after you download new ones).
  useEffect(() => {
    if (!speechOutputSupported()) return;
    const load = () => setVoices(listEnglishVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  if (!speechOutputSupported()) return <p className="text-sm text-alfred-mist">This browser can't speak out loud.</p>;

  const preview = () => {
    voice.prime();
    voice.speak("Hey boss, it's Iris. This is how I'll sound.", { force: true });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-alfred-mist" htmlFor="iris-voice">
        Voice
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
          <option value="">Automatic (American female, e.g. Samantha)</option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} · {accentLabel(v.lang)}
            </option>
          ))}
        </select>
        <button type="button" className="btn-gold px-3" onClick={preview} aria-label="Preview Iris's voice">
          <Play className="h-4 w-4" />
        </button>
      </div>
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
      <p className="text-xs text-alfred-mist leading-relaxed">
        Want more natural voices? On iPhone: Settings → Accessibility → Spoken Content → Voices → English, then download an
        Enhanced or Premium voice (Ava, Zoe and Samantha sound best). Reopen IRIS and pick it here. Saved on this device only.
      </p>
    </div>
  );
}
