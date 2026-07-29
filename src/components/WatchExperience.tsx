"use client";

import { VideoPlayer } from "@/components/VideoPlayer";

interface WatchExperienceProps {
  filmId: string;
  title: string;
  director: string;
  poster: string;
  src: string;
  initialPosition: number;
}

export function WatchExperience({
  filmId,
  title,
  director,
  poster,
  src,
  initialPosition,
}: WatchExperienceProps) {
  return (
    <>
      <VideoPlayer
        src={src}
        title={title}
        poster={poster}
        filmId={filmId}
        initialPosition={initialPosition}
      />
      <div className="mt-6">
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-zinc-400">{director}</p>
      </div>
    </>
  );
}
