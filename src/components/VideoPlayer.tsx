"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { isHlsSource } from "@/lib/film-mapper";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  filmId?: string;
  initialPosition?: number;
}

export function VideoPlayer({
  src,
  title,
  poster,
  filmId,
  initialPosition = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(true);

  const saveProgress = useCallback(
    (position: number) => {
      if (!filmId) return;
      void fetch("/api/me/watch-progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filmId, positionSeconds: position }),
      });
    },
    [filmId],
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const useHls = isHlsSource(src);

    if (useHls && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(el);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialPosition > 0) el.currentTime = initialPosition;
        void el.play().catch(() => setPlaying(false));
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (useHls && el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
    } else if (!useHls) {
      el.src = src;
    }

    const onLoaded = () => {
      if (initialPosition > 0) el.currentTime = initialPosition;
      void el.play().catch(() => setPlaying(false));
    };
    el.addEventListener("loadedmetadata", onLoaded);
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, [src, initialPosition]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !filmId) return;
    const interval = setInterval(() => {
      if (!el.paused) saveProgress(el.currentTime);
    }, 15000);
    const onPause = () => saveProgress(el.currentTime);
    el.addEventListener("pause", onPause);
    return () => {
      clearInterval(interval);
      el.removeEventListener("pause", onPause);
      saveProgress(el.currentTime);
    };
  }, [filmId, saveProgress]);

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        poster={poster}
        controls
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        title={title}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
        <p className="text-sm font-medium text-white">{title}</p>
        {!playing && (
          <p className="text-xs text-zinc-400">Paused — progress saves when signed in</p>
        )}
      </div>
    </div>
  );
}
