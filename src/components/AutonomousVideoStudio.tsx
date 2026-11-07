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
  Mic,
} from "lucide-react";
import { VideoProcessingJob, ConsolidatedAnalysisReport } from "@/lib/types/videoWorkflow";
import { TitleOption, GeneratedThumbnail } from "@/lib/types/visionWorkflow";
import {
  PublishingLifecycleRecord,
  PublishingLifecycleEvent,
  PublishingLifecycleState,
  transitionPublishingState,
} from "@/lib/types/publishingLifecycle";
import { YouTubeOAuthModal } from "./YouTubeOAuthModal";
import { upload as uploadBlob } from "@vercel/blob/client";

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
  const [showTranscriptSegments, setShowTranscriptSegments] = useState(false);
  const [isRegeneratingPackaging, setIsRegeneratingPackaging] = useState(false);

  // Step 4: YouTube OAuth & Publishing state driven by lifecycle state machine
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [channelTitle, setChannelTitle] = useState<string | null>(null);
  const [channelAvatar, setChannelAvatar] = useState<string | null>(null);
  const [publishPrivacy, setPublishPrivacy] = useState<"private" | "unlisted" | "public">("private");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedVideoUrl, setPublishedVideoUrl] = useState<string | null>(null);
  const [publishedVideoId, setPublishedVideoId] = useState<string | null>(null);
  const [publishedThumbnailStatus, setPublishedThumbnailStatus] = useState<string | null>(null);
  const [publishedThumbnailError, setPublishedThumbnailError] = useState<string | null>(null);
  const [lifecycleRecord, setLifecycleRecord] = useState<PublishingLifecycleRecord>({
    state: "Draft",
    assetId: "",
    jobId: "",
    updatedAt: new Date().toISOString(),
  });
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const dispatchLifecycle = (event: PublishingLifecycleEvent) => {
    setLifecycleRecord((prev) => transitionPublishingState(prev, event));
  };

  // Sync current job details with lifecycle record
  useEffect(() => {
    if (currentJob?.id) {
      setLifecycleRecord((prev) => ({
        ...prev,
        jobId: currentJob.id,
        assetId: currentJob.assetId || prev.assetId,
      }));
    }
  }, [currentJob?.id, currentJob?.assetId]);

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
                // Restore publishing lifecycle and interrupted upload session
                if (job.publishingLifecycle) {
                  setLifecycleRecord(job.publishingLifecycle);
                  if (job.publishingLifecycle.videoId) {
                    setPublishedVideoId(job.publishingLifecycle.videoId);
                    setPublishedVideoUrl(`https://youtu.be/${job.publishingLifecycle.videoId}`);
                  }
                  if (job.publishingLifecycle.thumbnailStatus) {
                    setPublishedThumbnailStatus(job.publishingLifecycle.thumbnailStatus);
                  }
                  if (job.publishingLifecycle.thumbnailError) {
                    setPublishedThumbnailError(job.publishingLifecycle.thumbnailError);
                  }
                } else if (job.uploadSessionUrl) {
                  setLifecycleRecord({
                    state: "UploadInterrupted",
                    assetId: job.assetId,
                    jobId: job.id,
                    uploadSessionUrl: job.uploadSessionUrl,
                    updatedAt: new Date().toISOString(),
                  });
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
        "";

      if (!editableTitle) {
        setEditableTitle(initialTitle);
        // Suggestion is prefilled, but selection requires a card click.
      }

      if (!editableDesc) {
        setEditableDesc(pkg?.description || "");
      }

      if (!editableTags) {
        const tags = pkg?.tags || [];
        setEditableTags(Array.isArray(tags) ? tags.join(", ") : String(tags));
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
                const hasTitles = (updated.report?.publishingPackage?.titles?.length ?? 0) > 0;
                if (hasTitles) {
                  dispatchLifecycle({ type: "READY_FOR_REVIEW" });
                }
                const audioStatus = updated.report?.audioAnalysis?.status;
                const isAudioOk = audioStatus === "completed" || audioStatus === "no_audio";

                if (hasTitles && isAudioOk) {
                  onToast("Video analysis & publishing package ready for review!", "success");
                } else if (hasTitles && !isAudioOk) {
                  onToast("Visual analysis complete. Audio transcription was unavailable; review metadata.", "info");
                } else if (!hasTitles && isAudioOk) {
                  onToast("Video analyzed, but metadata generation needs attention. Check provider configuration in Settings.", "info");
                } else {
                  onToast("Visual frames analyzed. Audio processing and metadata generation encountered limitations.", "info");
                }
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
      const checkpoints = [0.08, 0.25, 0.5, 0.72, 0.9];
      let currentIdx = 0;

      const handleSeeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const targetWidth = 1280;
          const targetHeight = 720;
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Preserve the source video's aspect ratio; letterbox instead of stretching
            // faces, text, and other visual evidence into a 16:9 frame.
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            const sourceWidth = video.videoWidth;
            const sourceHeight = video.videoHeight;
            if (sourceWidth > 0 && sourceHeight > 0) {
              const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
              const drawWidth = Math.round(sourceWidth * scale);
              const drawHeight = Math.round(sourceHeight * scale);
              const x = Math.round((targetWidth - drawWidth) / 2);
              const y = Math.round((targetHeight - drawHeight) / 2);
              ctx.drawImage(video, x, y, drawWidth, drawHeight);
            }
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
      // A newly selected file starts a new workflow. Do not leave the previous
      // video's report, title/thumbnail selection, or publish result attached.
      setVideoFile(file);
      setVideoDuration(null);
      setCurrentJob(null);
      setIsPolling(false);
      setSelectedTitle("");
      setSelectedThumbnailId("");
      setEditableTitle("");
      setEditableDesc("");
      setEditableTags("");
      setPublishedVideoUrl(null);
      setPublishedVideoId(null);
      setCopiedLink(false);
      try {
        localStorage.removeItem("nextvideo_active_job_id");
      } catch {}
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
    setUploadProgress(0);

    try {
      const assetId = crypto.randomUUID().replace(/-/g, "");
      const extension = videoFile.name.includes(".") ? `.${videoFile.name.split(".").pop()!.toLowerCase()}` : ".mp4";
      const safeName = `${videoFile.name.replace(/\.[^.]*$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "video"}${extension}`;
      let blobPath: string | null = null;
      let job: VideoProcessingJob | null = null;
      const capturedFrames = await captureVideoFrames(videoFile);
      try {
        const blob = await uploadBlob(`nextvideo/${assetId}/${safeName}`, videoFile, {
          access: "private",
          handleUploadUrl: "/api/video/upload/token",
          clientPayload: JSON.stringify({ assetId, filename: videoFile.name, mimeType: videoFile.type }),
          multipart: videoFile.size > 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setUploadProgress(Math.min(90, Math.round(percentage * 0.85))),
        });
        blobPath = blob.pathname;

        setUploadProgress(93);
        const res = await fetch("/api/video/upload/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId, filename: videoFile.name, mimeType: videoFile.type, filesizeBytes: videoFile.size }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload registration failed");
        }
        const responseData = await res.json();
        job = responseData.job;
      } catch (blobError) {
        setUploadProgress(20);
        const formData = new FormData();
        formData.append("video", videoFile);
        capturedFrames.forEach((frame, index) => {
          formData.append(`frame_${index}`, frame, `frame_${index + 1}.jpg`);
        });
        const localRes = await fetch("/api/video/upload", { method: "POST", body: formData });
        const localData = await localRes.json();
        if (!localRes.ok) {
          throw new Error(
            localData.error ||
              (blobError instanceof Error ? blobError.message : "Upload failed")
          );
        }
        job = localData.job;
      }

      setUploadProgress(100);
      if (blobPath && !blobPath.endsWith(safeName)) throw new Error("Uploaded object path did not match the registered video.");
      if (!job) throw new Error("Upload completed but no processing job was returned.");
      setCurrentJob(job);
      setIsPolling(true);
      onToast("Video uploaded! Analyzing content & generating publishing assets...", "success");
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "";
      onToast(
        message.includes("client token") || message.includes("BLOB_STORAGE_NOT_CONFIGURED")
          ? "Video upload storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel Project Settings > Environment Variables, then redeploy."
          : message || "Upload failed. Please check your video file format.",
        "error"
      );
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
          assetId: currentJob.assetId,
          topic: report.understanding?.actualTopic || editableTitle,
          currentTitle: editableTitle,
          previousTitles: (report.publishingPackage?.titles || []).map((t) => t.title),
          transcriptText: report.transcript?.text || "",
          durationSeconds: report.media?.durationSeconds || 600,
          understanding: report.understanding,
          candidateFrames: report.vision?.sampledFrames || [],
          visualEvidence: report.vision?.sampledFrames?.map((frame) => ({
            timestampSeconds: frame.timestampSeconds,
            description: frame.semanticDescription,
            framePath: frame.framePath,
          })) || [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to regenerate packaging");

      const newTitles: TitleOption[] = Array.isArray(data.titleOptions) && data.titleOptions.length > 0
        ? data.titleOptions
        : Array.isArray(data.titles)
        ? data.titles.map((t: string) => ({
            title: t,
            formula: "Evidence-derived candidate",
            characterCount: t.length,
            isTruncated: t.length > 100,
            fitReason: "Review against the uploaded video before publishing.",
            rankingExplanation: "Not scored. No verified performance benchmark or calibrated scoring model is available.",
          }))
        : [];

      // Regeneration invalidates prior card selections; require fresh review.
      setSelectedTitle("");
      setSelectedThumbnailId("");

      if (data.suggestedTitle) {
        setEditableTitle(data.suggestedTitle);
        // Keep the generated title as a suggestion, not a selection.
      } else if (newTitles.length > 0) {
        setEditableTitle(newTitles[0].title);
        // Keep the generated title as a suggestion, not a selection.
      }

      if (data.description) setEditableDesc(data.description);
      if (data.tags) setEditableTags(Array.isArray(data.tags) ? data.tags.join(", ") : data.tags);

      if (currentJob.report) {
        const existingPkg = currentJob.report.publishingPackage || ({} as any);
        setCurrentJob({
          ...currentJob,
          report: {
            ...currentJob.report,
            publishingPackage: {
              ...existingPkg,
              titles: newTitles.length > 0 ? newTitles : existingPkg.titles,
              recommendedTitle: data.suggestedTitle || (newTitles[0]?.title ?? existingPkg.recommendedTitle),
              description: data.description || existingPkg.description,
              tags: Array.isArray(data.tags) ? data.tags : existingPkg.tags,
              thumbnails: (Array.isArray(data.thumbnails) && data.thumbnails.length > 0)
                ? data.thumbnails
                : (existingPkg.thumbnails || []),
              selectedThumbnailId: "",
            } as any,
          },
        });
      }

      onToast("Refreshed packaging assets with configured model!", "success");
    } catch (err: any) {
      onToast(err.message || "Failed to regenerate assets", "error");
    } finally {
      setIsRegeneratingPackaging(false);
    }
  };

  // Resume Interrupted Upload from Saved YouTube Session and Byte Offset
  const handleResumeUpload = async () => {
    if (!currentJob) return;
    const sessionUrl = lifecycleRecord.uploadSessionUrl;
    if (!sessionUrl) {
      onToast(
        "The interrupted YouTube upload session URL could not be recovered. To publish this video, confirm publishing to start a fresh upload.",
        "error"
      );
      return;
    }

    setIsPublishing(true);
    dispatchLifecycle({ type: "RESUME_SESSION", sessionUrl });

    try {
      const finalTitle = editableTitle.trim() || selectedTitle.trim();
      if (finalTitle.length > 100) {
        onToast(`Title exceeds YouTube's 100-character limit (${finalTitle.length}/100 characters). Shorten the title before publishing.`, "error");
        setIsPublishing(false);
        return;
      }
      const finalDesc = editableDesc.trim();
      const finalTags = editableTags
        ? editableTags.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

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
          resumeSessionUrl: sessionUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isInterrupted && data.uploadSessionUrl) {
          dispatchLifecycle({
            type: "NETWORK_INTERRUPTION",
            error: data.error,
            sessionUrl: data.uploadSessionUrl,
          });
          onToast(`Upload interrupted: ${data.error}. Click 'Resume Interrupted Upload' to retry.`, "info");
          return;
        }
        dispatchLifecycle({
          type: "PERMANENT_UPLOAD_ERROR",
          error: data.error || "Resuming upload failed",
        });
        throw new Error(data.error || "Resuming upload failed");
      }

      const publishedUrl = data.videoUrl || data.publishedUrl || (data.videoId ? `https://youtu.be/${data.videoId}` : null);
      setPublishedVideoUrl(publishedUrl);
      setPublishedVideoId(data.videoId || data.record?.youtubeVideoId || null);
      setPublishedThumbnailStatus(data.thumbnailStatus || data.record?.thumbnailStatus || null);
      setPublishedThumbnailError(data.thumbnailError || data.record?.thumbnailError || null);

      dispatchLifecycle({
        type: "YOUTUBE_RETURNED_201",
        videoId: data.videoId || data.record?.youtubeVideoId,
        hasCustomThumbnail: Boolean(selectedThumbnailId),
      });

      if (selectedThumbnailId) {
        dispatchLifecycle({ type: "START_THUMBNAIL_UPLOAD" });
        if (data.thumbnailStatus === "applied") {
          dispatchLifecycle({ type: "THUMBNAIL_APPLIED" });
        } else if (data.thumbnailStatus === "failed") {
          dispatchLifecycle({
            type: "THUMBNAIL_ERROR",
            error: data.thumbnailError || "Custom thumbnail upload failed",
          });
        }
      }

      onToast(`Upload successfully resumed and published to YouTube as ${publishPrivacy.toUpperCase()}!`, "success");
    } catch (err: any) {
      if (!err.isInterrupted) {
        dispatchLifecycle({
          type: "PERMANENT_UPLOAD_ERROR",
          error: err.message || "Failed to resume upload",
        });
      }
      onToast(err.message || "Failed to resume upload.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  // Publish to YouTube
  const handlePublishToYouTube = async () => {
    if (!currentJob) return;
    if (!selectedTitle.trim()) {
      onToast("Select a title option before publishing.", "info");
      return;
    }
    if (!selectedThumbnailId.trim()) {
      onToast("Select a thumbnail option before publishing.", "info");
      return;
    }
    const pkg = currentJob.report?.publishingPackage;
    if (!pkg?.titles?.some((option) => option.title === selectedTitle)) {
      onToast("That title option is no longer available. Select a current title.", "info");
      return;
    }
    if (!pkg?.thumbnails?.some((thumbnail) => thumbnail.id === selectedThumbnailId)) {
      onToast("That thumbnail option is no longer available. Select a current thumbnail.", "info");
      return;
    }

    setIsPublishing(true);
    dispatchLifecycle({ type: "USER_CONFIRM_PUBLISH" });
    setPublishedVideoUrl(null);
    setPublishedVideoId(null);

    try {
      const finalTitle = editableTitle.trim() || selectedTitle.trim();
      if (finalTitle.length > 100) {
        onToast(`Title exceeds YouTube's 100-character limit (${finalTitle.length}/100 characters). Shorten the title before publishing.`, "error");
        setIsPublishing(false);
        dispatchLifecycle({ type: "USER_EDIT" });
        return;
      }
      const finalDesc = editableDesc.trim();
      const finalTags = editableTags
        ? editableTags.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

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
        if (data.isInterrupted && data.uploadSessionUrl) {
          dispatchLifecycle({
            type: "NETWORK_INTERRUPTION",
            error: data.error,
            sessionUrl: data.uploadSessionUrl,
          });
          onToast(`Upload interrupted: ${data.error}. Click 'Resume Interrupted Upload' to retry.`, "info");
          return;
        }
        dispatchLifecycle({
          type: "PERMANENT_UPLOAD_ERROR",
          error: data.error || "Publishing failed",
        });
        throw new Error(data.error || "Publishing failed");
      }

      const publishedUrl = data.videoUrl || data.publishedUrl || (data.videoId ? `https://youtu.be/${data.videoId}` : null);
      setPublishedVideoUrl(publishedUrl);
      setPublishedVideoId(data.videoId || data.record?.youtubeVideoId || null);
      setPublishedThumbnailStatus(data.thumbnailStatus || data.record?.thumbnailStatus || null);
      setPublishedThumbnailError(data.thumbnailError || data.record?.thumbnailError || null);

      dispatchLifecycle({
        type: "YOUTUBE_RETURNED_201",
        videoId: data.videoId || data.record?.youtubeVideoId,
        hasCustomThumbnail: Boolean(selectedThumbnailId),
      });

      if (selectedThumbnailId) {
        dispatchLifecycle({ type: "START_THUMBNAIL_UPLOAD" });
        if (data.thumbnailStatus === "applied") {
          dispatchLifecycle({ type: "THUMBNAIL_APPLIED" });
        } else if (data.thumbnailStatus === "failed") {
          dispatchLifecycle({
            type: "THUMBNAIL_ERROR",
            error: data.thumbnailError || "Custom thumbnail upload failed",
          });
        }
      }

      if (data.isDuplicatePrevented) {
        onToast("Video was already published. Retrieved existing YouTube URL.", "info");
      } else {
        onToast(`Video successfully published to YouTube as ${publishPrivacy.toUpperCase()}!`, "success");
      }
    } catch (err: any) {
      if (!err.isInterrupted) {
        dispatchLifecycle({
          type: "PERMANENT_UPLOAD_ERROR",
          error: err.message || "Failed to publish video to YouTube",
        });
      }
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
    setLifecycleRecord({
      state: "Draft",
      assetId: "",
      jobId: "",
      updatedAt: new Date().toISOString(),
    });
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
  const titlesList: TitleOption[] = pkg?.titles || [];

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
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider ${report.understanding?.isAdequatelyUnderstood ? "bg-[#10B981]" : "bg-[#D97706]"}`}>
                  {report.understanding?.isAdequatelyUnderstood ? "Evidence reviewed" : "Limited evidence"}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {Math.floor((report.media?.durationSeconds || 0) / 60)}m {Math.round((report.media?.durationSeconds || 0) % 60)}s • {report.media?.width || 1280}x{report.media?.height || 720}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#111827] mt-1.5">
                {report.understanding?.actualTopic || "Subject not established"}
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
              {report.understanding?.summary || report.understanding?.limitationNotice || "No verified video summary is available."}
            </p>
            {report.understanding?.limitationNotice && (
              <p className="text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3">
                {report.understanding.limitationNotice}
              </p>
            )}

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

          {/* Audio Intelligence & Whisper Evidence Panel */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B]">
                <Mic className="w-4 h-4 text-[#10B981]" />
                <span>Audio Intelligence (OpenAI Whisper)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  report.audioAnalysis?.speechDetected
                    ? "bg-[#DCFCE7] text-[#15803D]"
                    : report.audioAnalysis?.status === "no_speech"
                    ? "bg-[#DBEAFE] text-[#1E40AF]"
                    : report.audioAnalysis?.status === "no_audio"
                    ? "bg-[#F3F4F6] text-[#4B5563]"
                    : "bg-[#FEF3C7] text-[#92400E]"
                }`}>
                  {report.audioAnalysis?.speechDetected
                    ? "Speech Detected"
                    : report.audioAnalysis?.status === "no_speech"
                    ? "Music / No Dialogue"
                    : report.audioAnalysis?.status === "no_audio"
                    ? "No Audio Track"
                    : "Audio Unavailable"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                <span>Model: <strong className="text-[#374151]">{report.audioAnalysis?.model || "base"}</strong></span>
                <span>Language: <strong className="text-[#374151]">{report.audioAnalysis?.language?.name || "Automatic"}</strong></span>
              </div>
            </div>

            {/* Cross-Modal Contradiction or Agreement Warnings */}
            {report.multimodal?.combined?.contradictions && report.multimodal.combined.contradictions.length > 0 && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[11px] text-[#991B1B] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Cross-Modal Contradiction Detected:</span>
                </div>
                {report.multimodal.combined.contradictions.map((c, i) => (
                  <p key={i}>• {c}</p>
                ))}
              </div>
            )}

            {/* Transcript Preview & Segment Toggle */}
            {report.transcript?.text ? (
              <div className="space-y-2">
                <p className="text-xs text-[#334155] italic bg-white p-3 rounded-xl border border-[#E2E8F0] line-clamp-3">
                  &ldquo;{report.transcript.text}&rdquo;
                </p>
                {report.transcript.cues && report.transcript.cues.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowTranscriptSegments((prev) => !prev)}
                      className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {showTranscriptSegments ? "Hide" : "Show"} {report.transcript.cues.length} timestamped speech segments
                    </button>
                    {showTranscriptSegments && (
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-[#E2E8F0] text-[11px]">
                        {report.transcript.cues.map((cue, idx) => (
                          <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-[#F8FAFC] last:border-0">
                            <span className="font-mono text-[10px] text-[#2563EB] shrink-0 bg-[#EFF6FF] px-1.5 py-0.5 rounded">
                              {Math.floor(cue.start / 60)}:{(Math.floor(cue.start % 60)).toString().padStart(2, "0")} - {Math.floor(cue.end / 60)}:{(Math.floor(cue.end % 60)).toString().padStart(2, "0")}
                            </span>
                            <span className="text-[#374151]">{cue.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-[#64748B]">
                {report.audioAnalysis?.limitations?.[0] || "No speech dialogue was transcribed from this clip."}
              </p>
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
                <span className="text-[11px] font-semibold text-[#6B7280]">{titlesList.length > 0 ? `(Choose 1 of ${titlesList.length})` : "(Review options)"}</span>
              </h3>
              <span className="text-[11px] text-[#2563EB] font-bold">
                Selected: {editableTitle.length} chars
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {titlesList.length === 0 && (
                <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#92400E]">
                        {pkg?.limitationNotice || "Limited video understanding evidence detected."}
                      </p>
                      <p className="text-[11px] text-[#B45309] mt-0.5">
                        You can specify your video title or topic below and click &quot;Generate Assets with Video Frames&quot; to synthesize titles and thumbnails based on your topic and captured frames.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegeneratePackaging}
                    disabled={isRegeneratingPackaging}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingPackaging ? "animate-spin" : ""}`} />
                    <span>Generate Assets with Video Frames</span>
                  </button>
                </div>
              )}
              {titlesList.map((item, idx) => {
                const isSelected = selectedTitle === item.title;
                const isMobileSafe = item.characterCount <= 60;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedTitle(item.title);
                      setEditableTitle(item.title);
                      if (selectedThumbnailId) {
                        dispatchLifecycle({ type: "SELECTION_MADE" });
                      } else {
                        dispatchLifecycle({ type: "READY_FOR_REVIEW" });
                      }
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
                          {item.strategy && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider bg-[#EFF6FF] text-[#2563EB]">
                              {item.strategy.replace("_", " ")}
                            </span>
                          )}
                          <span className="font-semibold text-[#4B5563]">{item.formula}</span>
                          <span>•</span>
                          <span>{item.fitReason || "Accurately represents video demonstration."}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {item.scores?.overallScore != null && (
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
                Validated source frame • PNG/JPEG • under 2 MB
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {thumbnailsList.length === 0 && (
                <p className="text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 md:col-span-3">
                  No thumbnail can be offered because no valid representative video frame is available. Reprocess the upload with frame extraction enabled.
                </p>
              )}
              {thumbnailsList.map((thumb) => {
                const isSelected = selectedThumbnailId === thumb.id;

                return (
                  <div
                    key={thumb.id}
                    onClick={() => {
                      setSelectedThumbnailId(thumb.id);
                      if (selectedTitle || editableTitle) {
                        dispatchLifecycle({ type: "SELECTION_MADE" });
                      } else {
                        dispatchLifecycle({ type: "READY_FOR_REVIEW" });
                      }
                    }}
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
                <span className={editableTitle.length > 100 ? "text-[#EF4444] font-bold" : editableTitle.length > 60 ? "text-amber-600 font-medium" : "text-[#6B7280]"}>
                  {editableTitle.length} / 100 characters {editableTitle.length > 100 && "(Exceeds YouTube 100-character limit)"}
                </span>
              </div>
              <input
                type="text"
                value={editableTitle}
                maxLength={100}
                onChange={(e) => {
                  setEditableTitle(e.target.value);
                  dispatchLifecycle({ type: "USER_EDIT" });
                }}
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
                onChange={(e) => {
                  setEditableDesc(e.target.value);
                  dispatchLifecycle({ type: "USER_EDIT" });
                }}
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
                onChange={(e) => {
                  setEditableTags(e.target.value);
                  dispatchLifecycle({ type: "USER_EDIT" });
                }}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                Step 4 of 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">
                Upload Video to YouTube
              </h2>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-[#6B7280] font-medium">Lifecycle State:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  lifecycleRecord.state === "Completed"
                    ? "bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]"
                    : lifecycleRecord.state === "ThumbnailFailed"
                    ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                    : lifecycleRecord.state === "Published"
                    ? "bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]"
                    : lifecycleRecord.state === "Uploading"
                    ? "bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] animate-pulse"
                    : lifecycleRecord.state === "UploadInterrupted"
                    ? "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]"
                    : lifecycleRecord.state === "Failed"
                    ? "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]"
                    : lifecycleRecord.state === "AwaitingConfirmation"
                    ? "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]"
                    : lifecycleRecord.state === "ReadyForReview"
                    ? "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                    : "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
                }`}
              >
                {lifecycleRecord.state}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#6B7280] -mt-3">
            Connect your YouTube channel, choose your privacy preference, and publish the original video with your chosen title and thumbnail.
          </p>

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
            <div className="p-6 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[#065F46] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                  <span>Video Successfully Uploaded & Published to YouTube!</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#065F46] uppercase tracking-wide">
                  HTTP 201 Created
                </span>
              </div>

              {/* Status details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white/70 rounded-xl border border-[#A7F3D0]/60 text-xs">
                <div>
                  <span className="text-[11px] text-[#6B7280] block font-medium">YouTube Video ID</span>
                  <code className="text-[#065F46] font-mono font-bold text-xs">{publishedVideoId || "Confirmed"}</code>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280] block font-medium">Upload Privacy</span>
                  <span className="font-bold text-[#111827] capitalize">{publishPrivacy}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280] block font-medium">Custom Thumbnail</span>
                  <span className={`font-bold ${publishedThumbnailStatus === "applied" ? "text-[#059669]" : publishedThumbnailStatus === "failed" ? "text-[#DC2626]" : "text-[#6B7280]"}`}>
                    {publishedThumbnailStatus === "applied"
                      ? "Applied Successfully"
                      : publishedThumbnailStatus === "failed"
                      ? "Failed (Channel Verification Required)"
                      : "Not Requested"}
                  </span>
                </div>
              </div>

              {/* YouTube Background Processing Notice */}
              <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] text-[11px] text-[#047857] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                <p>
                  <strong>YouTube Processing Note:</strong> Upload transfer complete. YouTube is processing standard (SD) and high-definition (HD) streams in the background. Check YouTube Studio for live resolution and content checks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
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

          {/* Upload Interrupted Session Banner */}
          {lifecycleRecord.state === "UploadInterrupted" && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="text-xs text-[#991B1B] space-y-1">
                <p className="font-bold">
                  Resumable Upload Interrupted
                </p>
                <p>
                  Network connection was interrupted. Your YouTube upload session is preserved.
                  Click &quot;Resume Interrupted Upload&quot; below to restore byte offset and finish publishing without restarting from byte 0.
                </p>
                {lifecycleRecord.uploadSessionUrl && (
                  <p className="text-[10px] font-mono text-[#B91C1C] truncate">
                    Session: {lifecycleRecord.uploadSessionUrl}
                  </p>
                )}
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
              onClick={
                lifecycleRecord.state === "UploadInterrupted"
                  ? handleResumeUpload
                  : handlePublishToYouTube
              }
              disabled={isPublishing || !isYoutubeConnected || !editableTitle.trim() || editableTitle.trim().length > 100}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Youtube className="w-4 h-4" />
              <span>
                {isPublishing
                  ? "Publishing to YouTube..."
                  : lifecycleRecord.state === "UploadInterrupted"
                  ? "Resume Interrupted Upload"
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
