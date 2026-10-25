# NextVideo 🎬

> **The Intelligent YouTube Research, Strategy & Production Studio**

NextVideo is an all-in-one workspace designed for YouTube creators, content strategists, and video teams. It bridges the gap between audience research, content ideation, and production planning—helping creators make data-backed videos that respect viewer time and drive genuine engagement.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

---

## ✨ Key Features

### 🔍 1. Market & Video Discovery
- **Live YouTube Research**: Search any niche or topic across global or regional markets (powered by YouTube Data API v3).
- **Outlier Detection**: Identify videos outperforming channel subscriber counts by comparing view-to-subscriber ratios.
- **Competitor Landscape**: Benchmark emerging, growing, and established creators in your niche.

### 📊 2. Channel Deep Audit
- **Instant Channel Analysis**: Audit any public channel by URL, channel ID, or `@handle`.
- **Growth & Velocity**: Inspect total views, video count, subscriber metrics, and publishing frequency.
- **Recent Performance Benchmarking**: Analyze recent uploads to identify top-performing video formats and audience resonance.

### 💡 3. Strategy & Video Briefs
- **Audience-Centric Framing**: Generate complete video briefs with defined audience goals, value propositions, and key takeaways.
- **Hook & Structure Formulations**: Craft spoken opening hooks and structured outlines for both Long-form videos and YouTube Shorts.
- **Thumbnail Direction**: Get high-contrast thumbnail concepts and visual angle recommendations.

### 🎬 4. Production Studio & Scripting
- **Scene-by-Scene Breakdown**: Structured production packs with estimated timing, spoken voiceover script, visual cues, and on-screen graphics.
- **Asset & B-Roll Prompts**: Detailed prompt ideas for creating or sourcing custom B-roll assets.
- **Recording Checklist**: Actionable pre-production and filming checklists to streamline shoot days.

### 🩺 5. Performance Clinic
- **Diagnostic Analytics**: Enter YouTube Studio retention and CTR metrics to diagnose why specific videos plateaued.
- **Retention Drop Analysis**: Actionable recommendations for the 0:30 hook, mid-video dip, and end-screen conversion.

### 📅 6. Content Calendar & Planner
- **Production Pipeline**: Track video ideas through Ideation, Scripting, Filming, Editing, and Scheduled stages.
- **Local Persistence**: Keep shortlist and planner entries safely saved in your browser's local storage.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, React Server & Client Components) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) & Vanilla CSS |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Animations** | [Framer Motion 11](https://www.framer.com/motion/) & [GSAP 3](https://gsap.com/) |
| **Package Manager** | `npm` / `bun` |

---

## 📁 Project Structure

```text
NextVideo/
├── .env.local                  # Server-side environment variables (ignored by Git)
├── .gitignore                   # Standard Next.js & secret-protection rules
├── package.json                 # Project dependencies & scripts
├── next.config.mjs              # Next.js image domain & compiler configuration
├── tailwind.config.ts           # Design tokens, fonts & color palette
├── public/                      # Static assets & standalone previews
└── src/
    ├── app/
    │   ├── api/                 # App Router API routes
    │   │   ├── audit/route.ts       # Channel audit endpoint
    │   │   ├── ideas/route.ts       # Video briefs & idea generator
    │   │   ├── production/route.ts  # Production pack & scripting studio
    │   │   └── research/route.ts    # YouTube Data API v3 live search
    │   ├── globals.css          # Core CSS variables, typography & theme
    │   ├── layout.tsx           # Root layout & metadata
    │   └── page.tsx             # Interactive dashboard hub
    ├── components/              # Modular UI views & modals
    │   ├── AuditView.tsx            # Channel audit analyzer
    │   ├── ClinicView.tsx           # Retention & performance clinic
    │   ├── DiscoverView.tsx         # Market & outlier search
    │   ├── Header.tsx               # Workspace navigation & search bar
    │   ├── OpportunitiesView.tsx    # Topic opportunity matrix
    │   ├── OverviewView.tsx         # Creator overview dashboard
    │   ├── PlannerView.tsx          # Kanban production calendar
    │   ├── ProductionView.tsx       # Scriptwriting & production studio
    │   ├── Sidebar.tsx              # Application sidebar navigation
    │   └── StrategyView.tsx         # Strategic brief generator
    └── types/
        └── index.ts             # TypeScript interfaces & domain models
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.18 or higher (or [Bun](https://bun.sh/))
- **Git**

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/probala18/NextVideo.git
cd NextVideo
npm install
```
*(Alternatively, you can use `bun install`)*

### 3. Configure YouTube API (Optional but Recommended)

NextVideo operates with built-in realistic sample data out-of-the-box. To enable live YouTube searches and real-time channel audits:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and enable the **YouTube Data API v3**.
3. Create an **API Key** under *APIs & Services > Credentials*.
4. Create a `.env.local` file in the root directory:

```env
# .env.local
YOUTUBE_API_KEY=your_actual_youtube_api_key_here
```

> **Note**: `.env.local` is kept strictly server-side and excluded in `.gitignore` to prevent secret leakage.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using NextVideo.

---

## 🧪 Testing the API Endpoints

You can verify the backend endpoints directly:

- **Research Endpoint**:
  ```text
  GET /api/research?topic=Python%20tutorials&region=IN&sort=popular
  ```
- **Audit Endpoint**:
  ```text
  GET /api/audit?channel=@veritasium
  ```
- **Ideas Endpoint**:
  ```text
  POST /api/ideas
  Content-Type: application/json
  { "topic": "Next.js 14 full course", "audience": "Web Developers" }
  ```
- **Production Pack Endpoint**:
  ```text
  POST /api/production
  Content-Type: application/json
  { "topic": "How DNS Works", "format": "Long-form", "duration": "8-10 minutes" }
  ```

---

## 🚢 Deployment

The easiest way to deploy NextVideo is using the [Vercel Platform](https://vercel.com/new):

1. Push your repository to GitHub / GitLab.
2. Import the project in Vercel.
3. In Project Settings > **Environment Variables**, add:
   - Key: `YOUTUBE_API_KEY`
   - Value: *(your Google Cloud YouTube API Key)*
4. Click **Deploy**.

---

## 📜 Ethical Data & YouTube Disclaimer

- NextVideo uses only **public data** exposed through the official YouTube Data API v3.
- It does **not** scrape private analytics (impressions, private revenue, or audience demographics of third parties).
- NextVideo does not claim to decode or manipulate YouTube's proprietary recommendation algorithm; it is built on foundational audience retention, clarity, and pacing principles.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
