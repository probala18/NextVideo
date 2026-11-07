/**
 * src/lib/types/publishingLifecycle.ts
 * YouTube Publishing Workflow State Machine
 *
 * Implements the state machine diagram:
 * [Draft] ──> [ReadyForReview] ──> [AwaitingConfirmation] ──(User confirms)──> [Uploading]
 *   ^                                    │                                        │
 *   └───────────(User edits)─────────────┘                                        ├─(YouTube 201 + ID)─> [Published] ──> [ThumbnailPending]
 *                                                                                 │                                            ├─(Applied)─> [Completed]
 *                                                                                 │                                            └─(Error)───> [ThumbnailFailed]
 *                                                                                 ├─(Network interruption)─> [UploadInterrupted]
 *                                                                                 │                                │ (Resume)
 *                                                                                 │                                └─────────> [Uploading]
 *                                                                                 └─(Permanent error)─────> [Failed]
 */

export type PublishingLifecycleState =
  | "Draft"
  | "ReadyForReview"
  | "AwaitingConfirmation"
  | "Uploading"
  | "UploadInterrupted"
  | "Published"
  | "ThumbnailPending"
  | "Completed"
  | "ThumbnailFailed"
  | "Failed";

export type PublishingLifecycleEvent =
  | { type: "INITIALIZE_DRAFT" }
  | { type: "ASSETS_GENERATED" }
  | { type: "READY_FOR_REVIEW" }
  | { type: "SELECTION_MADE" }
  | { type: "USER_EDIT" }
  | { type: "USER_CONFIRM_PUBLISH" }
  | { type: "YOUTUBE_RETURNED_201"; videoId: string; hasCustomThumbnail: boolean }
  | { type: "NETWORK_INTERRUPTION"; error: string; sessionUrl?: string }
  | { type: "RESUME_SESSION"; sessionUrl: string }
  | { type: "PERMANENT_UPLOAD_ERROR"; error: string }
  | { type: "START_THUMBNAIL_UPLOAD" }
  | { type: "THUMBNAIL_APPLIED" }
  | { type: "THUMBNAIL_ERROR"; error: string };

export interface PublishingLifecycleRecord {
  state: PublishingLifecycleState;
  assetId: string;
  jobId: string;
  videoId?: string;
  uploadSessionUrl?: string;
  error?: string;
  thumbnailStatus?: "not_requested" | "pending" | "applied" | "uploaded" | "failed";
  thumbnailError?: string;
  updatedAt: string;
}

export const VALID_PUBLISHING_TRANSITIONS: Record<
  PublishingLifecycleState,
  PublishingLifecycleState[]
> = {
  Draft: ["Draft", "ReadyForReview"],
  ReadyForReview: ["ReadyForReview", "AwaitingConfirmation", "Draft"],
  AwaitingConfirmation: ["Draft", "Uploading"],
  Uploading: ["Published", "UploadInterrupted", "Failed"],
  UploadInterrupted: ["Uploading", "Failed"],
  Published: ["ThumbnailPending", "Completed"],
  ThumbnailPending: ["Completed", "ThumbnailFailed"],
  Completed: [],
  ThumbnailFailed: [],
  Failed: [],
};

export function canTransitionPublishing(
  from: PublishingLifecycleState,
  to: PublishingLifecycleState
): boolean {
  return VALID_PUBLISHING_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionPublishingState(
  current: PublishingLifecycleRecord,
  event: PublishingLifecycleEvent
): PublishingLifecycleRecord {
  const now = new Date().toISOString();

  switch (current.state) {
    case "Draft": {
      if (event.type === "ASSETS_GENERATED" || event.type === "READY_FOR_REVIEW") {
        return { ...current, state: "ReadyForReview", updatedAt: now };
      }
      return current;
    }

    case "ReadyForReview": {
      if (event.type === "SELECTION_MADE") {
        return { ...current, state: "AwaitingConfirmation", updatedAt: now };
      }
      if (event.type === "USER_EDIT") {
        return { ...current, state: "Draft", updatedAt: now };
      }
      return current;
    }

    case "AwaitingConfirmation": {
      if (event.type === "USER_EDIT") {
        return { ...current, state: "Draft", updatedAt: now };
      }
      if (event.type === "USER_CONFIRM_PUBLISH") {
        return { ...current, state: "Uploading", error: undefined, updatedAt: now };
      }
      return current;
    }

    case "Uploading": {
      if (event.type === "YOUTUBE_RETURNED_201") {
        return {
          ...current,
          state: "Published",
          videoId: event.videoId,
          thumbnailStatus: event.hasCustomThumbnail ? "pending" : "not_requested",
          error: undefined,
          updatedAt: now,
        };
      }
      if (event.type === "NETWORK_INTERRUPTION") {
        return {
          ...current,
          state: "UploadInterrupted",
          error: event.error,
          uploadSessionUrl: event.sessionUrl || current.uploadSessionUrl,
          updatedAt: now,
        };
      }
      if (event.type === "PERMANENT_UPLOAD_ERROR") {
        return {
          ...current,
          state: "Failed",
          error: event.error,
          updatedAt: now,
        };
      }
      return current;
    }

    case "UploadInterrupted": {
      if (event.type === "RESUME_SESSION") {
        return {
          ...current,
          state: "Uploading",
          uploadSessionUrl: event.sessionUrl,
          error: undefined,
          updatedAt: now,
        };
      }
      if (event.type === "PERMANENT_UPLOAD_ERROR") {
        return {
          ...current,
          state: "Failed",
          error: event.error,
          updatedAt: now,
        };
      }
      return current;
    }

    case "Published": {
      if (event.type === "START_THUMBNAIL_UPLOAD") {
        return { ...current, state: "ThumbnailPending", thumbnailStatus: "pending", updatedAt: now };
      }
      return current;
    }

    case "ThumbnailPending": {
      if (event.type === "THUMBNAIL_APPLIED") {
        return { ...current, state: "Completed", thumbnailStatus: "applied", thumbnailError: undefined, updatedAt: now };
      }
      if (event.type === "THUMBNAIL_ERROR") {
        return { ...current, state: "ThumbnailFailed", thumbnailStatus: "failed", thumbnailError: event.error, updatedAt: now };
      }
      return current;
    }

    case "Completed":
    case "ThumbnailFailed":
    case "Failed":
      return current;

    default:
      return current;
  }
}

