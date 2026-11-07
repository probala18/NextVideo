import { describe, expect, it } from "bun:test";
import {
  PublishingLifecycleRecord,
  transitionPublishingState,
  canTransitionPublishing,
  VALID_PUBLISHING_TRANSITIONS,
} from "../types/publishingLifecycle";

describe("YouTube Publishing Workflow State Machine", () => {
  const createInitialRecord = (): PublishingLifecycleRecord => ({
    state: "Draft",
    assetId: "asset_test_123",
    jobId: "job_test_123",
    updatedAt: new Date().toISOString(),
  });

  it("transitions Draft -> ReadyForReview when publishing assets are generated", () => {
    const record = createInitialRecord();
    const next = transitionPublishingState(record, { type: "ASSETS_GENERATED" });
    expect(next.state).toBe("ReadyForReview");
  });

  it("transitions ReadyForReview -> AwaitingConfirmation when creator selects metadata", () => {
    const record: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "ReadyForReview",
    };
    const next = transitionPublishingState(record, { type: "SELECTION_MADE" });
    expect(next.state).toBe("AwaitingConfirmation");
  });

  it("returns to Draft when creator edits metadata from AwaitingConfirmation or ReadyForReview", () => {
    const record: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "AwaitingConfirmation",
    };
    const next = transitionPublishingState(record, { type: "USER_EDIT" });
    expect(next.state).toBe("Draft");

    const reviewRecord: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "ReadyForReview",
    };
    const reviewEdited = transitionPublishingState(reviewRecord, { type: "USER_EDIT" });
    expect(reviewEdited.state).toBe("Draft");
  });

  it("transitions AwaitingConfirmation -> Uploading only after explicit user confirmation", () => {
    const record: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "AwaitingConfirmation",
    };
    const next = transitionPublishingState(record, { type: "USER_CONFIRM_PUBLISH" });
    expect(next.state).toBe("Uploading");
  });

  it("transitions Uploading -> Published when YouTube returns HTTP 201 with video ID", () => {
    const record: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "Uploading",
    };
    const nextWithThumb = transitionPublishingState(record, {
      type: "YOUTUBE_RETURNED_201",
      videoId: "youtube_vid_abc",
      hasCustomThumbnail: true,
    });
    expect(nextWithThumb.state).toBe("Published");
    expect(nextWithThumb.thumbnailStatus).toBe("pending");
    expect(nextWithThumb.videoId).toBe("youtube_vid_abc");

    // When thumbnail was not requested, it remains in Published state and is NOT falsely marked Completed
    const nextNoThumb = transitionPublishingState(record, {
      type: "YOUTUBE_RETURNED_201",
      videoId: "youtube_vid_xyz",
      hasCustomThumbnail: false,
    });
    expect(nextNoThumb.state).toBe("Published");
    expect(nextNoThumb.thumbnailStatus).toBe("not_requested");
    expect(nextNoThumb.videoId).toBe("youtube_vid_xyz");
  });

  it("handles decoupled thumbnail: Published -> ThumbnailPending -> Completed", () => {
    const record: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "Published",
      videoId: "youtube_vid_abc",
    };

    const pending = transitionPublishingState(record, { type: "START_THUMBNAIL_UPLOAD" });
    expect(pending.state).toBe("ThumbnailPending");

    const completed = transitionPublishingState(pending, { type: "THUMBNAIL_APPLIED" });
    expect(completed.state).toBe("Completed");
    expect(completed.thumbnailError).toBeUndefined();
  });

  it("handles thumbnail failure independently: Published -> ThumbnailPending -> ThumbnailFailed (video remains published)", () => {
    const record: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "ThumbnailPending",
      videoId: "youtube_vid_abc",
    };

    const failed = transitionPublishingState(record, {
      type: "THUMBNAIL_ERROR",
      error: "HTTP 403: Caller does not have permission to upload custom thumbnails.",
    });
    expect(failed.state).toBe("ThumbnailFailed");
    expect(failed.thumbnailError).toContain("403");
    expect(failed.videoId).toBe("youtube_vid_abc");
  });

  it("handles network interruption and session resumption: Uploading -> UploadInterrupted -> Uploading", () => {
    const record: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "Uploading",
    };

    const interrupted = transitionPublishingState(record, {
      type: "NETWORK_INTERRUPTION",
      error: "Connection reset by peer",
      sessionUrl: "https://upload.youtube.com/resumable/test",
    });
    expect(interrupted.state).toBe("UploadInterrupted");
    expect(interrupted.uploadSessionUrl).toBe("https://upload.youtube.com/resumable/test");

    const resumed = transitionPublishingState(interrupted, {
      type: "RESUME_SESSION",
      sessionUrl: "https://upload.youtube.com/resumable/test",
    });
    expect(resumed.state).toBe("Uploading");
  });

  it("transitions Uploading or UploadInterrupted -> Failed on permanent error", () => {
    const uploadingRecord: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "Uploading",
    };
    const failedFromUploading = transitionPublishingState(uploadingRecord, {
      type: "PERMANENT_UPLOAD_ERROR",
      error: "HTTP 400: Bad Request",
    });
    expect(failedFromUploading.state).toBe("Failed");
    expect(failedFromUploading.error).toBe("HTTP 400: Bad Request");

    const interruptedRecord: PublishingLifecycleRecord = {
      ...createInitialRecord(),
      state: "UploadInterrupted",
    };
    const failedFromInterrupted = transitionPublishingState(interruptedRecord, {
      type: "PERMANENT_UPLOAD_ERROR",
      error: "HTTP 404: Upload session expired",
    });
    expect(failedFromInterrupted.state).toBe("Failed");
  });

  it("enforces valid state transition matrix and rejects illegal transitions", () => {
    expect(canTransitionPublishing("Draft", "ReadyForReview")).toBe(true);
    expect(canTransitionPublishing("ReadyForReview", "AwaitingConfirmation")).toBe(true);
    expect(canTransitionPublishing("AwaitingConfirmation", "Draft")).toBe(true);
    expect(canTransitionPublishing("AwaitingConfirmation", "Uploading")).toBe(true);
    expect(canTransitionPublishing("Uploading", "Published")).toBe(true);
    expect(canTransitionPublishing("Uploading", "UploadInterrupted")).toBe(true);
    expect(canTransitionPublishing("UploadInterrupted", "Uploading")).toBe(true);
    expect(canTransitionPublishing("Published", "ThumbnailPending")).toBe(true);
    expect(canTransitionPublishing("ThumbnailPending", "Completed")).toBe(true);
    expect(canTransitionPublishing("ThumbnailPending", "ThumbnailFailed")).toBe(true);

    // Illegal transitions:
    // Cannot skip confirmation to publish directly from Draft
    expect(canTransitionPublishing("Draft", "Uploading")).toBe(false);
    expect(canTransitionPublishing("Draft", "Published")).toBe(false);
    // Completed / Failed are terminal
    expect(VALID_PUBLISHING_TRANSITIONS.Completed).toHaveLength(0);
    expect(VALID_PUBLISHING_TRANSITIONS.Failed).toHaveLength(0);
  });
});

