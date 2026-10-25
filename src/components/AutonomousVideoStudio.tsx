"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Film,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Play,
  Share2,
  Bookmark,
  ChevronRight,
  Youtube,
  Layers,
  BarChart2,
  Sliders,
  FileText,
  XCircle,
  Search,
  Award,
  TrendingUp,
  Eye,
  Image as ImageIcon,
  Palette,
  ShieldCheck,
} from "lucide-react";
import {
  VideoProcessingJob,
  ConsolidatedAnalysisReport,
  MediaMetadata,
  ShortCandidate,
} from "@/lib/types/videoWorkflow";
import { YouTubeOAuthModal } from "./YouTubeOAuthModal";
import { EditedVideoPlayer } from "./EditedVideoPlayer";
import { NicheResearchView } from "./studio/NicheResearchView";
import { ScorecardView } from "./studio/ScorecardView";
import { LearningFeedbackView } from "./studio/LearningFeedbackView";

interface AutonomousVideoStudioProps {
  onSaveToPlanner: (title: string, note: string, status?: string) => void;
  onToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const AutonomousVideoStudio: React.FC<AutonomousVideoStudioProps> = ({
  onSaveToPlanner,
  onToast,
}) => {
  // File upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [retentionFile, setRetentionFile] = useState<File | null>(null);
  const [topicHint, setTopicHint] = useState("");
  const [channelIdHint, setChannelIdHint] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Active Job state
  const [currentJob, setCurrentJob] = useState<VideoProcessingJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // YouTube OAuth Publishing state
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [channelTitle, setChannelTitle] = useState<string | null>(null);
  const [publishPrivacy, setPublishPrivacy] = useState<"private" | "unlisted" | "public">("private");
  const [selectedPublishAsset, setSelectedPublishAsset] = useState<"original" | "edited" | "short">("edited");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedVideoUrl, setPublishedVideoUrl] = useState<string | null>(null);
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const retentionInputRef = useRef<HTMLInputElement>(null);

  // Studio sub-tab navigation
  const [studioTab, setStudioTab] = useState<"video_pipeline" | "niche_research" | "pattern_scorecard" | "learning_feedback">("video_pipeline");
  const [scorecardTitle, setScorecardTitle] = useState("");
  const [scorecardTopic, setScorecardTopic] = useState("");

