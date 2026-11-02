import { useState } from "react";
import { loadAllCheckIns, loadStudentNotes } from "./storage";
import { addStudentNote, deleteStudentNote, studentMemory } from "./memory";

/**
 * Shown when you start logging a student you've seen before: patterns from
 * their check-ins plus your private notes. Stays on this device and in your
 * backup; never shared in reports or sent to IRIS or any AI.
 */
export default function StudentMemoryCard({ name }: { name: string }) {
  const [version, setVersion] = useState(0);
  const [draft, setDraft] = useState("");
  void version; // re-read storage after each change
  const memory = studentMemory(name, loadAllCheckIns(), loadStudentNotes());

  const save = () => {
    if (addStudentNote(name, draft)) {
      setDraft("");
      setVersion((v) => v + 1);
    }
  };

  return (
    <section className="memory-card" aria-label={`Memory for ${name}`}>
      <p className="memory-title">Memory · {name}</p>
      {memory.patterns.length > 0 && (
        <ul className="memory-patterns">
          {memory.patterns.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {memory.notes.length > 0 && (
        <ul className="memory-notes">
          {memory.notes.map((n) => (
            <li key={n.id}>
              <span>{n.text}</span>
              <button
                type="button"
                className="memory-delete"
                onClick={() => {
                  deleteStudentNote(n.id);
                  setVersion((v) => v + 1);
                }}
                aria-label={`Delete note: ${n.text}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="memory-add">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          placeholder="Add a note to remember (what works, who to call…)"
          aria-label={`Note about ${name}`}
          maxLength={500}
        />
        <button type="button" className="memory-save" onClick={save} disabled={!draft.trim()}>
          Remember
        </button>
      </div>
      <p className="memory-private">Private to you · not in reports · never sent to IRIS or AI</p>
    </section>
  );
}
