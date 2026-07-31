"use client";

import { useState } from "react";

export default function AdminPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function seedCatalog() {
    setMessage(null);
    const res = await fetch("/api/admin/films", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedFromCatalog: true }),
    });
    const data = await res.json();
    setMessage(res.ok ? `Seeded ${data.seeded} titles` : data.error);
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/films", { method: "PUT", body: form });
    const data = await res.json();
    setMessage(res.ok ? `Uploaded → ${data.streamUrl}` : data.error);
    setUploading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-24">
      <h1 className="font-display text-3xl font-bold text-white">Studio Admin</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Requires sign-in and your Clerk user ID in{" "}
        <code className="text-zinc-300">ADMIN_USER_IDS</code>. Uploads land in
        Netlify Blobs; attach an HLS manifest URL in the database for adaptive
        streaming on your CDN.
      </p>

      <section className="mt-8 space-y-4 rounded-xl border border-zinc-800 bg-surface-raised p-6">
        <h2 className="font-semibold text-white">Catalog</h2>
        <button
          type="button"
          onClick={() => void seedCatalog()}
          className="rounded-md bg-white px-4 py-2 text-sm font-bold text-black"
        >
          Seed database from demo catalog
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-800 bg-surface-raised p-6">
        <h2 className="font-semibold text-white">Upload MP4</h2>
        <form className="mt-4 space-y-4" onSubmit={(ev) => void onUpload(ev)}>
          <label className="block text-sm text-zinc-400">
            Film slug
            <input
              name="slug"
              required
              className="mt-1 w-full rounded border border-zinc-700 bg-surface px-3 py-2 text-white"
              placeholder="last-light-on-mars"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Video file
            <input
              name="file"
              type="file"
              accept="video/mp4,video/quicktime"
              required
              className="mt-1 block w-full text-sm text-zinc-300"
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-surface disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload to CDN storage"}
          </button>
        </form>
      </section>

      {message && (
        <p className="mt-4 rounded border border-zinc-700 bg-black/40 p-3 text-sm text-zinc-200">
          {message}
        </p>
      )}
    </div>
  );
}
