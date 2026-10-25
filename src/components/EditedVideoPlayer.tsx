"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Scissors,
  CheckCircle2,
  Film,
  Sparkles,
  Maximize2,
  Loader2,
  AlertCircle
} from "lucide-react";

export interface CutItem {
  start: number;
  end: number;
  kind: "dead_air" | "repeat" | "filler" | string;
  why: string;
}

interface EditedVideoPlayerProps {
  videoUrl: string;
  cuts: CutItem[];
  duration: number;
  filename?: string;
  assetId?: string;
  onToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const EditedVideoPlayer: React.FC<EditedVideoPlayerProps> = ({
  videoUrl,
  cuts,
  duration,
  filename = "video",
  assetId,
  onToast,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);
  const [isCutSkipMode, setIsCutSkipMode] = useState(true);
  const [lastSkippedNotice, setLastSkippedNotice] = useState<string | null>(null);

  // Client-side rendering state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);
  const [renderedMimeType, setRenderedMimeType] = useState<string>("video/mp4");

  // Sorted cuts
  const sortedCuts = useMemo(() => {
    return [...cuts].sort((a, b) => a.start - b.start);
  }, [cuts]);

  // Kept intervals
  const keptSegments = useMemo(() => {
    const kept: { start: number; end: number }[] = [];
    let cur = 0;
    const dur = videoDuration || duration || 60;
    for (const cut of sortedCuts) {
      if (cut.start > cur + 0.1) {
        kept.push({ start: cur, end: cut.start });
      }
      cur = Math.max(cur, cut.end);
    }
    if (cur < dur - 0.1) {
      kept.push({ start: cur, end: dur });
    }
    return kept;
  }, [sortedCuts, videoDuration, duration]);

  // Total edited post-cut length
  const editedDuration = useMemo(() => {
    return keptSegments.reduce((acc, seg) => acc + (seg.end - seg.start), 0);
  }, [keptSegments]);

  // Playhead update & skip logic
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    if (isCutSkipMode && !isExporting) {
      // Check if current time falls within any cut interval
      for (const cut of sortedCuts) {
        if (t >= cut.start - 0.05 && t < cut.end - 0.05) {
          // Seamlessly jump over cut
          videoRef.current.currentTime = cut.end;
          setLastSkippedNotice(
            `⚡ Cut ${((cut.end - cut.start)).toFixed(1)}s ${cut.kind.replace("_", " ")}`
          );
          setTimeout(() => setLastSkippedNotice(null), 1800);
          break;
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    const startPoint = isCutSkipMode && keptSegments.length > 0 ? keptSegments[0].start : 0;
    videoRef.current.currentTime = startPoint;
    setCurrentTime(startPoint);
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /**
   * Client-side video cut rendering using HTML5 Canvas + Web Audio API + MediaRecorder.
   * Produces a real, genuine, 100% playable video file (MP4 or WebM) right inside the browser.
   */
  const handleRenderAndDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(1);

    try {
      const sourceVideo = document.createElement("video");
      sourceVideo.src = videoUrl;
      sourceVideo.crossOrigin = "anonymous";
      sourceVideo.preload = "auto";
      sourceVideo.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        sourceVideo.onloadedmetadata = () => resolve();
        sourceVideo.onerror = () => reject(new Error("Failed to load source video stream"));
      });

      const videoWidth = sourceVideo.videoWidth || 1280;
      const videoHeight = sourceVideo.videoHeight || 720;

      const canvas = document.createElement("canvas");
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context");

      // Setup audio routing to capture original audio track
      let audioStreamTrack: MediaStreamTrack | null = null;
      let audioCtx: AudioContext | null = null;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          const sourceNode = audioCtx.createMediaElementSource(sourceVideo);
          const destNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(destNode);
          audioStreamTrack = destNode.stream.getAudioTracks()[0] || null;
        }
      } catch (err) {
        // Fallback without web audio if cors or permission limits
      }

      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioStreamTrack) {
        combinedTracks.push(audioStreamTrack);
      }
      const combinedStream = new MediaStream(combinedTracks);

