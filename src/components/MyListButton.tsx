"use client";

import { useMyList } from "@/hooks/useMyList";
import { cn } from "@/lib/utils";

interface MyListButtonProps {
  filmId: string;
  className?: string;
}

export function MyListButton({ filmId, className }: MyListButtonProps) {
  const { isInList, toggle, ready } = useMyList();
  const inList = isInList(filmId);

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => toggle(filmId)}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-zinc-400 disabled:opacity-50",
        inList && "border-accent text-accent",
        className,
      )}
    >
      <span className="text-lg leading-none">{inList ? "✓" : "+"}</span>
      {inList ? "In My List" : "My List"}
    </button>
  );
}
