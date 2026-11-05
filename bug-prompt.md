# NextVideo — Complete Repository Audit, Bug Fixes & Video Publishing Agent Implementation

## ROLE

Act as a senior full-stack engineer, AI/ML engineer, video-processing engineer, YouTube automation specialist, and QA engineer.

You are working on my existing GitHub repository:

**Repository:** `probala18/NextVideo`

This is an existing Next.js application. Your job is NOT to rebuild the application from scratch. Your job is to understand the current codebase, identify existing bugs, repair incomplete implementations, and finish the Video Publishing Agent functionality.

I have previously attempted to develop this using AI coding tools, but several implementations were incomplete, overly generic, hardcoded, or disconnected from actual video evidence.

I want production-quality engineering, not a demo that only looks functional.

---

# 1. MAIN OBJECTIVE

Build a reliable YouTube Video Publishing Agent.

The intended workflow is:

1. User uploads a video file.
2. The application analyzes the actual video.
3. The system understands what the video is about.
4. It extracts meaningful visual, audio, and textual evidence.
5. It researches relevant YouTube title patterns when API access is configured.
6. It generates multiple relevant YouTube titles.
7. It generates a video-specific description.
8. It generates relevant tags and category suggestions.
9. It generates thumbnail options using actual frames from the uploaded video.
10. It provides a preview of the complete YouTube publishing package.
11. User reviews and selects their preferred options.
12. User confirms publishing.
13. The application uploads the video and selected metadata to YouTube.
14. The application displays the actual upload result and publishing status.

The system must never pretend that it understands a video when it does not.

**The actual uploaded video must be the primary source of truth.**

---

# 2. STRICT PROJECT BOUNDARIES

Before making changes, inspect the entire repository and understand its architecture.

The primary scope is the Video Publishing Agent.

Do not unnecessarily modify:

- Dashboard
- Channel Intel
- Revenue
- Studio
- Pipeline
- Sidebar/navigation
- Global application styling
- Other existing pages
- Shared components unrelated to the Video Agent

Do not redesign the entire application.

Preserve the existing visual identity, layout, responsiveness, component patterns, and working functionality.

Only modify shared components when there is a demonstrated technical requirement.

If a shared change is necessary, explain why before implementing it.

---

# 3. FIRST: COMPLETE CODEBASE AUDIT

Do not start by immediately rewriting files.

First inspect:

- `package.json`
- Next.js configuration
- Environment variable handling
- API routes
- Components
- Video processing utilities
- AI model integrations
- YouTube integration
- Database/storage implementation
- Existing tests
- Type definitions
- Error-handling utilities

Pay particular attention to these known files, if they still exist:

- `src/lib/video/understanding.ts`
- `src/lib/video/vision.ts`
- `src/lib/video/generator.ts`
- `src/lib/video/orchestrator.ts`
- `src/lib/video/title.ts`
- `src/lib/video/youtube-pattern-model.ts`
- `src/app/page.tsx`
- `AutonomousVideoStudio.tsx`
- `src/lib/types/visionWorkflow.ts`
- Publishing API routes
- Existing video-agent tests

Search for duplicate implementations, unused functions, TODOs, placeholder responses, hardcoded values, fake metrics, unfinished API integrations, and inconsistent types.

Create a clear audit report containing:

1. Existing bugs.
2. Incomplete functionality.
3. Incorrect assumptions.
4. Missing functionality.
5. Security problems.
6. Performance problems.
7. UI/UX problems.
8. Test coverage gaps.
9. Files that need modification.
10. Features that already work and must be preserved.

Do not report a feature as broken without examining its implementation.

Do not claim that a bug is fixed unless you have implemented and verified the fix.

After the audit, continue with implementation. Do not stop after producing the report.

---

# 4. VIDEO UNDERSTANDING ENGINE

This is the most important part of the entire application.

The agent must understand the actual video instead of generating generic metadata from its filename, duration, upload form, or a hardcoded category.

## 4.1 Video input

Support:

- MP4
- MOV
- WebM, if compatible with the existing processing pipeline