  // Editable publishing fields
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDesc, setEditableDesc] = useState("");
  const [editableTags, setEditableTags] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isRegeneratingPackaging, setIsRegeneratingPackaging] = useState(false);
  const [aiThumbnailConcepts, setAiThumbnailConcepts] = useState<any[]>([]);
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<string>("thumb_v1_curiosity");

  const handleRegeneratePackagingWithAI = async () => {
    setIsRegeneratingPackaging(true);
    try {
      const res = await fetch("/api/video/packaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicHint || "YouTube Video",
          currentTitle: editableTitle,
          transcriptText: currentJob?.report?.transcript?.text || "",
          durationSeconds: currentJob?.report?.media?.durationSeconds || 600,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate packaging");

      if (data.suggestedTitle) setEditableTitle(data.suggestedTitle);
      if (data.description) setEditableDesc(data.description);
      if (data.tags) setEditableTags(data.tags.join(", "));
      if (data.thumbnailConcepts) setAiThumbnailConcepts(data.thumbnailConcepts);
      setIsApproved(false);
      onToast(`Generated Title, Description & Thumbnails with ${data.notice || "Configured AI Model"}!`, "success");
    } catch (err: any) {
      onToast(err.message || "Packaging generation failed", "error");
    } finally {
      setIsRegeneratingPackaging(false);
    }
  };

  // Check YouTube OAuth connection status on mount & restore active job
  useEffect(() => {
    fetch("/api/youtube/auth")
      .then((r) => r.json())
      .then((data) => {
        setIsYoutubeConnected(Boolean(data.isConnected));
        if (data.channelTitle) setChannelTitle(data.channelTitle);
      })
      .catch(() => { });

    // Restore active job from localStorage so page never starts from scratch
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

  // Persist active job ID across page navigations & OAuth flow
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (currentJob?.id) {
          localStorage.setItem("nextvideo_active_job_id", currentJob.id);
        }
      }
    } catch {}
  }, [currentJob?.id]);

  // Listen for popup window OAuth completion message without page reload
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "YOUTUBE_OAUTH_SUCCESS") {
        setIsYoutubeConnected(true);
        if (event.data.channelTitle) {
          setChannelTitle(event.data.channelTitle);
        }
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
      if (!editableTitle) {
        setEditableTitle(rep.packaging?.alternativeTitles?.[0] || rep.seo?.suggestedTitle || "");
      }
      if (!editableDesc) {
        setEditableDesc(rep.seo?.description || "");
      }
      if (!editableTags) {
        setEditableTags(rep.seo?.tags?.join(", ") || "");
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
                onToast("video agent analysis complete! Report ready.", "success");
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
  }, [currentJob?.id, isPolling]);

  // Handle Video Upload
  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      onToast("Please select a video file (.mp4, .mov, .webm) first.", "info");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("file", videoFile);
      if (transcriptFile) formData.append("transcript", transcriptFile);
      if (retentionFile) formData.append("retention", retentionFile);
      if (topicHint.trim()) formData.append("topic", topicHint.trim());
      if (channelIdHint.trim()) formData.append("channelId", channelIdHint.trim());

      setUploadProgress(45);
      const res = await fetch("/api/video/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setUploadProgress(100);
      setCurrentJob(data.job || data);
      setIsPolling(true);
      onToast("Video uploaded successfully. Autonomous pipeline started!", "success");
    } catch (err: any) {
      onToast(err.message || "Upload failed. Please check file format.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    onToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedSection(null), 2500);
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

    // Fallback polling: check every 1.5s if YouTube connected in case postMessage blocked
    const pollTimer = setInterval(async () => {
      try {
        const r = await fetch("/api/youtube/auth");
        const d = await r.json();
        if (d.isConnected) {
          setIsYoutubeConnected(true);
          if (d.channelTitle) setChannelTitle(d.channelTitle);
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

  // Connect YouTube Account
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

  // Clear current active job and reset upload form
  const handleClearCurrentJob = () => {
    setCurrentJob(null);
    setVideoFile(null);
    setTranscriptFile(null);
    setRetentionFile(null);
    setTopicHint("");
    setChannelIdHint("");
    setEditableTitle("");
    setEditableDesc("");
    setEditableTags("");
    setIsApproved(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nextvideo_active_job_id");
    }
    onToast("Cleared active video. Ready for new upload.", "info");
  };

  // Approve and record in learning feedback loop
  const handleApproveAndStage = async () => {
    if (!currentJob?.report) return;
    try {
      const rep = currentJob.report;
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          channelId: channelTitle || "default_channel",
          originalTitle: topicHint || "Raw Video Upload",
          approvedTitle: editableTitle || rep.packaging?.alternativeTitles?.[0] || rep.seo?.suggestedTitle,
          approvedDescription: editableDesc || rep.seo?.description,
          approvedTags: editableTags ? editableTags.split(",").map((s) => s.trim()).filter(Boolean) : rep.seo?.tags,
          appliedCutsCount: rep.editing?.edl?.cuts?.length || 0,
          timeSavedSeconds: rep.editing?.edl?.removed || 0,
          modelVersionUsed: "selected_llm",
          providerUsed: "NextVideo Engine",
        }),
      });
      if (res.ok) {
        setIsApproved(true);
        onToast("Optimized assets approved and recorded in learning loop!", "success");
      }
    } catch {
      onToast("Failed to record approval in feedback loop.", "error");
    }
  };

  // Publish Video to YouTube
  const handlePublishToYouTube = async () => {
    if (!currentJob || !currentJob.report) return;
    setIsPublishing(true);
    setPublishedVideoUrl(null);

    try {
      const report: ConsolidatedAnalysisReport = currentJob.report;
      const finalTitle = editableTitle || report.packaging.alternativeTitles[0] || report.seo.suggestedTitle;
      const finalDesc = editableDesc || report.seo.description;
      const finalTags = editableTags ? editableTags.split(",").map(s => s.trim()).filter(Boolean) : report.seo.tags;

      const res = await fetch("/api/youtube/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: currentJob.id,
          privacy: publishPrivacy,
          selectedAsset: selectedPublishAsset,
          title: finalTitle,
          description: finalDesc,
          tags: finalTags,
          selectedThumbnailId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publishing failed");

      setPublishedVideoUrl(data.videoUrl);
      onToast(`Published to YouTube as ${publishPrivacy.toUpperCase()}!`, "success");

      // Auto-record publication in learning feedback loop
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          channelId: channelTitle || "default_channel",
          originalTitle: topicHint || "Raw Video Upload",
          approvedTitle: finalTitle,
          approvedDescription: finalDesc,
          approvedTags: finalTags,
          appliedCutsCount: report.editing?.edl?.cuts?.length || 0,
          timeSavedSeconds: report.editing?.edl?.removed || 0,
          modelVersionUsed: "selected_llm",
          providerUsed: "NextVideo Engine",
          publishedToYouTube: true,
          publishedVideoId: data.videoId,
          publishedAt: new Date().toISOString(),
          publishedPrivacy: publishPrivacy,
        }),
      }).catch(() => {});
    } catch (err: any) {
      onToast(err.message || "Failed to publish video.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const report: ConsolidatedAnalysisReport | undefined = currentJob?.report;

  return (
    <div className="space-y-6">
      {/* Studio Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F3F4F6] rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setStudioTab("video_pipeline")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            studioTab === "video_pipeline"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Video Analysis & Production</span>
        </button>

        <button
          type="button"
          onClick={() => setStudioTab("niche_research")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            studioTab === "niche_research"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Niche Research & Outliers</span>
        </button>

        <button
          type="button"
          onClick={() => setStudioTab("pattern_scorecard")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            studioTab === "pattern_scorecard"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Pattern Diagnostic & Scorecard</span>
        </button>

        <button
          type="button"
          onClick={() => setStudioTab("learning_feedback")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            studioTab === "learning_feedback"
              ? "bg-white text-[#111827] shadow-xs"
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Learning & Feedback History</span>
        </button>
      </div>

      {/* Niche Research View */}
      {studioTab === "niche_research" && (
        <NicheResearchView
          onApplyTitleToPlanner={onSaveToPlanner}
          onSendToScorecard={(t, topic) => {
            setScorecardTitle(t);
            setScorecardTopic(topic);
            setStudioTab("pattern_scorecard");
          }}
          onToast={onToast}
        />
      )}

      {/* Pattern Diagnostic Scorecard View */}
      {studioTab === "pattern_scorecard" && (
        <ScorecardView
          initialTitle={scorecardTitle || editableTitle}
          initialTopic={scorecardTopic || topicHint}
          initialHook={report?.transcript?.cues?.slice(0, 5).map(c => c.text).join(" ")}
          onApplyTitle={(t) => {
            setEditableTitle(t);
            setStudioTab("video_pipeline");
            onToast("Applied title to publishing stage!", "info");
          }}
          onToast={onToast}
        />
      )}

      {/* Learning & Feedback Loop History */}
      {studioTab === "learning_feedback" && (
        <LearningFeedbackView onToast={onToast} />
      )}

      {/* Video Pipeline Workflow */}
      {studioTab === "video_pipeline" && (
        <div className="space-y-6">
          {/* Upload & Job Setup Card */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YouTube Agent Skill Autonomous Workflow</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
              Upload Video for Autonomous Analysis & Deliverables
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Upload your video file (.mp4, .mov, .webm). NextVideo will automatically orchestrate all 11 YouTube agent skills to evaluate hook strength, generate timestamped CMX 3600 edit cuts, extract candidate Shorts, compose verified chapters, and prepare publication assets.
            </p>
          </div>

          {currentJob && currentJob.status && (
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${currentJob.status === "completed"
                    ? "bg-[#ECFDF5] text-[#059669]"
                    : currentJob.status === "failed"
                      ? "bg-[#FEF2F2] text-[#DC2626]"
                      : "bg-[#EFF6FF] text-[#2563EB] animate-pulse"
                  }`}
              >
                {(currentJob.status || "uploaded").replace("_", " ")}
              </span>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleStartUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Video File Picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${videoFile
                  ? "border-[#3B82F6] bg-[#EFF6FF]/30"
                  : "border-[#E2E5EB] hover:border-[#3B82F6] bg-[#F9FAFB]"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
                }}
              />
              <Film className={`w-8 h-8 mb-2 ${videoFile ? "text-[#3B82F6]" : "text-[#9CA3AF]"}`} />
              <div className="text-xs font-bold text-[#111827]">
                {videoFile ? videoFile.name : "Select Video File"}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">
                {videoFile
                  ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`
                  : "MP4, MOV, WebM up to 500MB"}
              </div>
            </div>

            {/* Optional Subtitles / Transcript Picker */}
            <div
              onClick={() => transcriptInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${transcriptFile
                  ? "border-[#10B981] bg-[#ECFDF5]/30"
                  : "border-[#E2E5EB] hover:border-[#10B981] bg-[#F9FAFB]"
                }`}
            >
              <input
                ref={transcriptInputRef}
                type="file"
                accept=".srt,.vtt,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setTranscriptFile(e.target.files[0]);
                }}
              />
              <FileText className={`w-8 h-8 mb-2 ${transcriptFile ? "text-[#10B981]" : "text-[#9CA3AF]"}`} />
              <div className="text-xs font-bold text-[#111827]">
                {transcriptFile ? transcriptFile.name : "Optional Transcript (.srt / .vtt)"}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">
                {transcriptFile ? "File attached" : "Auto-transcribed if omitted"}
              </div>
            </div>

            {/* Optional YouTube Studio Retention CSV */}
            <div
              onClick={() => retentionInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${retentionFile
                  ? "border-[#8B5CF6] bg-[#F5F3FF]/30"
                  : "border-[#E2E5EB] hover:border-[#8B5CF6] bg-[#F9FAFB]"
                }`}
            >
              <input
                ref={retentionInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setRetentionFile(e.target.files[0]);
                }}
              />
              <BarChart2 className={`w-8 h-8 mb-2 ${retentionFile ? "text-[#8B5CF6]" : "text-[#9CA3AF]"}`} />
              <div className="text-xs font-bold text-[#111827]">
                {retentionFile ? retentionFile.name : "Optional Retention (.csv)"}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">
                {retentionFile ? "CSV attached" : "YouTube Studio Audience retention export"}
              </div>
            </div>
          </div>

          {/* Hint inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                Video Topic / Working Title (Optional Hint)
              </label>
              <input
                type="text"
                value={topicHint}
                onChange={(e) => setTopicHint(e.target.value)}
                placeholder="e.g. Next.js 14 Complete Production Guide"
                className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                YouTube Channel ID or Handle (Optional for Niche Research)
              </label>
              <input
                type="text"
                value={channelIdHint}
                onChange={(e) => setChannelIdHint(e.target.value)}
                placeholder="e.g. @traversymedia or UCMx_z66i"
                className="w-full px-3.5 py-2 bg-[#F9FAFB] border border-[#E2E5EB] focus:border-[#3B82F6] rounded-xl text-xs text-[#111827] focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-[#3B82F6]">
                <span>Uploading media to local storage adapter...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#3B82F6] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isUploading || isPolling || !videoFile}
              className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-300 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? "Uploading..." : isPolling ? "Processing Workflow..." : "Start Autonomous Analysis →"}</span>
            </button>

            {videoFile && (
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setTranscriptFile(null);
                  setRetentionFile(null);
                }}
                className="text-xs text-[#6B7280] hover:text-[#DC2626] cursor-pointer"
              >
                Clear Selected Files
              </button>
            )}
          </div>
        </form>

        {/* Live Processing Stepper */}
        {currentJob && (
          <div className="mt-6 pt-6 border-t border-[#F0F2F5] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-[#3B82F6] ${isPolling ? "animate-spin" : ""}`} />
                <span className="text-xs font-bold text-[#111827]">
                  {currentJob.currentStage || "Orchestrating video pipeline..."}
                </span>
              </div>
              <span className="text-xs font-bold text-[#3B82F6]">
                {currentJob.progressPercent}%
              </span>
            </div>

            <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${currentJob.status === "failed" ? "bg-[#DC2626]" : "bg-[#3B82F6]"
                  }`}
                style={{ width: `${currentJob.progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B7280] pt-1">
              {["uploaded", "transcribing", "analyzing", "generating_outputs", "completed"].map((st, i) => (
                <span
                  key={st}
                  className={`px-2 py-0.5 rounded-full ${currentJob.status === st
                      ? "bg-[#3B82F6] text-white font-bold"
                      : currentJob.progressPercent >= (i + 1) * 20
                        ? "bg-[#ECFDF5] text-[#059669] font-medium"
                        : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                >
                  {st.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Complete Consolidated Report when available */}
      {report && (
        <div className="space-y-6">
          {/* Section 1: Highest Priority Recommendation Banner */}
          {report.highestPriorityRecommendation && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[24px] p-5 flex items-start gap-3.5">
              <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1E40AF] uppercase tracking-wide">
                  Highest-Priority Optimization Opportunity
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#1E3A8A]">
                  {report.highestPriorityRecommendation}
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Media Specs & Content Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[24px] border border-[#E8EAEE] p-5 shadow-xs space-y-3">
              <div className="text-xs font-bold text-[#111827] border-b border-[#F0F2F5] pb-2 flex items-center justify-between">
                <span>Technical Media Specifications</span>
                <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Duration</span>
                  <span className="font-bold text-[#111827]">
                    {Math.floor(report.media.durationSeconds / 60)}m {Math.round(report.media.durationSeconds % 60)}s
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Resolution</span>
                  <span className="font-bold text-[#111827]">
                    {report.media.width} × {report.media.height} ({report.media.aspectRatio || "16:9"})
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Streams Verified</span>
                  <span className="font-bold text-[#059669]">
                    {report.media.hasVideoTrack ? "Video ✓" : "No Video"} • {report.media.hasAudioTrack ? "Audio ✓" : "No Audio"}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Inspection Engine</span>
                  <span className="font-mono text-[10px] text-[#4B5563] uppercase">
                    {report.media.inspectedWith}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Summary */}
            <div className="md:col-span-2 bg-white rounded-[24px] border border-[#E8EAEE] p-5 shadow-xs space-y-3">
              <div className="text-xs font-bold text-[#111827] border-b border-[#F0F2F5] pb-2 flex items-center justify-between">
                <span>Content Summary & Spoken Transcript</span>
                <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                  {report.transcript.cues.length} Cues Verified
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[#374151]">
                {report.transcript.text.slice(0, 300)}...
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#6B7280]">
                  Total Words: {report.transcript.text.split(/\s+/).filter(Boolean).length}
                </span>
                <button
                  onClick={() => copyToClipboard(report.transcript.text, "transcript")}
                  className="inline-flex items-center gap-1.5 text-xs text-[#3B82F6] hover:underline font-bold cursor-pointer"
                >
                  {copiedSection === "transcript" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === "transcript" ? "Copied" : "Copy Full Transcript"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2.5: Computer Vision Analysis & Grounded Video Understanding */}
          {report.vision && (
            <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F2F5] pb-3">
                <div>
                  <div className="text-xs font-bold text-[#3B82F6] uppercase flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Computer Vision & Multimodal Understanding</span>
                  </div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Representative Visual Frames & Scene Progression ({report.vision.sampledFrames.length} Keyframes)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full text-[11px] font-bold border border-[#BFDBFE] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#059669]" />
                    <span>{report.vision.supportsVision ? "Vision Model Active" : "Deterministic CV Engine"}</span>
                  </span>
                  <span className="px-2.5 py-1 bg-[#ECFDF5] text-[#059669] rounded-full text-[11px] font-bold">
                    {report.vision.confidenceScore}% Evidence Confidence
                  </span>
                </div>
              </div>

              {/* Grounded Understanding Synthesis */}
              {report.understanding && (
                <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">Grounded Video Topic</span>
                    <p className="font-bold text-[#111827]">{report.understanding.actualTopic}</p>
                    <span className="text-[10px] text-[#059669] font-medium block mt-1">✓ Grounded in video + audio evidence</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">Primary Value Proposition</span>
                    <p className="text-[#374151] leading-tight">{report.understanding.primaryValueProposition}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">Intended Audience & Climax</span>
                    <p className="text-[#374151] font-medium">{report.understanding.targetAudience}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span className="font-bold text-[#3B82F6]">Climax Payoff: {report.understanding.narrativeClimaxSeconds}s</span>
                      <span className="text-[#6B7280]">•</span>
                      <span className="text-[#6B7280]">{report.vision.visualPacing.toUpperCase()} pacing</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sampled Representative Keyframes Gallery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#111827]">
                  <span>Sampled Keyframes & Visual Composition</span>
                  <span className="text-[11px] text-[#6B7280] font-normal">
                    Sampled at 5%, 20%, 50%, 75%, 90% timestamps • Deduplicated
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {report.vision.sampledFrames.map((frame, idx) => (
                    <div
                      key={frame.index}
                      className="p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-[#111827] text-white rounded-md text-[10px] font-bold font-mono">
                            {Math.floor(frame.timestampSeconds / 60)}:{(frame.timestampSeconds % 60).toFixed(0).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] font-bold text-[#3B82F6]">
                            {frame.relativePercent}%
                          </span>
                        </div>
                        <p className="font-bold text-[#111827] text-[11px] leading-tight line-clamp-1">
                          {frame.label}
                        </p>
                      </div>

                      <div className="space-y-1 text-[10px] text-[#6B7280]">
                        <div className="flex items-center justify-between">
                          <span>Scene Type:</span>
                          <span className="font-bold text-[#111827] capitalize">
                            {frame.sceneType.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Contrast:</span>
                          <span className="font-bold text-[#059669]">
                            {frame.properties.contrastScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <span className="text-[9px]">Palette:</span>
                          <div className="flex items-center gap-1">
                            {frame.properties.dominantColors.map((hex, ci) => (
                              <span
                                key={ci}
                                className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-2xs"
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                          </div>
                        </div>
                        {frame.properties.detectedOnScreenText.length > 0 && (
                          <div className="text-[9px] text-[#2563EB] font-bold truncate">
                            Text: {frame.properties.detectedOnScreenText.join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-[#E5E7EB] flex items-center justify-between text-[10px]">
                        <span className="text-[#6B7280]">Thumb Suitability:</span>
                        <span className="font-bold text-[#2563EB]">
                          {frame.properties.thumbnailSuitabilityScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prompt Injection & Capability Defense Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-[11px] text-[#166534]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>
                    <strong>Prompt Injection Defense:</strong> All audio transcripts, slide text, and OCR data are isolated as untrusted data boundaries.
                  </span>
                </div>
                {report.vision.limitations.length > 0 && (
                  <span className="text-[10px] text-[#854D0E] bg-[#FEF9C3] px-2 py-0.5 rounded-full font-medium">
                    {report.vision.limitations[0]}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Hook Diagnostics (yt-script) */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F2F5] pb-3">
              <div>
                <div className="text-xs font-bold text-[#2563EB] uppercase">yt-script Assessment</div>
                <h3 className="text-base font-bold text-[#111827]">Opening 15 Seconds Hook Score & Breakdown</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-lg font-black text-[#111827]">
                    {Math.round(report.hookAnalysis.hookScore.verdict * 10)}/100
                  </div>
                  <div className="text-[10px] font-bold text-[#6B7280] uppercase">
                    {report.hookAnalysis.hookScore.band}
                  </div>
                </div>
              </div>
            </div>

            {/* Actual Opening Text */}
            <div className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <div className="text-[11px] font-bold text-[#6B7280] mb-1">Detected Spoken Opening (First 15s):</div>
              <div className="text-xs italic text-[#111827]">"{report.hookAnalysis.first15SecondsSpeech}"</div>
            </div>

            {/* Score breakdown pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(report.hookAnalysis.hookScore.properties).map(([key, val]) => (
                <div key={key} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] text-center">
                  <div className="text-[10px] text-[#6B7280] uppercase font-bold">{key}</div>
                  <div className="text-base font-black text-[#111827] mt-1">{String(val)}/10</div>
                </div>
              ))}
            </div>

            {/* Weakest link diagnosis */}
            {report.hookAnalysis.hookScore.weakest && (
              <div className="p-3.5 bg-[#FEF2F2] rounded-xl border border-[#FEE2E2] text-xs text-[#991B1B]">
                <strong>Weakest Link Diagnosis ({report.hookAnalysis.hookScore.weakest.property}):</strong>{" "}
                {report.hookAnalysis.hookScore.weakest.fix}
              </div>
            )}

            {/* Rewritten Hook Alternatives */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-[#111827]">Formula-Driven Hook Rewrites:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {report.hookAnalysis.proposedAlternativeHooks.map((opt: string, i: number) => (
                  <div key={i} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex flex-col justify-between space-y-2">
                    <p className="text-xs font-medium text-[#111827]">"{opt}"</p>
                    <button
                      onClick={() => copyToClipboard(opt, `hook_${i}`)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#3B82F6] hover:underline font-bold cursor-pointer"
                    >
                      {copiedSection === `hook_${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Hook</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Title & Thumbnail Packaging (yt-package) */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
            <div className="text-xs font-bold text-[#2563EB] uppercase">yt-package Assessment</div>
            <h3 className="text-base font-bold text-[#111827]">Packaging Audit & High-CTR Title Alternatives</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recommended Titles */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#4B5563]">Recommended Title Options:</div>
                {report.packaging.alternativeTitles.map((t: string, i: number) => (
                  <div key={i} className="p-3.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827]">{t}</span>
                      <button
                        onClick={() => copyToClipboard(t, `title_${i}`)}
                        className="p-1 text-[#6B7280] hover:text-[#3B82F6] cursor-pointer"
                      >
                        {copiedSection === `title_${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      Optimized for curiosity & clarity • <span className="font-semibold text-[#059669]">{t.length} chars</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thumbnail Concept & Wording */}
              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-3">
                <div className="text-xs font-bold text-[#4B5563]">Thumbnail Visual Concept:</div>
                {report.packaging.thumbnailConcepts[0] && (
                  <p className="text-xs text-[#374151] leading-relaxed">
                    {report.packaging.thumbnailConcepts[0].visualDescription}
                  </p>
                )}
                <div className="p-3 bg-white rounded-xl border border-[#E5E7EB]">
                  <div className="text-[10px] font-bold text-[#6B7280] uppercase">Recommended Thumbnail Text:</div>
                  <div className="text-sm font-black text-[#2563EB] mt-0.5">
                    {report.packaging.thumbnailConcepts[0]?.headline || "3 SECRETS"}
                  </div>
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  <strong>Packaging Rule:</strong> Do not repeat the exact title words on the thumbnail; use visual curiosity triggers instead.
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Timestamped Edit Decision List (yt-edit) */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2F5] pb-3">
              <div>
                <div className="text-xs font-bold text-[#2563EB] uppercase">yt-edit Decision List</div>
                <h3 className="text-base font-bold text-[#111827]">
                  Pacing Optimization & Dead Air / Filler Cuts ({report.editing.edl.cuts.length} cuts identified)
                </h3>
              </div>
            </div>

            {/* In-Browser Cut-Skipping Player & Native Video Exporter */}
            {currentJob?.fileUrl && (
              <EditedVideoPlayer
                videoUrl={currentJob.fileUrl}
                cuts={report.editing.edl.cuts}
                duration={report.editing.edl.duration}
                filename={currentJob.filename}
                assetId={currentJob.assetId}
                onToast={onToast}
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase">Original Length</div>
                <div className="text-sm font-bold text-[#111827] mt-0.5">{Math.round(report.editing.edl.duration)}s</div>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase">Post-Cut Length</div>
                <div className="text-sm font-bold text-[#059669] mt-0.5">
                  {Math.round(report.editing.edl.out)}s
                </div>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase">Time Saved</div>
                <div className="text-sm font-bold text-[#2563EB] mt-0.5">{Math.round(report.editing.edl.removed)}s</div>
              </div>
              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                <div className="text-[10px] text-[#6B7280] uppercase">Duration Reduction</div>
                <div className="text-sm font-bold text-[#8B5CF6] mt-0.5">{report.editing.edl.reductionPercent}%</div>
              </div>
            </div>

            {/* Cuts Sample Table */}
            {report.editing.edl.cuts.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-[#E5E7EB]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] text-[#6B7280] font-bold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-2.5">Timecode</th>
                      <th className="p-2.5">Cut Kind</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F5]">
                    {report.editing.edl.cuts.slice(0, 10).map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-[#F9FAFB]">
                        <td className="p-2.5 font-mono text-[#3B82F6]">
                          {c.start.toFixed(1)}s - {c.end.toFixed(1)}s
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.kind === "dead_air"
                                ? "bg-[#FEF2F2] text-[#DC2626]"
                                : c.kind === "repeat"
                                  ? "bg-[#FEF3C7] text-[#D97706]"
                                  : "bg-[#EFF6FF] text-[#2563EB]"
                              }`}
                          >
                            {c.kind}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-[#111827]">
                          {(c.end - c.start).toFixed(2)}s
                        </td>
                        <td className="p-2.5 text-[#6B7280]">{c.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 6: Candidate Shorts Opportunities (yt-shorts) */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
            <div className="text-xs font-bold text-[#2563EB] uppercase">yt-shorts Discovery</div>
            <h3 className="text-base font-bold text-[#111827]">
              Extracted Short-Form Vertical Candidates ({report.shorts.candidates.length} clips found)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.shorts.candidates.map((sc: ShortCandidate, i: number) => (
                <div key={i} className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827]">Candidate #{i + 1}</span>
                    <span className="text-[10px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                      {sc.startTime}s - {sc.endTime}s ({sc.durationSeconds}s)
                    </span>
                  </div>
                  <p className="text-xs text-[#374151] font-medium">"{sc.openingLine}"</p>
                  <div className="text-[11px] text-[#6B7280]">
                    <strong>On-Screen Overlay:</strong> {sc.suggestedOnScreenText}
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[#059669] font-bold">
                      Hook Score: {Math.round((sc.hookScore?.verdict || 8.5) * 10)}/100
                    </span>
                    <button
                      onClick={() => {
                        onSaveToPlanner(
                          `Short: ${sc.openingLine.slice(0, 30)}...`,
                          `From Video: ${report.seo.suggestedTitle}\nTimecodes: ${sc.startTime}s - ${sc.endTime}s\nOverlay: ${sc.suggestedOnScreenText}`,
                          "Idea"
                        );
                        onToast("Short added to Content Planner!", "success");
                      }}
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-bold cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Send to Planner</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Validated YouTube Chapters (yt-chapters) */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
              <div>
                <div className="text-xs font-bold text-[#2563EB] uppercase">yt-chapters Validation</div>
                <h3 className="text-base font-bold text-[#111827]">Validated YouTube Timestamps</h3>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    report.chapters.chapters.map((c: any) => `${c.timestamp} ${c.title}`).join("\n"),
                    "chapters"
                  )
                }
                className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSection === "chapters" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === "chapters" ? "Copied" : "Copy Chapters"}</span>
              </button>
            </div>

            <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-1.5">
              {report.chapters.chapters.map((ch: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="font-mono font-bold text-[#3B82F6] w-12">{ch.timestamp}</span>
                  <span className="text-[#111827] font-medium">{ch.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Direct YouTube OAuth 2.0 Publishing */}
          <div className="bg-white rounded-[28px] border border-[#E8EAEE] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2F5] pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DC2626] uppercase">
                  <Youtube className="w-4 h-4 fill-[#DC2626] text-white" />
                  <span>Direct YouTube Publishing (OAuth 2.0)</span>
                </div>
                <h3 className="text-base font-bold text-[#111827] mt-0.5">
                  Publish Analyzed or Edited Video to Your Channel
                </h3>
              </div>

              {isYoutubeConnected ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span className="text-xs font-bold text-[#059669]">
                    Connected: {channelTitle || "YouTube Channel"}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectYouTube}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>Connect YouTube Channel</span>
                </button>
              )}
            </div>

            {/* Creator Review & Edit Asset Form */}
            <div className="space-y-3 p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                <div>
                  <span className="text-xs font-bold text-[#111827]">
                    Review, Edit & Approve Generated Assets
                  </span>
                  <p className="text-[11px] text-[#6B7280]">
                    Verify every field before publishing. Approved changes train the learning feedback loop.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleRegeneratePackagingWithAI}
                    disabled={isRegeneratingPackaging}
                    className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-[#BFDBFE]"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isRegeneratingPackaging ? "animate-spin" : ""}`} />
                    <span>{isRegeneratingPackaging ? "Regenerating..." : "✨ Regenerate with Model"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveAndStage}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isApproved
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-xs"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isApproved ? "Approved ✓" : "Approve & Record in Learning Loop"}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-[#6B7280]">
                    Approved Video Title ({editableTitle.length} chars)
                  </label>
                  <span className={`text-[10px] font-medium ${editableTitle.length > 50 ? "text-[#D97706]" : "text-[#059669]"}`}>
                    {editableTitle.length > 50 ? "Truncated on mobile search" : "Mobile-safe length (< 50 chars)"}
                  </span>
                </div>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => {
                    setEditableTitle(e.target.value);
                    setIsApproved(false);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E2E5EB] rounded-xl text-xs text-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                  Approved Description with Timestamps & Call to Action
                </label>
                <textarea
                  rows={4}
                  value={editableDesc}
                  onChange={(e) => {
                    setEditableDesc(e.target.value);
                    setIsApproved(false);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E2E5EB] rounded-xl text-xs text-[#111827] focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">
                  Approved Tags (comma-separated metadata aids)
                </label>
                <input
                  type="text"
                  value={editableTags}
                  onChange={(e) => {
                    setEditableTags(e.target.value);
                    setIsApproved(false);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E2E5EB] rounded-xl text-xs text-[#111827] focus:outline-none"
                />
              </div>

              {/* Real Generated 1280x720 YouTube Thumbnails Gallery */}
              {((currentJob?.report?.publishingPackage?.thumbnails && currentJob.report.publishingPackage.thumbnails.length > 0) ||
                (currentJob?.derivedAssets?.generatedThumbnails && currentJob.derivedAssets.generatedThumbnails.length > 0)) && (
                <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <label className="text-[11px] font-bold text-[#111827] block flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>Generated YouTube Thumbnails (1280×720 • 16:9 Broadcast Quality)</span>
                      </label>
                      <p className="text-[10px] text-[#6B7280]">
                        Click to select the active thumbnail for publishing. Validated under YouTube 2MB & 16:9 rules.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] w-fit">
                      YouTube Specs Verified ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {(currentJob?.report?.publishingPackage?.thumbnails || currentJob?.derivedAssets?.generatedThumbnails || []).map((thumb: any) => {
                      const isSelected = selectedThumbnailId === thumb.id;
                      return (
                        <div
                          key={thumb.id}
                          onClick={() => setSelectedThumbnailId(thumb.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                            isSelected
                              ? "bg-[#EFF6FF] border-[#3B82F6] ring-2 ring-[#3B82F6]/30 shadow-xs"
                              : "bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#CBD5E1]"
                          }`}
                        >
                          <div className="space-y-1.5">
                            {/* 16:9 Visual Preview Box */}
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/90 border border-black/10 group">
                              <img
                                src={thumb.imageUrl}
                                alt={thumb.headline}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e: any) => {
                                  // Fallback display if direct URL image rendering fails
                                  e.target.style.display = "none";
                                }}
                              />
                              {/* Overlay Badge */}
                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#111827]/90 text-white rounded font-mono font-bold text-[9px] backdrop-blur-xs">
                                {thumb.width}×{thumb.height} • {thumb.format.toUpperCase()}
                              </div>
                              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#059669] text-white rounded font-bold text-[9px] shadow-xs">
                                {(thumb.sizeBytes / 1024).toFixed(0)} KB (&lt; 2MB)
                              </div>
                            </div>

                            {/* Title & Headline */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-bold text-[#111827] line-clamp-1">
                                {thumb.variationName}
                              </span>
                              <span className="px-2 py-0.5 bg-[#111827] text-white rounded font-black text-[10px] tracking-wider shrink-0">
                                {thumb.headline}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#4B5563] leading-tight line-clamp-2">
                              {thumb.rationale}
                            </p>
                          </div>

                          {/* Footer Action & Download */}
                          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedThumbnailId(thumb.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                                isSelected
                                  ? "bg-[#3B82F6] text-white"
                                  : "bg-white text-[#4B5563] border border-[#D1D5DB] hover:bg-[#F3F4F6]"
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isSelected ? "Active ✓" : "Select"}</span>
                            </button>

                            <a
                              href={`${thumb.imageUrl}?download=1`}
                              download={`youtube_thumbnail_${thumb.id}.png`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download 720p</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Thumbnail Visual Direction Fallback */}
              {(!currentJob?.report?.publishingPackage?.thumbnails || currentJob.report.publishingPackage.thumbnails.length === 0) &&
                (aiThumbnailConcepts.length > 0 || (currentJob?.report?.packaging?.thumbnailConcepts && currentJob.report.packaging.thumbnailConcepts.length > 0)) && (
                <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                  <label className="text-[11px] font-bold text-[#6B7280] block">
                    AI-Generated Visual Thumbnail Concepts & Text Overlays
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {(aiThumbnailConcepts.length > 0 ? aiThumbnailConcepts : currentJob?.report?.packaging?.thumbnailConcepts || []).slice(0, 3).map((th: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-[#E2E5EB] space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-[#111827] text-white rounded font-black text-[10px] tracking-wider">
                            {th.headline}
                          </span>
                          <span className="text-[10px] text-[#6B7280]">Option #{idx + 1}</span>
                        </div>
                        <p className="text-[#374151] font-medium leading-tight">
                          {th.visualDescription}
                        </p>
                        <div className="text-[10px] text-[#6B7280]">
                          Palette: <span className="font-semibold text-[#1F2937]">{th.colorPalette}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Select Asset to Publish</label>
                <select
                  value={selectedPublishAsset}
                  onChange={(e) => setSelectedPublishAsset(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#111827] focus:outline-none"
                >
                  <option value="edited">First-Pass Edited Video (Cuts Applied)</option>
                  <option value="original">Original Uploaded Video</option>
                  <option value="short">Short Candidate #1</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] block mb-1">Privacy Status</label>
                <select
                  value={publishPrivacy}
                  onChange={(e) => setPublishPrivacy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E2E5EB] rounded-xl text-xs text-[#111827] focus:outline-none"
                >
                  <option value="private">Private (Safest - Review First)</option>
                  <option value="unlisted">Unlisted (Share via link)</option>
                  <option value="public">Public (Immediate Live)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handlePublishToYouTube}
                  disabled={isPublishing || !isYoutubeConnected}
                  className="w-full py-2 bg-[#DC2626] hover:bg-[#B91C1C] disabled:bg-gray-300 text-white rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isPublishing ? "Uploading to YouTube..." : "Publish to YouTube →"}</span>
                </button>
              </div>
            </div>

            {publishedVideoUrl && (
              <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span className="text-xs font-bold text-[#065F46]">
                    Successfully published to YouTube!
                  </span>
                </div>
                <a
                  href={publishedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] hover:underline"
                >
                  <span>View on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      )}

      <YouTubeOAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        onSuccess={(authUrl) => {
          setIsOAuthModalOpen(false);
          openOAuthPopup(authUrl);
        }}
        onToast={onToast}
      />
    </div>
  );
};
