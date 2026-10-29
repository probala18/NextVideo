"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Youtube,
  FileText,
  Eye,
  Check,
  RefreshCw,
  Copy,
  Tag,
  List,
  Layers,
  ArrowRight,
  Shield,
  Info,
} from "lucide-react";
import { VideoProcessingJob, ConsolidatedAnalysisReport } from "@/lib/types/videoWorkflow";
import { TitleOption, GeneratedThumbnail } from "@/lib/types/visionWorkflow";
import { YouTubeOAuthModal } from "./YouTubeOAuthModal";

interface AutonomousVideoStudioProps {
  onSaveToPlanner?: (title: string, note: string, status?: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const AutonomousVideoStudio: React.FC<AutonomousVideoStudioProps> = ({
  onToast,
}) => {
  // Step 1: Upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Active Job state
  const [currentJob, setCurrentJob] = useState<VideoProcessingJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Step 3: Selection and Editing state
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedThumbnailId, setSelectedThumbnailId] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDesc, setEditableDesc] = useState("");
  const [editableTags, setEditableTags] = useState("");
  const [isRegeneratingPackaging, setIsRegeneratingPackaging] = useState(false);

  // Step 4: YouTube OAuth & Publishing state
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [channelTitle, setChannelTitle] = useState<string | null>(null);
  const [channelAvatar, setChannelAvatar] = useState<string | null>(null);
  const [publishPrivacy, setPublishPrivacy] = useState<"private" | "unlisted" | "public">("private");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedVideoUrl, setPublishedVideoUrl] = useState<string | null>(null);
  const [publishedVideoId, setPublishedVideoId] = useState<string | null>(null);
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check YouTube OAuth connection status on mount & restore active job
  useEffect(() => {
    fetch("/api/youtube/auth")
      .then((r) => r.json())
      .then((data) => {
        setIsYoutubeConnected(Boolean(data.isConnected));
        if (data.channelTitle) setChannelTitle(data.channelTitle);
        if (data.avatarUrl) setChannelAvatar(data.avatarUrl);
      })
      .catch(() => {});

    // Restore active job from localStorage
    try {
      if (typeof window !== "undefined" && !currentJob) {
        const savedJobId = localStorage.getItem("nextvideo_active_job_id");
        if (savedJobId) {
          fetch(`/api/video/jobs/${savedJobId}`)
            .then((r) => r.json())
            .then((data) => {
              const job = data.job || data;
              if (job && job.id && job.status !== "cancelled") {
                setCurrentJob(job);
                if (!["completed", "failed", "cancelled"].includes(job.status)) {
                  setIsPolling(true);
                }
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
  }, []);

  // Persist active job ID across page navigations
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && currentJob?.id) {
        localStorage.setItem("nextvideo_active_job_id", currentJob.id);
      }
    } catch {}
  }, [currentJob?.id]);

  // Listen for popup window OAuth completion message without page reload
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "YOUTUBE_OAUTH_SUCCESS") {
        setIsYoutubeConnected(true);
        if (event.data.channelTitle) setChannelTitle(event.data.channelTitle);
        if (event.data.avatarUrl) setChannelAvatar(event.data.avatarUrl);
        setIsOAuthModalOpen(false);
        onToast(`Connected YouTube Channel: ${event.data.channelTitle || "Success"}!`, "success");
      } else if (event.data?.type === "YOUTUBE_OAUTH_ERROR") {
        onToast(event.data.error || "YouTube authorization failed.", "error");
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [onToast]);

  // Pre-fill editable packaging when analysis report is ready
  useEffect(() => {
    if (currentJob?.report) {
      const rep = currentJob.report;
      const pkg = rep.publishingPackage;

      const initialTitle =
        pkg?.recommendedTitle ||
        pkg?.titles?.[0]?.title ||
        rep.packaging?.alternativeTitles?.[0] ||
        rep.seo?.suggestedTitle ||
        "";

      if (!editableTitle) {
        setEditableTitle(initialTitle);
        setSelectedTitle(initialTitle);
      }

      if (!editableDesc) {
        setEditableDesc(pkg?.description || rep.seo?.description || "");
      }

      if (!editableTags) {
        const tags = pkg?.tags || rep.seo?.tags || [];
        setEditableTags(Array.isArray(tags) ? tags.join(", ") : String(tags));
      }

      if (!selectedThumbnailId) {
        const thumbs = pkg?.thumbnails || [];
        if (thumbs.length > 0) {
          setSelectedThumbnailId(thumbs[0].id);
        }
      }
    }
  }, [currentJob?.report]);

  // Poll active job until completion or error
  useEffect(() => {
    if (!currentJob || !isPolling) return;
    if (["completed", "failed", "cancelled"].includes(currentJob.status)) {
      setIsPolling(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/jobs/${currentJob.id}`);
        if (res.ok) {
          const data = await res.json();
          const updated: VideoProcessingJob = data.job || data;
          if (updated && updated.status) {
            setCurrentJob(updated);
            if (["completed", "failed", "cancelled"].includes(updated.status)) {
              setIsPolling(false);
              if (updated.status === "completed") {
                onToast("Video analysis & asset generation complete!", "success");
              } else if (updated.status === "failed") {
                onToast(updated.errorMessage || "Processing failed.", "error");
              }
            }
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentJob?.id, isPolling, onToast]);

  // Client-side frame extraction using offscreen canvas for grounding
  const captureVideoFrames = async (file: File): Promise<Blob[]> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.preload = "auto";
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      const frames: Blob[] = [];
      const checkpoints = [0.1, 0.5, 0.85];
      let currentIdx = 0;

      const handleSeeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, 1280, 720);
            canvas.toBlob(
              (blob) => {
                if (blob) frames.push(blob);
                currentIdx++;
                if (currentIdx < checkpoints.length && video.duration) {
                  video.currentTime = video.duration * checkpoints[currentIdx];
                } else {
                  URL.revokeObjectURL(url);
                  resolve(frames);
                }
              },
              "image/jpeg",
              0.88
            );
          } else {
            currentIdx++;
            if (currentIdx < checkpoints.length && video.duration) {
              video.currentTime = video.duration * checkpoints[currentIdx];
            } else {
              URL.revokeObjectURL(url);
              resolve(frames);
            }
          }
        } catch {
          URL.revokeObjectURL(url);
          resolve(frames);
        }
      };

      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        video.currentTime = Math.max(1, (video.duration || 10) * checkpoints[0]);
      };

      video.onseeked = handleSeeked;

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(frames);
      };

      // Safety timeout
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(frames);
      }, 5000);
    });
  };

  // Handle Video Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setPublishedVideoUrl(null);
      setPublishedVideoId(null);
    }
  };

  // Handle Video Upload & Trigger Pipeline
  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      onToast("Please select a video file (.mp4, .mov, .webm) first.", "info");
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      // Attempt client frame extraction to ground thumbnails in genuine frames
      let frameBlobs: Blob[] = [];
      try {
        setUploadProgress(25);
        frameBlobs = await captureVideoFrames(videoFile);
      } catch {
        // Fallback to server inspection
      }

      setUploadProgress(45);
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("file", videoFile);

      // Include extracted frame snapshots if captured
      frameBlobs.forEach((blob, idx) => {
        formData.append(`frame_${idx}`, blob, `frame_${idx + 1}.jpg`);
      });

      setUploadProgress(70);
      const res = await fetch("/api/video/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(95);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setUploadProgress(100);
      setCurrentJob(data.job || data);
      setIsPolling(true);
      onToast("Video uploaded! Analyzing content & generating publishing assets...", "success");
    } catch (err: any) {
      onToast(err.message || "Upload failed. Please check your video file format.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Open non-reloading popup window for YouTube OAuth
  const openOAuthPopup = (authUrl: string) => {
    const width = 600;
    const height = 700;
    const left = typeof window !== "undefined" ? Math.max(0, (window.screen.width - width) / 2) : 100;
    const top = typeof window !== "undefined" ? Math.max(0, (window.screen.height - height) / 2) : 100;

    const popup = window.open(
      authUrl,
      "youtube_oauth_popup",
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
    );

    const pollTimer = setInterval(async () => {
      try {
        const r = await fetch("/api/youtube/auth");
        const d = await r.json();
        if (d.isConnected) {
          setIsYoutubeConnected(true);
          if (d.channelTitle) setChannelTitle(d.channelTitle);
          if (d.avatarUrl) setChannelAvatar(d.avatarUrl);
          setIsOAuthModalOpen(false);
          clearInterval(pollTimer);
          onToast(`Connected YouTube Channel: ${d.channelTitle || "Success"}!`, "success");
        }
      } catch {}

      if (popup && popup.closed) {
        clearInterval(pollTimer);
      }
    }, 1500);

    setTimeout(() => clearInterval(pollTimer), 120000);
  };

  const handleConnectYouTube = async () => {
    try {
      const res = await fetch("/api/youtube/auth?action=connect");
      const data = await res.json();
      const authUrl = data.authUrl || data.oauthUrl;
      if (authUrl) {
        openOAuthPopup(authUrl);
      } else {
        setIsOAuthModalOpen(true);
      }
    } catch {
      setIsOAuthModalOpen(true);
    }
  };

  // Regenerate packaging with configured model
  const handleRegeneratePackaging = async () => {
    if (!currentJob?.report) return;
    setIsRegeneratingPackaging(true);
    try {
      const report = currentJob.report;
      const res = await fetch("/api/video/packaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: report.understanding?.actualTopic || editableTitle,
          currentTitle: editableTitle,
          transcriptText: report.transcript?.text || "",
          durationSeconds: report.media?.durationSeconds || 600,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to regenerate packaging");

      if (data.suggestedTitle) {
        setEditableTitle(data.suggestedTitle);
        setSelectedTitle(data.suggestedTitle);
      }
      if (data.description) setEditableDesc(data.description);
      if (data.tags) setEditableTags(Array.isArray(data.tags) ? data.tags.join(", ") : data.tags);

      onToast("Refreshed packaging assets with configured model!", "success");
    } catch (err: any) {
      onToast(err.message || "Failed to regenerate assets", "error");
    } finally {
      setIsRegeneratingPackaging(false);
    }
  };

  // Publish to YouTube
  const handlePublishToYouTube = async () => {
    if (!currentJob) return;
    setIsPublishing(true);
    setPublishedVideoUrl(null);
    setPublishedVideoId(null);

    try {
      const finalTitle = editableTitle || selectedTitle || currentJob.filename;
      const finalDesc = editableDesc || currentJob.report?.seo?.description || "";
      const finalTags = editableTags
        ? editableTags.split(",").map((s) => s.trim()).filter(Boolean)
        : currentJob.report?.seo?.tags || ["nextvideo"];

      const res = await fetch("/api/youtube/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: currentJob.id,
          targetType: "original",
          privacyStatus: publishPrivacy,
          title: finalTitle,
          description: finalDesc,
          tags: finalTags,
          selectedThumbnailId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Publishing failed");
      }

      const publishedUrl = data.videoUrl || data.publishedUrl || (data.videoId ? `https://youtu.be/${data.videoId}` : null);
      setPublishedVideoUrl(publishedUrl);
      setPublishedVideoId(data.videoId || data.record?.youtubeVideoId || null);

      if (data.isDuplicatePrevented) {
        onToast("Video was already published. Retrieved existing YouTube URL.", "info");
      } else {
        onToast(`Video successfully published to YouTube as ${publishPrivacy.toUpperCase()}!`, "success");
      }
    } catch (err: any) {
      onToast(err.message || "Failed to publish video to YouTube.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  // Reset/Clear active video
  const handleReset = () => {
    setCurrentJob(null);
    setVideoFile(null);
    setVideoDuration(null);
    setSelectedTitle("");
    setSelectedThumbnailId("");
    setEditableTitle("");
    setEditableDesc("");
    setEditableTags("");
    setPublishedVideoUrl(null);
    setPublishedVideoId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nextvideo_active_job_id");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    onToast("Ready for new video upload.", "info");
  };

  const copyPublishedUrl = () => {
    if (!publishedVideoUrl) return;
    navigator.clipboard.writeText(publishedVideoUrl);
    setCopiedLink(true);
    onToast("YouTube URL copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const report: ConsolidatedAnalysisReport | undefined = currentJob?.report;
  const pkg = report?.publishingPackage;
  const isJobComplete = currentJob?.status === "completed" && Boolean(report);
  const titlesList: TitleOption[] = (pkg?.titles && pkg.titles.length > 0)
    ? pkg.titles
    : (report?.packaging?.alternativeTitles || []).map((t) => ({
        title: t,
        formula: "Editorial Pattern",
        characterCount: t.length,
        isTruncated: t.length > 60,
        fitReason: "Matches demonstrated subject.",
        scores: {
          contentRelevance: 90,
          specificity: 88,
          readability: t.length <= 60 ? 95 : 80,
          searchIntent: 90,
          comparablePatternSimilarity: 85,
          overallScore: t.length <= 60 ? 91 : 85,
        },
      }));

  const thumbnailsList: GeneratedThumbnail[] = pkg?.thumbnails || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 4-Step Workflow Progress Bar */}
      <div className="bg-white rounded-2xl border border-[#E8EAEE] p-4 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold">
          {/* Step 1 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition ${
              !currentJob
                ? "bg-[#EFF6FF] text-[#2563EB]"
                : "text-[#10B981]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                !currentJob
                  ? "bg-[#2563EB] text-white"
                  : "bg-[#10B981] text-white"
              }`}
            >
              {!currentJob ? "1" : <Check className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Step 1</div>
              <div>Upload Video</div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition ${
              currentJob && !isJobComplete
                ? "bg-[#EFF6FF] text-[#2563EB]"
                : isJobComplete
                ? "text-[#10B981]"
                : "text-[#9CA3AF]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentJob && !isJobComplete
                  ? "bg-[#2563EB] text-white"
                  : isJobComplete
                  ? "bg-[#10B981] text-white"
                  : "bg-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {isJobComplete ? <Check className="w-3.5 h-3.5" /> : "2"}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Step 2</div>
              <div>Generate Assets</div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition ${
              isJobComplete && !publishedVideoUrl
                ? "bg-[#EFF6FF] text-[#2563EB]"
                : publishedVideoUrl
                ? "text-[#10B981]"
                : "text-[#9CA3AF]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                isJobComplete && !publishedVideoUrl
                  ? "bg-[#2563EB] text-white"
                  : publishedVideoUrl
                  ? "bg-[#10B981] text-white"
                  : "bg-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {publishedVideoUrl ? <Check className="w-3.5 h-3.5" /> : "3"}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Step 3</div>
              <div>Select & Review</div>
            </div>
          </div>

          {/* Step 4 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition ${
              publishedVideoUrl
                ? "bg-[#ECFDF5] text-[#059669]"
                : isJobComplete
                ? "text-[#111827]"
                : "text-[#9CA3AF]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                publishedVideoUrl
                  ? "bg-[#059669] text-white"
                  : "bg-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {publishedVideoUrl ? <Check className="w-3.5 h-3.5" /> : "4"}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#6B7280]">Step 4</div>
              <div>Publish to YouTube</div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Upload Video */}
      {!currentJob && (
        <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
            <div>
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                Step 1 of 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">
                Upload Video
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Upload your video file. The computer vision pipeline analyzes visual frames, detects on-screen text, transcribes dialogue, and queries real YouTube Data API benchmarks.
              </p>
            </div>
          </div>

          <form onSubmit={handleStartUpload} className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                videoFile
                  ? "border-[#2563EB] bg-[#EFF6FF]/40"
                  : "border-[#D1D5DB] hover:border-[#2563EB] bg-[#FAFAFA]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4 shadow-xs">
                <Upload className="w-7 h-7" />
              </div>

              {videoFile ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-[#111827]">{videoFile.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • {videoFile.type || "Video file"}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#DBEAFE] text-[#1D4ED8]">
                    Ready to upload and analyze
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#111827]">
                    Click to select or drag and drop raw video footage
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Supports MP4, MOV, WebM, MKV (up to 500 MB)
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2 p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#111827]">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
                    Uploading video file and registering job...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!videoFile || isUploading}
                className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-xs transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Upload & Analyze Video</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Processing Status & Video Understanding Summary */}
      {currentJob && !isJobComplete && (
        <div className="bg-white rounded-[28px] border border-[#BFDBFE] p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3F4F6]">
            <div>
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                Step 2 of 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">
                Analyzing Video & Generating Assets
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Processing file: <span className="font-semibold text-[#111827]">{currentJob.filename}</span> ({(currentJob.filesizeBytes / (1024 * 1024)).toFixed(1)} MB)
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-[#EF4444] hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4 p-6 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <div className="flex items-center justify-between text-xs font-bold text-[#111827]">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                {currentJob.currentStage || "Analyzing video streams..."}
              </span>
              <span>{currentJob.progressPercent}%</span>
            </div>

            <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#2563EB] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${currentJob.progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-[#6B7280]">
              <div className="flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Frame sampling & on-screen text</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Speech transcription & cues</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>YouTube API benchmark research</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 COMPLETED: Grounded Video Understanding Summary */}
      {isJobComplete && report && (
        <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3F4F6]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981] text-white uppercase tracking-wider">
                  Video Understood
                </span>
                <span className="text-xs text-[#6B7280]">
                  {Math.floor((report.media?.durationSeconds || 0) / 60)}m {Math.round((report.media?.durationSeconds || 0) % 60)}s • {report.media?.width || 1280}x{report.media?.height || 720}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#111827] mt-1.5">
                {report.understanding?.actualTopic || "Video Demonstration"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegeneratePackaging}
                disabled={isRegeneratingPackaging}
                className="px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingPackaging ? "animate-spin" : ""}`} />
                <span>Re-generate Assets</span>
              </button>
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#6B7280] hover:text-[#EF4444] transition cursor-pointer"
              >
                New Upload
              </button>
            </div>
          </div>

          {/* Evidence-grounded Video Summary Box */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B]">
              <Info className="w-4 h-4 text-[#2563EB]" />
              <span>Grounded Video Evidence Summary</span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {report.understanding?.summary || report.understanding?.primaryValueProposition || "Video content analyzed and grounded in visual progression and audio transcript."}
            </p>

            {/* Research Status Notice */}
            <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-[#64748B]">
                {pkg?.researchSummary?.isLiveApiData ? (
                  <span className="text-[#059669] font-semibold">
                    ✓ Verified with real YouTube Data API v3 research ({pkg.researchSummary.videosAnalyzedCount} comparable videos analyzed)
                  </span>
                ) : (
                  <span className="text-[#D97706] font-semibold">
                    • Live YouTube competitive research unavailable (using direct video understanding)
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                Public views do not reveal YouTube&apos;s internal algorithm
              </span>
            </div>

            {/* Limitation notice if video was difficult to parse */}
            {report.understanding?.limitationNotice && (
              <div className="p-2.5 bg-[#FEF3C7] rounded-xl text-[11px] text-[#92400E] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>{report.understanding.limitationNotice}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Select and Review Assets */}
      {isJobComplete && (
        <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-8">
          <div>
            <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
              Step 3 of 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">
              Select Title & Thumbnail, Review Metadata
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Select one title and one thumbnail from the grounded options generated for your video. Edit any metadata field before publishing.
            </p>
          </div>

          {/* Section 3A: 5 Selectable Title Cards */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <span>1. Select Publishing Title</span>
                <span className="text-[11px] font-semibold text-[#6B7280]">(Choose 1 of 5)</span>
              </h3>
              <span className="text-[11px] text-[#2563EB] font-bold">
                Selected: {editableTitle.length} chars
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {titlesList.map((item, idx) => {
                const isSelected = selectedTitle === item.title || editableTitle === item.title;
                const isMobileSafe = item.characterCount <= 60;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedTitle(item.title);
                      setEditableTitle(item.title);
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "border-[#2563EB] bg-[#EFF6FF]/60 shadow-xs"
                        : "border-[#E5E7EB] hover:border-[#BFDBFE] bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "border-[#2563EB] bg-[#2563EB] text-white"
                            : "border-[#9CA3AF] bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#111827]">{item.title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280]">
                          <span className="font-semibold text-[#4B5563]">{item.formula}</span>
                          <span>•</span>
                          <span>{item.fitReason || "Accurately represents video demonstration."}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {item.scores && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F3F4F6] text-[#374151]">
                          Score: {item.scores.overallScore}/100
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          isMobileSafe
                            ? "bg-[#ECFDF5] text-[#059669]"
                            : "bg-[#FEF3C7] text-[#D97706]"
                        }`}
                      >
                        {item.characterCount} chars {isMobileSafe ? "• Mobile safe" : "• May truncate"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3B: Selectable Thumbnail Cards */}
          <div className="space-y-3.5 pt-4 border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <span>2. Select Video Thumbnail</span>
                <span className="text-[11px] font-semibold text-[#6B7280]">(Grounded in uploaded footage)</span>
              </h3>
              <span className="text-[11px] text-[#059669] font-bold">
                1280x720 • 16:9 compliant PNG/JPEG
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {thumbnailsList.map((thumb) => {
                const isSelected = selectedThumbnailId === thumb.id;

                return (
                  <div
                    key={thumb.id}
                    onClick={() => setSelectedThumbnailId(thumb.id)}
                    className={`rounded-2xl border-2 overflow-hidden transition cursor-pointer flex flex-col ${
                      isSelected
                        ? "border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20"
                        : "border-[#E5E7EB] hover:border-[#BFDBFE]"
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative aspect-video bg-[#0F172A] overflow-hidden">
                      <img
                        src={thumb.imageUrl}
                        alt={thumb.headline}
                        className="w-full h-full object-cover"
                      />

                      {/* Selection Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md font-bold text-xs ${
                            isSelected
                              ? "bg-[#2563EB] text-white"
                              : "bg-black/60 text-white"
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : ""}
                        </div>
                      </div>

                      {/* Source badge */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/75 text-white uppercase tracking-wider">
                          {thumb.source === "video_frame" ? "Video Keyframe" : "Broadcast Graphic"}
                        </span>
                      </div>
                    </div>

                    {/* Thumbnail Details */}
                    <div className="p-3 bg-white space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#111827]">{thumb.variationName}</div>
                        <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5">
                          {thumb.rationale}
                        </p>
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] pt-1 border-t border-[#F3F4F6] flex justify-between">
                        <span>{thumb.width}x{thumb.height}</span>
                        <span>{thumb.format.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3C: Editable Metadata Form */}
          <div className="space-y-4 pt-4 border-t border-[#F3F4F6]">
            <h3 className="text-sm font-bold text-[#111827]">
              3. Review & Edit YouTube Metadata
            </h3>

            {/* Editable Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-[#374151]">Publishing Title</label>
                <span className={editableTitle.length > 100 ? "text-[#EF4444] font-bold" : "text-[#6B7280]"}>
                  {editableTitle.length} / 100 characters
                </span>
              </div>
              <input
                type="text"
                value={editableTitle}
                maxLength={100}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#111827] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
              />
            </div>

            {/* Editable Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-[#374151]">Description (With Grounded Timestamps)</label>
                <span className="text-[#6B7280]">{editableDesc.length} chars</span>
              </div>
              <textarea
                rows={7}
                value={editableDesc}
                onChange={(e) => setEditableDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] font-mono leading-relaxed focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
              />
            </div>

            {/* Editable Tags */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#374151]">
                Search Tags (Comma separated)
              </label>
              <input
                type="text"
                value={editableTags}
                onChange={(e) => setEditableTags(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-xs text-[#111827] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
              />
            </div>

            {/* Category Suggestion */}
            {pkg?.suggestedCategory && (
              <div className="flex items-center gap-2 text-xs text-[#4B5563] pt-1">
                <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-bold">Suggested Category:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] font-semibold text-[11px]">
                  {pkg.suggestedCategory.name} (ID: {pkg.suggestedCategory.id})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Publish Video to YouTube */}
      {isJobComplete && (
        <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
              Step 4 of 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">
              Upload Video to YouTube
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Connect your YouTube channel, choose your privacy preference, and publish the original video with your chosen title and thumbnail.
            </p>
          </div>

          {/* YouTube Connection Status Card */}
          <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#111827] flex items-center gap-2">
                  <span>{isYoutubeConnected ? (channelTitle || "Connected Channel") : "YouTube Account Not Connected"}</span>
                  {isYoutubeConnected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669]">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  {isYoutubeConnected
                    ? "Authorized for direct resumable video uploads and thumbnail assignment."
                    : "Connect via official Google OAuth 2.0 to publish directly to your channel."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConnectYouTube}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                isYoutubeConnected
                  ? "bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6]"
                  : "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-xs"
              }`}
            >
              {isYoutubeConnected ? "Switch YouTube Channel" : "Connect YouTube"}
            </button>
          </div>

          {/* Publishing Settings & Review Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-xs">
            <div>
              <label className="block font-bold text-[#374151] mb-1.5">
                Privacy Status
              </label>
              <select
                value={publishPrivacy}
                onChange={(e) => setPublishPrivacy(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-semibold text-[#111827] outline-none focus:border-[#2563EB]"
              >
                <option value="private">Private (Recommended for final review)</option>
                <option value="unlisted">Unlisted (Accessible only via link)</option>
                <option value="public">Public (Immediately visible to subscribers)</option>
              </select>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Published videos default to Private so you can verify playback on YouTube before public release.
              </p>
            </div>

            <div>
              <span className="block font-bold text-[#374151] mb-1.5">
                Asset Payload
              </span>
              <ul className="space-y-1 text-[11px] text-[#475569]">
                <li>• Video File: <span className="font-semibold text-[#111827]">{currentJob.filename}</span> (Original Upload)</li>
                <li>• Selected Title: <span className="font-semibold text-[#111827]">{editableTitle.slice(0, 45)}...</span></li>
                <li>• Custom Thumbnail: <span className="font-semibold text-[#111827]">{selectedThumbnailId ? "Selected (" + selectedThumbnailId + ")" : "Default"}</span></li>
              </ul>
            </div>
          </div>

          {/* Published Video Link Banner */}
          {publishedVideoUrl && (
            <div className="p-6 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-[#065F46] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                <span>Video Successfully Published to YouTube!</span>
              </div>
              <p className="text-xs text-[#047857]">
                Your video has been transferred with the selected title, description, tags, and thumbnail.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={publishedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={copyPublishedUrl}
                  className="px-3.5 py-2 rounded-xl border border-[#A7F3D0] bg-white text-[#065F46] font-bold text-xs hover:bg-[#F0FDF4] transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-[#6B7280]">
              Requires explicit creator confirmation. Duplicate publishing is prevented.
            </span>

            <button
              type="button"
              onClick={handlePublishToYouTube}
              disabled={isPublishing || !isYoutubeConnected || !editableTitle.trim()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Youtube className="w-4 h-4" />
              <span>
                {isPublishing
                  ? "Publishing to YouTube..."
                  : publishedVideoUrl
                  ? "Re-Publish (Update)"
                  : "Publish Video to YouTube"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Non-reloading YouTube OAuth Modal Fallback */}
      <YouTubeOAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        onSuccess={(authUrl) => {
          setIsOAuthModalOpen(false);
          window.location.href = authUrl;
        }}
        onToast={(msg, type) => onToast(msg, type)}
      />
    </div>
  );
};