Validate:

- File extension
- Actual MIME type
- File size
- Video readability
- Duration
- Resolution
- Frame rate, where available
- Audio stream availability
- Corrupted or unsupported files

Show useful validation errors.

Do not trust file extensions alone.

Handle large files without unnecessarily loading the entire file into application memory.

## 4.2 Video metadata extraction

Extract:

- Duration
- Width and height
- Resolution
- Frame rate
- Video codec
- Audio codec
- File size
- Audio availability

Use FFmpeg/FFprobe if already available or introduce a suitable implementation compatible with the deployment environment.

Do not assume FFmpeg exists in every Vercel serverless environment.

If video processing requires a separate runtime, isolate that processing behind a clean interface and document the deployment requirements.

## 4.3 Intelligent frame extraction

Extract meaningful frames from the actual video.

Do not rely exclusively on the first frame or a fixed number of arbitrary frames.

Use a reasonable sampling strategy based on video duration and scene changes.

Consider:

- Beginning
- Middle
- Ending
- Scene transitions
- Important visual changes
- High-information frames

Avoid duplicate or nearly identical frames.

Preserve timestamps for every extracted frame.

Do not extract hundreds of frames unnecessarily.

Make extraction configurable and resource-aware.

## 4.4 Visual understanding

Use the configured vision-capable model to understand the selected frames.

Extract:

- Main subject
- Objects
- People, where relevant
- Screen content
- Software interfaces
- On-screen text
- Actions
- Demonstrations
- Important scenes
- Visual context
- Changes between scenes
- Main purpose of the video

For programming tutorials, identify actual technologies and tools only when they are visible or otherwise supported by evidence.

For example, if a video visibly demonstrates Next.js, React, or an API endpoint, record that information with its timestamp and evidence.

Do not automatically classify every long video as a tutorial.

Do not automatically classify every short video as a Short.

Do not invent technologies, frameworks, products, or outcomes.

## 4.5 Audio understanding

Analyze audio whenever available.

Implement a practical transcription pipeline using an available local or configurable speech-to-text model.

Extract:

- Spoken dialogue
- Narration
- Important statements
- Topics
- Technical terms
- Important timestamps
- Relevant audio cues

Handle:

- No audio
- Music-only videos
- Silent videos
- Unclear speech
- Multiple speakers
- Transcription failures
- Unsupported languages

Do not fabricate a transcript when transcription fails.

If audio is unavailable, continue with visual understanding and clearly report the limitation.

## 4.6 OCR and screen text

Extract meaningful text from video frames where useful.

This is especially important for:

- Programming tutorials
- Screen recordings
- Presentations
- Product demonstrations
- Educational videos

Avoid interpreting random or unreadable text as confirmed evidence.

Preserve timestamps and associate extracted text with its source frame.

## 4.7 Combined video understanding

Combine:

- Visual observations
- OCR results
- Audio transcript
- Video metadata
- Scene timestamps
- Model observations

Generate a structured understanding result containing:

- Actual topic
- Main subject
- Video purpose
- Content type
- Target audience, if supported
- Main actions
- Demonstrated technologies
- Important scenes
- Key takeaways
- Distinguishing features
- Main value proposition
- Important timestamps
- Evidence confidence
- Processing limitations

The final understanding must be grounded in extracted evidence.

Do not let the model invent missing information.

---

# 5. EVIDENCE AND CONFIDENCE SYSTEM

Implement a reliable evidence-based publishing system.

Every important generated claim should be traceable to the uploaded video.

Examples:

- A title claiming a React tutorial must have evidence that React is actually demonstrated.
- A description claiming a particular feature was built must have evidence of that feature.
- A chapter must correspond to an actual timestamp.
- A thumbnail must come from an actual uploaded-video frame.

Use evidence records containing:

- Evidence type
- Observation
- Timestamp
- Source frame or transcript reference
- Confidence
- Related publishing claim

Do not trust model-generated confidence scores without validation.

Do not display arbitrary quality scores or pretend that an uncalibrated score represents measured performance.

