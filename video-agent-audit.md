# Video Agent Audit

## Scope reviewed

Reviewed the YouTube OAuth routes and publishing service, media inspector, visual analysis and metadata generation paths, the existing Video Agent OAuth modal, and their focused tests. Git was clean apart from the supplied `bug-prompt.md` before edits. Work is on `codex/video-agent-audit-fixes`.

## Findings and changes

| Area | Finding | Change |
| --- | --- | --- |
| OAuth callback | A random OAuth `state` was generated but never checked, allowing CSRF against the connected account. | Sign state with the configured client secret, enforce a 10 minute lifetime, and validate before exchanging an authorization code. |
| OAuth settings | The unauthenticated route accepted client secrets and wrote them to `.env.local`. | Reject credential submission; use server environment configuration. Updated the existing modal in place to explain setup and connect through the configured server values. |
| OAuth callback HTML | Google errors and channel names were interpolated into HTML, callback values were embedded in JavaScript, and `postMessage` used `*`. | Escape HTML and script values and restrict `postMessage` to the callback origin. |
| Media inspection | Failed parsing returned invented duration, dimensions, codecs, and audio/video tracks. FFprobe arguments were assembled into a shell command. | Invoke FFprobe with argument-safe `execFile`; reject invalid media and report only parsed values. |
| Video upload | The full video was read into memory before transfer. | Stream the file to the YouTube upload endpoint. |
| Publishing metadata | A default tag and a fixed technology category were sent regardless of the video; thumbnail HTTP errors were ignored. | Remove the fabricated tag, pass through the generated category when valid, and record thumbnail upload status separately from successful video upload. |
| Model configuration | Text and vision errors silently retried against a hardcoded OpenRouter model. | Remove those silent provider/model substitutions so selected provider failures remain visible. |
| Generator | A reference to nonexistent `buildCategoryFallbackTitles` caused runtime failure on the configured generation path. | Remove the unused reference and expose a clear notice when configured model output is unusable. |
| Existing tests | Some assertions expected invented media metadata, pixel measurements without an image analyzer, arbitrary quality scores, or AI copy without a usable model. | Align tests with evidence and availability behavior; add OAuth state validation coverage. |

## Preserved behavior

The existing Video Agent and OAuth modal layout remain in place. No dashboard, navigation, unrelated pages, or global styling were redesigned. No real YouTube upload was performed.

## Verification and remaining work

- `bun test`: 89 tests passed after the final test changes.
- `bunx tsc --noEmit`: passed.
- `git diff --check`: passed.
- `bun run build`: blocked because Next.js could not reach Google Fonts (`Inter` and `JetBrains Mono`) in this restricted network environment.
- `bun run lint`: unavailable until an ESLint configuration is added; Next.js opened an interactive first-run setup prompt.
- OAuth and YouTube upload still require configured Google OAuth credentials and an authorized channel. They have not been tested with real credentials.
- Video understanding, OCR, transcription, thumbnail creation, and deployment infrastructure were not fully audited or completed in this pass. In particular, the repository still needs a complete end-to-end review using a real uploaded video and configured providers.

## Build and lint follow-up

- No local font files were present. `next/font/google` was removed from the root layout and the existing Tailwind font variables now use system font stacks, removing Google Fonts as a build-time dependency.
- Added `.eslintrc.json` extending `next/core-web-vitals`, plus ESLint 8 and `eslint-config-next` 14.2.15. Fixed eight JSX quote lint errors. ESLint runs directly under Node with 0 errors and 12 existing warnings.
- The production build completed under Node without fetching fonts. It still reports the pre-existing missing `@libsql/client` module warning and dynamic route warnings. Bun's launch of the Node build/lint scripts exits with code 66 in this managed environment; direct Node invocations completed successfully.
- Expanded mocked OAuth and upload tests to cover callback authorization, token refresh, reconnect, private metadata, thumbnail reporting, and duplicate blocking. `bun test` reports 91 passing tests. These tests use mocked Google/YouTube responses and do not establish live account access or upload success.
- While validating the test suite, the pre-existing OAuth storage test was found to disconnect the stored channel without restoring it. The test now restores prior state. The current mock authorization record was cleared; the previous live token had already been removed by the old test, so the channel must be reconnected before live OAuth/upload validation. No video was sent to YouTube.
- The 6.34 second local test clip was identified, but the private upload could not proceed without a live stored authorization. The in-app browser is unavailable in this session, so interactive Google consent/reconnect must happen in a browser before continuing.
