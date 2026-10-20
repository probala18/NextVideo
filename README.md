# CreatorLens source code

CreatorLens is a YouTube creator research and planning workspace.

## Included files
- public/index.html — application structure and sections
- public/styles.css — responsive styling
- public/app.js — navigation, channel research, planner and client-side workflows
- public/production.js — production studio interactions
- api/research.js — YouTube Data API public channel/video research
- api/audit.js — public channel audit endpoint
- api/ideas.js — video ideas endpoint
- api/production.js — production-pack endpoint with template fallback
- .env.local — Server-side environment variables (e.g. YOUTUBE_API_KEY)

## Runtime
This application runs on Next.js 14. API routes are located in `src/app/api/` (with legacy handlers in `api/`). Template-based production packs and ideas remain available out-of-the-box.

## YouTube API setup
Enable YouTube Data API v3 in Google Cloud, create an API key, and configure it in `.env.local` as a server-side environment variable named `YOUTUBE_API_KEY`. Never put a real key into frontend files or commit it. When unavailable, the research endpoint returns clearly labeled sample data.

## Data limitations
Public YouTube API data does not reveal competitor impressions, CTR, retention, or revenue. Performance Clinic uses creator-entered Studio metrics. Shortlist and planner data are stored in the current browser.

## Running Locally
Run `npm run dev` or `bun dev` to start the Next.js development server at `http://localhost:3000`.