If evidence is insufficient:

- Clearly display the limitation.
- Do not produce misleading publishing metadata.
- Ask the user to retry analysis or provide additional context when appropriate.
- Allow safe manual editing where possible.

Avoid unnecessarily blocking videos that can still be understood through one available modality.

For example, a silent screen recording may still contain sufficient visual evidence.

---

# 6. AI MODEL CONFIGURATION

The application should use user-configured AI models rather than relying on hardcoded model names.

Inspect the existing model configuration and preserve its architecture where possible.

Support configurable providers and models for:

- Text generation
- Vision analysis
- Audio transcription

Prioritize free or locally runnable options.

Potential integrations to evaluate:

- Ollama
- OpenRouter free models, when currently available
- Hugging Face models with suitable inference access
- Other compatible providers

Do not assume that every Hugging Face model has a free hosted inference endpoint.

Do not silently switch to paid APIs.

Do not hardcode one model throughout the codebase.

The user should be able to understand which model is being used.

Implement:

- Provider configuration
- Model selection
- API-key validation
- Connection testing
- Timeout handling
- Retry handling
- Provider errors
- Model capability validation
- Graceful fallback behavior

A vision task must not accidentally be sent to a text-only model.

Do not send an entire video file to an LLM if the provider cannot process it.

Use extracted frames, transcript segments, and structured evidence.

Never expose API keys in client-side code, logs, or responses.

---

# 7. YOUTUBE TITLE RESEARCH ENGINE

This is another important feature.

The agent should generate titles based on the actual video and relevant YouTube patterns.

Use the YouTube Data API when the user has configured valid credentials.

Research relevant videos using:

- Search queries derived from the actual topic
- Relevant keywords
- Content category
- Similar video subjects
- Available public video metadata

Study:

- Title structure
- Common title patterns
- Keyword placement
- Title length
- Tutorial-oriented phrasing
- Curiosity-based phrasing
- Problem/solution phrasing
- Audience-oriented phrasing

Do not simply copy another creator's title.

Do not claim that a title is high-performing just because another video has many views.

Views are influenced by many factors and do not prove that the title caused performance.

Keep research separate from video evidence.

## 7.1 YouTube API behavior

Implement proper API integration.

Handle:

- Missing API key
- Invalid API key
- Quota exhaustion
- Network errors
- No relevant search results
- Rate limiting
- Invalid responses

Cache research results where appropriate.

Avoid excessive API calls.

Clearly distinguish:

- Live YouTube research
- Cached research
- Research unavailable

Do not display fake search counts or fabricated competitor results.

Do not use hardcoded titles, channels, or view counts as live research.

---

# 8. TITLE GENERATION ENGINE

Generate approximately 5 distinct title options based on the actual video.

Each title must be:

- Relevant
- Accurate
- Understandable
- Natural
- Specific
- Search-friendly where appropriate
- Appropriate for the video's audience
- Within YouTube's title character limit

Generate different title approaches where supported by the content.

For example:

1. Direct and descriptive
2. Tutorial or educational
3. Problem/solution
4. Benefit-oriented
5. Curiosity-oriented

Do not force these approaches when they do not suit the video.

Avoid:

- Keyword stuffing
- Fake claims
- Misleading clickbait
- Unnecessary emojis
- Repeated title variations
- Generic titles
- Unsupported technologies
- False promises

Display:

- Title
- Character count
- Title approach
- Why it fits the video
- Supporting evidence
- Relevant timestamps, where available

Validate title length programmatically.

Do not rely on the LLM to count characters correctly.

Do not display fake scores.

The recommended title must be one of the actual generated options.

Explain why it is recommended using evidence, not invented performance metrics.

Allow users to edit titles manually.

---

# 9. DESCRIPTION GENERATION

Generate a useful YouTube description using the actual video content.

Include relevant elements where appropriate:

- Opening summary
- Main topic
- What viewers will learn
- Important demonstrations
- Technologies actually used
- Relevant chapters
- Relevant keywords
- Optional call to action

