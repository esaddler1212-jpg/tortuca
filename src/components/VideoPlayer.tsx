"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
}

export function VideoPlayer({ src, title, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    void el.play().catch(() => setPlaying(false));
  }, [src]);

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={src}
        poster={poster}
        controls
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        title={title}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={togglePlay}
          className="pointer-events-auto rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            const el = videoRef.current;
            if (!el) return;
            el.muted = !el.muted;
            setMuted(el.muted);
          }}
          className="pointer-events-auto rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
}