      // Determine best playable format
      let mime = "video/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/mp4; codecs=avc1")) {
          mime = "video/mp4; codecs=avc1";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mime = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9,opus")) {
          mime = "video/webm; codecs=vp9,opus";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mime = "video/webm";
        }
      }

      setRenderedMimeType(mime);
      const recorder = new MediaRecorder(combinedStream, { mimeType: mime });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.start(100);

      const segmentsToKeep = keptSegments.length > 0
        ? keptSegments
        : [{ start: 0, end: sourceVideo.duration || duration || 60 }];

      const totalPlayableSecs = segmentsToKeep.reduce((acc, s) => acc + (s.end - s.start), 0);
      let recordedSecs = 0;

      // Draw loop to paint frames to canvas
      let isDrawing = true;
      const drawFrame = () => {
        if (!isDrawing) return;
        ctx.drawImage(sourceVideo, 0, 0, videoWidth, videoHeight);
        requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Step through each kept segment
      for (let i = 0; i < segmentsToKeep.length; i++) {
        const seg = segmentsToKeep[i];
        sourceVideo.currentTime = seg.start;

        await new Promise<void>((res) => {
          const onSeek = () => {
            sourceVideo.removeEventListener("seeked", onSeek);
            res();
          };
          sourceVideo.addEventListener("seeked", onSeek);
        });

        await sourceVideo.play().catch(() => {});

        // Record until end of segment
        await new Promise<void>((res) => {
          const checkProgress = () => {
            const segElapsed = Math.min(
              Math.max(0, sourceVideo.currentTime - seg.start),
              seg.end - seg.start
            );
            const totalElapsed = recordedSecs + segElapsed;
            const pct = Math.min(99, Math.round((totalElapsed / totalPlayableSecs) * 100));
            setExportProgress(pct);

            if (sourceVideo.currentTime >= seg.end - 0.05 || sourceVideo.ended) {
              sourceVideo.pause();
              res();
            } else {
              requestAnimationFrame(checkProgress);
            }
          };
          requestAnimationFrame(checkProgress);
        });

        recordedSecs += (seg.end - seg.start);
      }

      isDrawing = false;
      recorder.stop();
      if (audioCtx) {
        await audioCtx.close().catch(() => {});
      }

      await new Promise<void>((res) => {
        recorder.onstop = () => res();
      });

      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      setRenderedBlobUrl(url);

      // Trigger automatic download
      const cleanName = filename ? filename.replace(/\.[^/.]+$/, "") : "edited_video";
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_${cleanName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportProgress(100);
      onToast(`Edited video rendered and downloaded successfully as .${ext}!`, "success");
    } catch (err: any) {
      onToast(`Client rendering failed: ${err.message}. You can download the source video or CMX 3600 EDL.`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const dur = videoDuration || duration || 1;

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative bg-[#0F172A] rounded-2xl overflow-hidden border border-[#1E293B] shadow-lg aspect-video max-h-[460px] flex items-center justify-center group"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Floating Skip Badge */}
        {lastSkippedNotice && (
          <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Scissors className="w-3.5 h-3.5" />
            <span>{lastSkippedNotice}</span>
          </div>
        )}

        {/* Mode Indicator Overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCutSkipMode(!isCutSkipMode)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isCutSkipMode
                ? "bg-[#2563EB]/90 text-white hover:bg-[#1D4ED8]"
                : "bg-black/60 text-gray-300 hover:bg-black/80"
            }`}
            title="Toggle between previewing with dead air cuts skipped vs uncut original"
          >
            <Scissors className="w-3 h-3" />
            <span>{isCutSkipMode ? "Preview: Cuts Skipped" : "Preview: Original"}</span>
          </button>
        </div>

        {/* Centered Play Button when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 bg-white/90 hover:bg-white text-[#0F172A] rounded-full flex items-center justify-center shadow-xl transition transform hover:scale-105 cursor-pointer"
          >
            <Play className="w-6 h-6 ml-1 fill-current" />
          </button>
        )}

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-2 transition-opacity">
          {/* Progress Timeline with Cut Markers */}
          <div className="relative w-full h-2 bg-white/20 rounded-full cursor-pointer flex items-center">
            {/* Cut Zones Markers */}
            {sortedCuts.map((cut, idx) => {
              const leftPct = (cut.start / dur) * 100;
              const widthPct = ((cut.end - cut.start) / dur) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 bg-red-500/70 rounded-xs"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`Cut ${idx + 1}: ${cut.kind} (${cut.start.toFixed(1)}s - ${cut.end.toFixed(1)}s)`}
                />
              );
            })}

            {/* Current Playhead Range */}
            <input
              type="range"
              min={0}
              max={dur}
              step={0.05}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="h-full bg-[#3B82F6] rounded-full pointer-events-none"
              style={{ width: `${(currentTime / dur) * 100}%` }}
            />
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="hover:text-[#3B82F6] transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={restartVideo}
                className="hover:text-[#3B82F6] transition cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="hover:text-[#3B82F6] transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="font-mono text-[11px] text-gray-300">
                {formatTime(currentTime)} / {formatTime(dur)}
                {isCutSkipMode && (
                  <span className="text-[#34D399] ml-1.5 font-sans font-semibold">
                    (Edited: ~{formatTime(editedDuration)})
                  </span>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="hover:text-[#3B82F6] transition cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
        <div>
          <div className="text-xs font-bold text-[#1E293B]">
            Edited Output Options
          </div>
          <div className="text-[11px] text-[#64748B]">
            {isExporting
              ? `Rendering your cut video (${exportProgress}% complete)...`
              : "Render and download an assembled video file or export standard NLE timeline cuts."}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Native Client Exporter (Always creates a real playable video) */}
          <button
            type="button"
            onClick={handleRenderAndDownload}
            disabled={isExporting}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
              isExporting
                ? "bg-[#93C5FD] text-white cursor-not-allowed"
                : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white hover:shadow-md"
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering Cuts ({exportProgress}%)</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                <span>Render & Download Edited Video</span>
              </>
            )}
          </button>

          {/* Re-download previously rendered file if ready */}
          {renderedBlobUrl && !isExporting && (
            <a
              href={renderedBlobUrl}
              download={`edited_${filename.replace(/\.[^/.]+$/, "")}.${renderedMimeType.includes("mp4") ? "mp4" : "webm"}`}
              className="px-3.5 py-2 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-[#A7F3D0]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Download Ready File</span>
            </a>
          )}

          {/* Source Video Download */}
          <a
            href={`${videoUrl}${videoUrl.includes("?") ? "&" : "?"}download=1`}
            download
            className="px-3.5 py-2 bg-white hover:bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Download original uploaded source video"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Source Video</span>
          </a>

          {/* NLE EDL Download */}
          {assetId && (
            <a
              href={`/api/video/assets/${assetId}/cuts/edit_decision_list_${assetId}.edl`}
              download
              className="px-3.5 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Export CMX 3600 EDL for Premiere Pro, DaVinci Resolve, or Final Cut Pro"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CMX 3600 EDL (.edl)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