Do not create a generic description template filled with invented details.

Do not invent:

- GitHub links
- Social media links
- Product links
- Course links
- Sponsorships
- Contact information
- Timestamps
- Technologies
- Video outcomes

Only include links that the user has configured or supplied.

Generate a readable, natural description.

Allow the user to edit the description.

Validate the final description against YouTube's applicable limits.

---

# 10. TAGS AND CATEGORY

Generate relevant YouTube tags.

Tags should reflect:

- Main topic
- Actual technologies
- Relevant subtopics
- Audience search intent
- Related concepts

Avoid irrelevant tags and keyword stuffing.

Validate the number and total character length against YouTube's API requirements.

Do not invent technologies.

Suggest an appropriate YouTube category based on actual content.

Clearly distinguish between a recommendation and a confirmed category selection.

Allow manual editing.

---

# 11. CHAPTER GENERATION

Generate chapters from actual transcript and scene timestamps.

Rules:

- The first chapter must start at 00:00 when chapters are supplied.
- Chapters must be chronological.
- Timestamps must be valid.
- Chapter labels must describe actual content.
- Do not invent events or section transitions.
- Avoid excessive chapters.
- Do not generate chapters if evidence is insufficient.

Allow the user to edit or remove chapters.

---

# 12. THUMBNAIL GENERATION

Thumbnails must represent the actual uploaded video.

Do not use generic stock images or unrelated AI-generated imagery as if they were screenshots of the video.

Use actual extracted frames as the visual foundation.

Provide multiple useful thumbnail options when enough distinct frames exist.

Potential features:

- Select an appropriate source frame.
- Crop and position the frame.
- Add readable text overlays.
- Improve contrast and composition.
- Add visual emphasis without changing the meaning of the scene.
- Preview the thumbnail.
- Allow the user to choose and edit an option.

The thumbnail should be:

- Relevant to the video's content
- Visually clear
- Readable at small sizes
- Properly composed
- Technically valid for YouTube
- Exported in a supported image format

Validate:

- Image dimensions
- Aspect ratio
- File format
- File size
- Encoding
- Transparency behavior

Do not return fake SVG thumbnails when the upload pipeline expects a real raster image.

Do not create a thumbnail if no valid source frame is available.

Clearly identify the source frame and timestamp.

If AI-generated visual enhancements are used, preserve the actual video's meaning and avoid depicting events that never happened.

Do not claim a thumbnail has been uploaded until YouTube confirms success.

---

# 13. VIDEO AGENT USER INTERFACE

Preserve the current application's design language.

Improve the Video Agent page without redesigning unrelated pages.

The workflow should be understandable to a first-time user.

Recommended workflow stages:

1. Upload video
2. Analyze video
3. Review understanding
4. Generate publishing package
5. Review metadata
6. Preview thumbnail
7. Confirm publishing
8. Upload result

Display clear progress states.

For example:

- Uploading
- Extracting metadata
- Extracting frames
- Analyzing visuals
- Transcribing audio
- Extracting screen text
- Combining evidence
- Researching YouTube
- Generating metadata
- Preparing thumbnails
- Ready for review
- Uploading to YouTube
- Published

Do not show fake progress percentages.

If the underlying operation does not provide measurable progress, use honest stage-based progress.

Provide:

- Loading states
- Empty states
- Error states
- Retry buttons
- Cancel actions where technically safe
- Clear success messages
- Useful error descriptions
- Tooltips where appropriate
- Confirmation before publishing
- Responsive behavior
- Accessible labels
- Keyboard navigation
- Visible focus states

Prevent duplicate button submissions.

Disable actions when prerequisites are missing.

Do not lose the user's selections during unrelated UI updates.

Warn before discarding unsaved edits.

---

# 14. YOUTUBE UPLOAD AND PUBLISHING

Inspect the existing YouTube OAuth and publishing implementation.

Do not assume authentication works merely because a button exists.

Implement or repair:

- OAuth authentication
- Token handling
- Refresh-token handling
- Required scopes
- Secure credential storage
- Video upload
- Metadata upload
- Thumbnail upload
- Privacy settings
- Category
- Tags
- Description
- Title
- Upload status
- Error handling

Support the user's selection of privacy settings:

- Private
- Unlisted
- Public

Use safe defaults.

Show the final metadata before publishing.

The user must explicitly confirm publishing.

Do not automatically publish without confirmation.

Use YouTube's resumable upload functionality where appropriate.

Handle:

- Large files
- Interrupted uploads
- Network failures
- Expired access tokens
- Quota errors
- Invalid metadata
- Unsupported video formats
- Thumbnail upload failures

A thumbnail upload failure should not falsely report that the video itself failed if the video was successfully uploaded.

Track the actual YouTube video ID and upload status.

Provide a link to the uploaded video only when the API returns a valid video ID.

Never fabricate a published video URL.

Prevent accidental duplicate uploads.

Use a reliable upload state or idempotency strategy where practical.

---

# 15. API AND BACKEND QUALITY

Review every Video Agent API route.

Ensure:

- Proper request validation
- Proper response schemas
- Correct HTTP status codes
- Safe error messages
- Server-side secret handling
- Authentication checks
- File validation
- Timeouts
- Retry behavior
- Resource cleanup
- No leaked temporary files
- No unhandled promise rejections

Avoid putting long-running video-processing tasks into unsuitable serverless request lifecycles.

If background processing is needed, use an architecture compatible with the project's deployment constraints.

Do not introduce unnecessary infrastructure.

Keep interfaces clean and modular.

Avoid circular dependencies.

Avoid duplicate business logic.

Use shared validation schemas where appropriate.

---

# 16. SECURITY REQUIREMENTS

Review the project for:

- API key exposure
- OAuth token exposure
- Unsafe file uploads
- Path traversal
- Arbitrary file access
- Command injection
- Unsafe FFmpeg argument construction
- SSRF risks
- Missing authorization checks
- Unsafe logging
- Insecure temporary-file handling
- Dependency vulnerabilities

Never interpolate untrusted user input directly into shell commands.

Use safe process argument arrays.

Validate uploaded files and clean up temporary files.

Do not expose stack traces or secrets to users.

Do not store sensitive credentials in local storage.

Do not commit `.env` files or secrets.

---

# 17. PERFORMANCE AND RESOURCE MANAGEMENT

Video processing can be expensive.

Optimize:

- Frame sampling
- Image resizing
- Frame deduplication
- Audio transcription
- Model request size
- Parallel processing
- Caching
- Temporary storage
- API requests

Do not send unnecessary image data to models.

Do not repeat identical AI requests.

Use sensible timeouts and retry limits.

Avoid unbounded concurrency.

Ensure processing can handle failure without leaving temporary files behind.

If a model provider has input limits, split content into appropriate batches.

---

# 18. DATABASE AND PROCESSING STATE

Inspect the current persistence implementation before adding a database.

Do not introduce a new database if the existing architecture can safely support the feature.

Where appropriate, persist:

- Video job ID
- Original filename
- Processing status
- Video metadata
- Analysis results
- Evidence
- Generated title options
- Description
- Tags
- Thumbnail references
- User selections
- Publishing status
- YouTube video ID
- Error details
- Timestamps

Do not store large temporary media files in a database unnecessarily.

Do not assume local filesystem persistence exists in serverless deployments.

Make processing state recoverable where the architecture supports it.

---

# 19. KNOWN ISSUES FROM PREVIOUS IMPLEMENTATIONS

Investigate and resolve these known issues. Verify that they still exist before changing code.

### A. Incorrect generic title generation

Previously, a non-tutorial or unrelated video could receive tutorial-style titles.

A video was incorrectly classified based on duration or hardcoded category assumptions.

Fix:

- Remove hardcoded tutorial classification.
- Do not use duration as proof of content type.
- Base title generation on actual video evidence.
- Generate different styles only when relevant.

### B. Hardcoded niche/category

Previously, the system used a hardcoded Technology/Software Development niche.

