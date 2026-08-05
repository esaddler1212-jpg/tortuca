import { useState } from "react";
import { Check, ListTodo, Plus, Trash2 } from "lucide-react";

interface Todo {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
}

interface Props {
  pending: Todo[];
  done: Todo[];
  onAdd: (title: string, dueDate?: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TodoPanel({ pending, done, onAdd, onToggle, onRemove }: Props) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, due || undefined);
    setTitle("");
    setDue("");
  };

  return (
    <section className="panel p-5">
      <header className="mb-4 flex items-center gap-2 text-alfred-gold">
        <ListTodo className="h-5 w-5" aria-hidden />
        <h2 className="font-display text-xl font-semibold tracking-wide">To-do list</h2>
      </header>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          className="input-field flex-1"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New task"
        />
        <input
          type="date"
          className="input-field sm:w-36"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
        />
        <button type="submit" className="btn-gold shrink-0">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
      <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {pending.length === 0 && (
          <li className="text-sm text-alfred-mist py-2">Nothing pending — well done.</li>
        )}
        {pending.map((t) => (
          <li
            key={t.id}
            className="flex items-start gap-2 rounded-lg border border-alfred-border/60 bg-alfred-ink/40 px-3 py-2"
          >
            <button
              type="button"
              onClick={() => onToggle(t.id)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border border-alfred-border hover:border-alfred-gold"
              aria-label={`Mark ${t.title} done`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{t.title}</p>
              {t.dueDate && (
                <p className="text-xs text-alfred-mist">Due {t.dueDate}</p>
              )}
            </div>
            <button type="button" className="btn-ghost p-1" onClick={() => onRemove(t.id)} aria-label="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <details className="mt-4 text-sm text-alfred-mist">
          <summary className="cursor-pointer hover:text-alfred-cream">
            Completed ({done.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {done.map((t) => (
              <li key={t.id} className="flex items-center gap-2 opacity-70">
                <button
                  type="button"
                  onClick={() => onToggle(t.id)}
                  className="h-5 w-5 shrink-0 rounded bg-alfred-gold/20 border border-alfred-gold flex items-center justify-center"
                  aria-label={`Mark ${t.title} not done`}
                >
                  <Check className="h-3 w-3 text-alfred-gold" />
                </button>
                <span className="line-through">{t.title}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
