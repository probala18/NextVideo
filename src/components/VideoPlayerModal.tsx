"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Settings,
  Film,
  CheckCircle2
} from "lucide-react";
import { ProductionPack, ProductionScene } from "@/types";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: ProductionPack;
  modelName?: string;
  source?: string;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  pack,
  modelName = "openai/gpt-4o-mini",
  source = "openrouter",
}) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const scenes = pack.scenes || [];
  const currentScene: ProductionScene | undefined = scenes[currentSceneIdx];

  // Stop speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setCurrentSceneIdx(0);
    }
  }, [isOpen]);

  // Canvas drawing loop for cinematic video frames
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;

      // Clean background with cinematic gradient
      const grad = ctx.createRadialGradient(
        width / 2 + Math.sin(time) * 100,
        height / 2 + Math.cos(time) * 60,
        50,
        width / 2,
        height / 2,
        width * 0.75
      );

      // Color scheme based on scene index
      const palettes = [
        ["#0f172a", "#1e293b", "#3b82f6"],
        ["#09090b", "#18181b", "#8b5cf6"],
        ["#064e3b", "#065f46", "#10b981"],
        ["#451a03", "#78350f", "#f59e0b"],
        ["#1e1b4b", "#312e81", "#6366f1"],
      ];
      const p = palettes[currentSceneIdx % palettes.length];
      grad.addColorStop(0, p[2] + "33");
      grad.addColorStop(0.5, p[1]);
      grad.addColorStop(1, p[0]);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient particle grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center visual focal card
      const cardW = width * 0.82;
      const cardH = height * 0.65;
      const cardX = (width - cardW) / 2;
      const cardY = (height - cardH) / 2 - 20;

      // Glow behind card
      ctx.shadowColor = p[2];
      ctx.shadowBlur = 24;
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 24);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Glass Card border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top Tag: Scene Milestone
      ctx.fillStyle = p[2];
      ctx.font = "bold 20px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `SCENE ${currentSceneIdx + 1} OF ${scenes.length} · ${currentScene?.time || "0:00"}`,
        cardX + 36,
        cardY + 54
      );

      // Scene Purpose
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Inter, sans-serif";
      ctx.fillText(currentScene?.purpose || pack.topic, cardX + 36, cardY + 104);

      // On-Screen Graphic Text (Kinetic Overlay)
      if (currentScene?.onScreen) {
        ctx.fillStyle = "#FDE68A";
        ctx.font = "800 24px Inter, sans-serif";
        ctx.fillText(`“${currentScene.onScreen}”`, cardX + 36, cardY + 154);
      }

      // Visual Action description
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "18px Inter, sans-serif";
      const visualText = `Direction: ${currentScene?.visual || ""}`;
      ctx.fillText(
        visualText.length > 80 ? visualText.slice(0, 78) + "..." : visualText,
        cardX + 36,
        cardY + 204
      );

      // Spoken Voiceover Narration preview box
      const subH = 90;
      const subY = cardY + cardH - subH - 24;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.roundRect(cardX + 24, subY, cardW - 48, subH, 16);
      ctx.fill();

      ctx.fillStyle = "#93C5FD";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillText("VOICEOVER / TELEPROMPTER SPEECH:", cardX + 44, subY + 28);

      ctx.fillStyle = "#ffffff";
      ctx.font = "500 17px Inter, sans-serif";
      const words = (currentScene?.voiceover || "").split(" ");
      const line1 = words.slice(0, 11).join(" ");
      const line2 = words.slice(11, 24).join(" ");
      ctx.fillText(line1, cardX + 44, subY + 54);
      if (line2) {
        ctx.fillText(line2 + (words.length > 24 ? "..." : ""), cardX + 44, subY + 76);
      }

      // Bottom branding
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "13px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(
        `AI Model: ${modelName} · NextVideo`,
        width - 40,
        height - 24
      );

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, currentSceneIdx, currentScene, scenes.length, pack.topic, modelName]);

  // Voiceover Speech Synthesis
  const playCurrentSceneSpeech = (idx: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (isMuted) return;

    const scene = scenes[idx];
    if (!scene || !scene.voiceover) return;

    const utterance = new SpeechSynthesisUtterance(scene.voiceover);
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.0;

    // Pick English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      if (idx < scenes.length - 1) {
        // Advance to next scene
        setCurrentSceneIdx(idx + 1);
        playCurrentSceneSpeech(idx + 1);
      } else {
        setIsPlaying(false);
        if (isRecording) stopRecording();
      }
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playCurrentSceneSpeech(currentSceneIdx);
    }
  };

  const handleRestart = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentSceneIdx(0);
    setIsPlaying(true);
    playCurrentSceneSpeech(0);
  };

  const handleNextScene = () => {
    if (currentSceneIdx < scenes.length - 1) {
      const nextIdx = currentSceneIdx + 1;
      setCurrentSceneIdx(nextIdx);
      if (isPlaying) {
        playCurrentSceneSpeech(nextIdx);
      }
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIdx > 0) {
      const prevIdx = currentSceneIdx - 1;
      setCurrentSceneIdx(prevIdx);
      if (isPlaying) {
        playCurrentSceneSpeech(prevIdx);
      }
    }
  };

  // Video recording via Canvas captureStream
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    recordedChunksRef.current = [];

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setIsRecording(false);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);

    // Start playing from beginning
    handleRestart();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111827] text-white rounded-[28px] border border-white/10 w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Bar */}
        <div className="p-4 sm:px-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {pack.topic}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{modelName}</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                AI Scene Animation · Natural Voiceover Narration · Synchronized Captions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas Stage */}
        <div className="relative bg-black flex items-center justify-center overflow-hidden aspect-video max-h-[58vh]">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-full object-contain"
          />

          {/* Floating Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>Recording Video...</span>
            </div>
          )}
        </div>

        {/* Playback Controls & Timeline */}
        <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-white/10 space-y-3">
          {/* Progress timeline bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
            {scenes.map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentSceneIdx(idx);
                  if (isPlaying) playCurrentSceneSpeech(idx);
                }}
                className={`h-full flex-1 transition-all cursor-pointer ${
                  idx === currentSceneIdx
                    ? "bg-[#3B82F6]"
                    : idx < currentSceneIdx
                    ? "bg-white/60"
                    : "bg-transparent hover:bg-white/20"
                }`}
                style={{ borderRight: "2px solid #0F172A" }}
                title={`Jump to Scene ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left Play Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevScene}
                disabled={currentSceneIdx === 0}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-30 transition cursor-pointer"
                title="Previous Scene"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePlayPause}
                className="px-4 py-2 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? "Pause" : "Play AI Video"}</span>
              </button>

              <button
                type="button"
                onClick={handleNextScene}
                disabled={currentSceneIdx === scenes.length - 1}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-30 transition cursor-pointer"
                title="Next Scene"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 transition cursor-pointer"
                title="Restart from Scene 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-[11px] text-gray-400 ml-2 font-mono">
                Scene {currentSceneIdx + 1} / {scenes.length}
              </span>
            </div>

            {/* Right Tools & Export */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-full transition cursor-pointer ${
                  isMuted ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-300 hover:bg-white/15"
                }`}
                title={isMuted ? "Unmute Voiceover" : "Mute Voiceover"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-300 focus:outline-none"
              >
                <option value={0.75} className="bg-gray-900">0.75x</option>
                <option value={1} className="bg-gray-900">1.0x Speed</option>
                <option value={1.25} className="bg-gray-900">1.25x</option>
                <option value={1.5} className="bg-gray-900">1.5x</option>
              </select>

              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer"
                  title="Render and record video animation"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Render & Record Video</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition cursor-pointer animate-pulse"
                >
                  <span>Stop & Save Video</span>
                </button>
              )}

              {recordedVideoUrl && (
                <a
                  href={recordedVideoUrl}
                  download={`ai-video-${pack.topic.slice(0, 20).replace(/[^a-z0-9]/gi, "-")}.webm`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .webm</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