Fix:

- Derive topic and category from actual evidence.
- Use user configuration only as supplementary context.
- Never let a default niche override the uploaded video's actual content.

### C. Hardcoded descriptions

Previously, descriptions contained fabricated details and timestamps.

Fix:

- Generate descriptions from the actual transcript and visual evidence.
- Validate chapters against real timestamps.
- Never invent links or technologies.

### D. Insufficient video understanding

Previously, the system relied too heavily on limited frame extraction.

Fix:

- Improve frame sampling.
- Add meaningful visual analysis.
- Add audio transcription.
- Add OCR where useful.
- Combine evidence correctly.

### E. Audio analysis problems

Previously, audio understanding was incomplete or unreliable.

Fix:

- Inspect the current audio pipeline.
- Repair extraction and transcription.
- Handle silent videos and transcription failures.
- Never fabricate dialogue.

### F. Vision model compatibility

Previously, attempts to use `qwen2.5-vl:3b` encountered issues such as:

- Model access or manifest errors
- Server timeouts
- Failed requests

Fix:

- Inspect actual provider and model configuration.
- Do not hardcode a model that cannot be accessed.
- Test model capabilities and connection status.
- Provide a clear error and a configurable alternative.

### G. Fake quality scores

Previously, some generated quality or performance scores were not based on a calibrated evaluation dataset.

Fix:

- Remove misleading scores.
- Do not pretend model confidence is measured accuracy.
- Display evidence and explanations instead.

### H. Publishing evidence grounding

Previously, the generator returned an empty `evidenceGrounding` array.

Fix:

- Implement actual evidence-grounding records.
- Connect each supported claim to source evidence.
- Validate timestamps.
- Do not accept arbitrary LLM-generated grounding as verified evidence.

### I. Fallback title logic

Previously, fallback title logic appeared to exist but was not clearly connected to the final generation result.

Fix:

- Inspect whether fallback logic is reachable.
- Remove dead code or implement it correctly.
- Ensure fallback titles are also grounded in evidence.
- Never generate generic metadata when evidence is inadequate.

### J. YouTube research reliability

Previously, research availability and actual research data needed clearer separation.

Fix:

- Do not show fake research counts.
- Handle quota exhaustion.
- Distinguish live, cached, and unavailable research.
- Do not confuse view counts with title quality.

### K. Thumbnail reliability

Previously, thumbnail generation needed stronger validation.

Fix:

- Use actual uploaded-video frames.
- Reject invalid image output.
- Validate final image dimensions and format.
- Handle missing frames.
- Preserve source timestamps.

### L. Upload state reliability

Fix:

- Prevent duplicate publishing.
- Distinguish video upload success from thumbnail upload failure.
- Handle resumable upload errors.
- Never display false success.

---

# 20. SMALL DETAILS THAT MUST NOT BE IGNORED

Inspect and fix all relevant edge cases:

- User uploads the same video twice.
- User uploads a corrupted video.
- User uploads a video with no audio.
- User uploads a video with no meaningful speech.
- User uploads a music video.
- User uploads a screen recording.
- User uploads a very short video.
- User uploads a long video.
- User uploads a portrait video.
- User uploads a landscape video.
- User uploads a video with multiple scenes.
- User uploads a video with little visual variation.
- User uploads a video with unreadable screen text.
- User cancels analysis.
- User refreshes during processing.
- User navigates away during processing.
- AI provider is unavailable.
- API key is invalid.
- Model returns malformed JSON.
- Model returns empty titles.
- Model returns duplicate titles.
- Model returns titles exceeding the character limit.
- Model returns irrelevant tags.
- Model returns unsupported technologies.
- YouTube API returns no search results.
- YouTube API quota is exhausted.
- OAuth expires during publishing.
- Upload is interrupted.
- Thumbnail upload fails.
- User double-clicks publish.
- User changes metadata after generation.
- User tries to publish without a valid video.
- Temporary processing files are left behind.
- Two video jobs run simultaneously.
- Browser refresh causes stale UI state.
- API returns a partial result.
- Model times out after another stage has completed.

