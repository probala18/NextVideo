"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Film, Sparkles, Volume2 } from "lucide-react";

interface FilmstripScrubberProps {
  durationSeconds?: number;
  scenes?: { time: string; purpose: string }[];
  onSeek?: (seconds: number) => void;
}

export const FilmstripScrubber: React.FC<FilmstripScrubberProps> = ({
  durationSeconds = 480, // 8 minutes default
  scenes = [
    { time: "0:00", purpose: "Hook & Result" },
    { time: "0:25", purpose: "Core Context" },
    { time: "1:15", purpose: "Step 1 Foundation" },
    { time: "2:45", purpose: "Step 2 Useful Action" },
    { time: "4:30", purpose: "Common Mistake Fix" },
    { time: "6:10", purpose: "Recap & Payoff" },
    { time: "7:20", purpose: "Call to Action" },
  ],
  onSeek,
}) => {
  const [currentTime, setCurrentTime] = useState(42);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPercent, setHoverPercent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds]);

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newSeconds = Math.round(ratio * durationSeconds);
    setCurrentTime(newSeconds);
    onSeek?.(newSeconds);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setHoverPercent(pct);
  };

  const currentPercent = (currentTime / durationSeconds) * 100;

  // Active scene
  const activeScene =
    [...scenes].reverse().find((s) => {
      const parts = s.time.split(":");
      const sSec = parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
      return currentTime >= sSec;
    }) || scenes[0];

  return (
    <div className="w-full bg-ink-900 border border-ink-700 rounded-lg p-3 sm:p-4 my-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-ink-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ink-800 border border-ink-700 rounded text-xs font-mono text-studio-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-studio-orange animate-pulse" />
            TIMELINE
          </div>
          <div className="font-mono text-base font-bold text-ink-50 tracking-wider">
            {formatTimecode(currentTime)}
          </div>
          <span className="text-xs text-ink-400 font-mono hidden sm:inline">
            / {formatTimecode(durationSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ink-300 bg-ink-800 px-2 py-0.5 rounded border border-ink-700">
            {activeScene.purpose}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 bg-ink-800 hover:bg-ink-700 text-ink-100 rounded border border-ink-700 text-xs font-medium transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-studio-orange" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => setCurrentTime(0)}
            title="Reset to 00:00"
            className="p-1.5 bg-ink-800 hover:bg-ink-700 text-ink-400 hover:text-ink-200 rounded border border-ink-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filmstrip Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        className="relative h-14 bg-ink-950 border border-ink-800 rounded mt-3 cursor-pointer overflow-hidden group"
      >
        {/* Filmstrip Sprockets Top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-ink-900 border-b border-ink-800 flex justify-between px-1">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1 bg-ink-950 rounded-sm self-center" />
          ))}
        </div>

        {/* Major & Minor Ticks */}
        <div className="absolute inset-0 top-2 bottom-2 filmstrip-ticks opacity-40 pointer-events-none" />
        <div className="absolute inset-0 top-2 bottom-2 filmstrip-ticks-major opacity-70 pointer-events-none" />

        {/* Scene Markers */}
        {scenes.map((scene, idx) => {
          const parts = scene.time.split(":");
          const sSec = parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
          const pct = (sSec / durationSeconds) * 100;
          return (
            <div
              key={idx}
              style={{ left: `${pct}%` }}
              className="absolute top-2 bottom-2 w-px bg-ink-600 pointer-events-none"
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-ink-400 group-hover:bg-studio-orange transition" />
              <span className="absolute top-3 left-1 text-[9px] font-mono text-ink-400 whitespace-nowrap hidden sm:block">
                {scene.purpose.slice(0, 12)}
              </span>
            </div>
          );
        })}

        {/* Hover preview marker */}
        {isHovering && (
          <div
            style={{ left: `${hoverPercent * 100}%` }}
            className="absolute top-0 bottom-0 w-px bg-ink-400 pointer-events-none z-10"
          >
            <span className="absolute -top-5 -translate-x-1/2 bg-ink-800 text-[10px] font-mono text-ink-200 px-1 py-0.5 rounded border border-ink-700 shadow">
              {formatTimecode(hoverPercent * durationSeconds)}
            </span>
          </div>
        )}

        {/* Scrubber Playhead */}
        <motion.div
          style={{ left: `${currentPercent}%` }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="absolute top-0 bottom-0 w-0.5 bg-studio-orange pointer-events-none z-20"
        >
          <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-studio-orange rotate-45 rounded-sm shadow-sm" />
          <div className="absolute -bottom-1 -translate-x-1/2 w-3 h-3 bg-studio-orange rotate-45 rounded-sm shadow-sm" />
        </motion.div>

        {/* Filmstrip Sprockets Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-ink-900 border-t border-ink-800 flex justify-between px-1">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1 bg-ink-950 rounded-sm self-center" />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-400 font-mono pt-2">
        <span>00:00 START</span>
        <span className="hidden sm:inline">PROD TIMECODE · 30 FPS</span>
        <span>{formatTimecode(durationSeconds)} END</span>
      </div>
    </div>
  );
};
