import { useCallback, useEffect, useState } from "react";
import type { TodoItem } from "../types";
import { loadJson, saveJson, TODOS_KEY } from "../lib/storage";

function newId(): string {
  return crypto.randomUUID();
}

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    loadJson<TodoItem[]>(TODOS_KEY, []),
  );

  useEffect(() => {
    saveJson(TODOS_KEY, todos);
  }, [todos]);

  const add = useCallback((title: string, dueDate?: string) => {
    setTodos((prev) => [
      {
        id: newId(),
        title: title.trim(),
        done: false,
        dueDate,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const toggle = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const done = !t.done;
        return {
          ...t,
          done,
          completedAt: done ? new Date().toISOString() : undefined,
        };
      }),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return { todos, pending, done, add, toggle, remove };
}