For each relevant case, provide a sensible user experience and safe backend behavior.

---

# 21. TESTING REQUIREMENTS

Inspect existing tests before adding new ones.

Use the testing framework already installed in the project.

Do not replace working test infrastructure unnecessarily.

Create or update tests for:

## Video understanding
- Valid video metadata
- Invalid video
- Frame extraction
- Scene sampling
- Duplicate frame removal
- Audio extraction
- Silent video
- Transcript processing
- OCR handling
- Evidence combination
- Inadequate evidence

## Metadata generation
- Relevant titles
- Duplicate titles
- Title length validation
- Description generation
- Tag validation
- Category selection
- Chapter timestamp validation
- Unsupported claims
- Missing evidence
- Malformed model responses

## YouTube research
- Successful research
- Missing API key
- Quota exhaustion
- Empty search results
- Network failure
- Cached results

## Thumbnail
- Valid image
- Invalid image
- Missing source frame
- Unsupported format
- Incorrect dimensions
- Oversized file

## Publishing
- Successful upload
- OAuth failure
- Expired token
- Upload interruption
- Duplicate upload prevention
- Thumbnail failure after successful video upload
- Invalid metadata
- Missing video

## UI
- Upload validation
- Progress states
- Empty states
- Error states
- Retry
- User editing
- User selection preservation
- Publish confirmation

Use mocks for external APIs and AI providers.

Do not make real YouTube uploads during automated tests.

Do not claim that tests passed if they were not executed.

---

# 22. CODE QUALITY REQUIREMENTS

Follow the current project's conventions.

Use TypeScript properly.

Avoid:

- `any` without a clear reason
- Unnecessary type assertions
- Duplicate implementations
- Dead code
- Unused imports
- Hardcoded API credentials
- Hardcoded model names
- Hardcoded video categories
- Fake mock results in production paths
- Silent error swallowing
- Unnecessary dependencies
- Overly large components
- Excessive `useEffect`
- Unnecessary global state
- Unvalidated model output

Use clear interfaces and modular services.

Separate:

- Video ingestion
- Metadata extraction
- Frame extraction
- Audio processing
- OCR
- Vision analysis
- Evidence aggregation
- YouTube research
- Metadata generation
- Thumbnail generation
- OAuth
- Publishing

Do not overengineer the application.

---

# 23. ENVIRONMENT CONFIGURATION AND DOCUMENTATION

Inspect `.env.example` and update it with every required variable.

Never include actual credentials.

Document:

- AI provider configuration
- Text model configuration
- Vision model configuration
- Audio transcription configuration
- YouTube API credentials
- OAuth setup
- FFmpeg requirements
- Local development setup
- Deployment limitations
- Storage requirements

Provide clear instructions for Windows development where relevant.

The application should fail with helpful messages when required configuration is missing.

Do not silently use dummy credentials.

---

# 24. DEPLOYMENT COMPATIBILITY

The application is intended to work with Next.js and Vercel where possible.

Do not assume that local FFmpeg binaries, persistent disk storage, long-running background processes, or unlimited request durations are available on Vercel.

Inspect the existing deployment architecture.

Separate deployment-sensitive video processing from ordinary Next.js API routes.

Use an appropriate architecture for long-running video tasks.

If a feature cannot safely run on Vercel, document exactly what external worker or processing service is required.

Do not introduce paid infrastructure without explaining the alternatives and trade-offs.

Prefer free/local development paths.

---

# 25. FINAL ACCEPTANCE CRITERIA

The task is complete only when the following workflow works end-to-end, subject to available credentials and deployment infrastructure:

1. Upload a real video.
2. Validate it.
3. Extract actual metadata.
4. Extract representative frames.
5. Analyze visual content.
6. Process audio when available.
7. Extract screen text when useful.
8. Combine the evidence.
9. Display what the video actually contains.
10. Generate relevant title options.
11. Generate an accurate description.
12. Generate relevant tags.
13. Suggest a category.
14. Generate valid chapters when evidence permits.
15. Generate thumbnails using actual video frames.
16. Let the user edit and select metadata.
17. Preview the final package.
18. Authenticate with YouTube.
19. Publish only after confirmation.
20. Display the real upload result.

