import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-24 text-zinc-500">Loading search…</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