A missing API key must not be disguised as a successful integration.

A model failure must not be disguised as successful video understanding.

A missing transcript must not be replaced with fabricated dialogue.

A generated title must not claim something the video does not demonstrate.

A failed thumbnail upload must not erase a successful video upload result.

---

# 26. IMPLEMENTATION ORDER

Work in this order:

**Phase 1 — Audit**
- Inspect repository.
- Map architecture.
- Identify bugs.
- Identify incomplete functionality.
- Record files requiring changes.

**Phase 2 — Core video pipeline**
- Repair metadata extraction.
- Repair frame extraction.
- Improve visual understanding.
- Implement audio processing.
- Implement OCR where appropriate.
- Build evidence aggregation.

**Phase 3 — AI generation**
- Repair model configuration.
- Improve title generation.
- Improve descriptions.
- Improve tags and categories.
- Improve chapters.
- Implement evidence grounding.

**Phase 4 — YouTube research**
- Repair YouTube Data API integration.
- Add caching and error handling.
- Remove fake research data.

**Phase 5 — Thumbnail pipeline**
- Use actual video frames.
- Improve generation and editing.
- Validate image output.

**Phase 6 — Publishing**
- Repair OAuth.
- Repair video upload.
- Repair metadata upload.
- Repair thumbnail upload.
- Implement duplicate protection and upload state handling.

**Phase 7 — UI/UX**
- Connect all workflow stages.
- Improve progress and error states.
- Preserve existing design.
- Improve responsive and accessible behavior.

**Phase 8 — QA**
- Run tests.
- Run TypeScript checks.
- Run lint.
- Run production build.
- Fix regressions.
- Report anything that could not be verified.

Do not skip phases just to finish faster.

---

# 27. GIT AND CHANGE MANAGEMENT

I want a clean, reviewable implementation.

Before editing, inspect the current Git status and branch.

Do not overwrite my existing uncommitted changes.

Do not revert unrelated work.

Keep changes limited to the agreed Video Agent scope.

Group related work into coherent changes.

Do not create a series of unnecessary commits. Once all implementation and validation are complete, create **one final commit** containing the complete task.

Use a descriptive commit message such as:

`Complete video publishing agent pipeline and fix grounding issues`

Do not push or force-push without permission.

If you cannot complete the entire implementation safely in one session, do not pretend that it is finished. Leave the repository in a consistent state and provide a precise remaining-work report.

---

# 28. FINAL REPORT

At the end, provide:

1. Initial bugs discovered.
2. Bugs fixed.
3. Features implemented.
4. Files changed.
5. New dependencies, if any, and why they were needed.
6. Environment variables added or changed.
7. Tests added.
8. Tests actually executed and their results.
9. TypeScript/lint/build results.
10. Features requiring API credentials.
11. Features requiring external infrastructure.
12. Known remaining limitations.
13. Final commit hash, if committed.

For every incomplete feature, explain:

- What remains
- Why it remains
- Which file or service is responsible
- What is needed to finish it

Do not report an item as complete merely because code was written.

---

# MOST IMPORTANT INSTRUCTIONS

- Understand the existing code before changing it.
- Fix root causes, not symptoms.
- The uploaded video is the source of truth.
- Never invent video content.
- Never invent YouTube research.
- Never fabricate performance scores.
- Never hardcode a niche.
- Never hardcode a model unnecessarily.
- Never silently fall back to fake metadata.
- Never claim a failed operation succeeded.
- Preserve all unrelated pages and existing working functionality.
- Keep the implementation maintainable and deployment-aware.
- Prefer working features over impressive-looking placeholders.
- Test actual behavior, not just whether the page renders.

**Start by auditing the existing repository, then implement the complete Video Publishing Agent improvements. Do not stop at recommendations or an audit report.**