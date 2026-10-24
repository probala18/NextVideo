"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { OverviewView } from "@/components/OverviewView";
import { DiscoverView } from "@/components/DiscoverView";
import { AuditView } from "@/components/AuditView";
import { RevenueAnalyticsView } from "@/components/RevenueAnalyticsView";
import { ClinicView } from "@/components/ClinicView";
import { OpportunitiesView } from "@/components/OpportunitiesView";
import { StrategyView } from "@/components/StrategyView";
import { ProductionView } from "@/components/ProductionView";
import { PlannerView } from "@/components/PlannerView";
import { PrinciplesModal } from "@/components/PrinciplesModal";
import { ManualIdeaModal } from "@/components/ManualIdeaModal";
import { Toast, ToastMessage } from "@/components/Toast";
import { ChannelItem, VideoItem, IdeaItem, PlanItem, WatchlistChannel, VideoBrief, ProductionPack } from "@/types";

const initialDemoChannels: ChannelItem[] = [
  {
    id: "sample-a",
    name: "Sample Creator Lab",
    handle: "Illustrative profile",
    subs: "24K sample",
    subsN: 24000,
    views: "1.2M sample",
    viewsN: 1200000,
    stage: "Growing",
    category: "Tutorials",
    desc: "Illustrative profile only. Live channel data appears after a YouTube Data API key is configured.",
    fit: "Sample profile",
    avatar: "SC",
    color: "av1",
    url: "https://www.youtube.com/results?search_query=beginner+tutorials",
  },
  {
    id: "sample-b",
    name: "Sample Learn Studio",
    handle: "Illustrative profile",
    subs: "8.4K sample",
    subsN: 8400,
    views: "390K sample",
    viewsN: 390000,
    stage: "Emerging",
    category: "How-to videos",
    desc: "Example of a smaller channel profile for previewing the comparison layout; not a real channel.",
    fit: "Sample profile",
    avatar: "SL",
    color: "av2",
    url: "https://www.youtube.com/results?search_query=beginner+tutorials",
  },
  {
    id: "sample-c",
    name: "Sample Skills Channel",
    handle: "Illustrative profile",
    subs: "142K sample",
    subsN: 142000,
    views: "8.1M sample",
    viewsN: 8100000,
    stage: "Established",
    category: "Education",
    desc: "Illustrative profile for interface testing only—not a live recommendation or real channel stats.",
    fit: "Sample profile",
    avatar: "SS",
    color: "av3",
    url: "https://www.youtube.com/results?search_query=educational+tutorials",
  },
];

const initialDemoVideos: VideoItem[] = [
  {
    videoId: "sample-v1",
    title: "Sample: a complete beginner walkthrough",
    channel: "Sample Creator Lab",
    views: "12K sample",
    viewCount: 12000,
    age: "sample pattern",
    format: "Project walkthrough",
    why: "Illustrative record showing the kind of video detail shown in the dashboard.",
    thumb: "thumb-1",
    url: "https://www.youtube.com/results?search_query=beginner+Python+tutorials",
  },
  {
    videoId: "sample-v2",
    title: "Sample: common mistakes explained",
    channel: "Sample Learn Studio",
    views: "8.4K sample",
    viewCount: 8400,
    age: "sample pattern",
    format: "Problem-solving",
    why: "A problem-first structure can help a viewer find the answer they need.",
    thumb: "thumb-2",
    url: "https://www.youtube.com/results?search_query=beginner+Python+tutorials",
  },
  {
    videoId: "sample-v3",
    title: "Sample: learn the basics step by step",
    channel: "Sample Skills Channel",
    views: "6.1K sample",
    viewCount: 6100,
    age: "sample pattern",
    format: "Beginner tutorial",
    why: "Example record only; validate real demand with live search and audience signals.",
    thumb: "thumb-3",
    url: "https://www.youtube.com/results?search_query=beginner+Python+tutorials",
  },
];

const initialDemoIdeas: IdeaItem[] = [
  {
    title: "Build a useful Python project in 20 minutes",
    desc: "Help a beginner finish one small tool end-to-end and explain every decision.",
    score: 86,
    tags: ["Project-led", "Beginner", "Clear outcome"],
    type: "Differentiated angle",
    hook: "“By the end of this video, you’ll have a working tool—not just a list of syntax rules.”",
    outline: [
      "Show the finished tool and what it does",
      "Build it in small, named steps",
      "Explain the most common beginner mistake",
      "Demonstrate one small upgrade",
    ],
  },
  {
    title: "Python errors beginners see most—and how to fix them",
    desc: "Use real error messages as the structure, so the viewer can find their exact blocker.",
    score: 82,
    tags: ["Problem-solving", "Search intent", "Evergreen"],
    type: "Question-led tutorial",
    hook: "“If this error keeps appearing, here is what it means and how to fix it.”",
    outline: [
      "Show the error before explaining it",
      "Explain the cause in plain language",
      "Walk through the fix",
      "Show how to recognize the same pattern next time",
    ],
  },
  {
    title: "Learn Python by automating one repetitive student task",
    desc: "Connect coding to a student use case such as renaming files or organizing notes.",
    score: 79,
    tags: ["Specific audience", "Practical", "Story-led"],
    type: "Audience-specific",
    hook: "“Let’s make a small task you repeat every week happen automatically.”",
    outline: [
      "Describe the annoying task",
      "Show the end result",
      "Build the automation in stages",
      "Explain limits and a safe next step",
    ],
  },
  {
    title: "Python lists vs dictionaries with one visual example",
    desc: "Compare two commonly confused concepts using the same data and a tiny exercise.",
    score: 74,
    tags: ["Concept clarity", "Visual demo", "Short or long"],
    type: "Concept comparison",
    hook: "“Both store data, but they solve different problems. Let’s see the difference.”",
    outline: [
      "Show the sample data",
      "Use a list to answer one question",
      "Use a dictionary to answer another",
      "Give viewers a quick practice challenge",
    ],
  },
  {
    title: "A realistic 7-day Python learning plan for busy students",
    desc: "Set an achievable daily time budget and a small finished outcome per day.",
    score: 70,
    tags: ["Plan-based", "Student niche", "Series potential"],
    type: "Learning roadmap",
    hook: "“You don’t need an eight-hour study day. Here is a small plan you can finish around college.”",
    outline: [
      "Define the daily time budget",
      "Assign one concept and one practice task",
      "Build in a review day",
      "Show the finished mini-project",
    ],
  },
  {
    title: "I built the same beginner project three different ways",
    desc: "Compare a simple approach, a cleaner approach, and an extension without shaming beginners.",
    score: 68,
    tags: ["Comparison", "Retention structure", "Follow-up"],
    type: "Format experiment",
    hook: "“Let’s start with the simplest version and improve it one step at a time.”",
    outline: [
      "Show the simplest version",
      "Identify one limitation",
      "Refactor and compare",
      "Offer a challenge for the viewer",
    ],
  },
];

export default function Home() {
  const [currentView, setCurrentView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPrinciplesOpen, setIsPrinciplesOpen] = useState(false);
  const [isManualIdeaOpen, setIsManualIdeaOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [topic, setTopic] = useState("beginner Python tutorials");
  const [region, setRegion] = useState("IN");
  const [sort, setSort] = useState("popular");
  const [isSearching, setIsSearching] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [statusText, setStatusText] = useState("Demo research data");

  const [channels, setChannels] = useState<ChannelItem[]>(initialDemoChannels);
  const [videos, setVideos] = useState<VideoItem[]>(initialDemoVideos);
  const [ideas, setIdeas] = useState<IdeaItem[]>(initialDemoIdeas);
  const [watchlist, setWatchlist] = useState<WatchlistChannel[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);

  const [productionTransferData, setProductionTransferData] = useState<{
    topic?: string;
    audience?: string;
    outcome?: string;
    format?: string;
    pack?: ProductionPack;
    autoGenerate?: boolean;
  } | undefined>(undefined);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Theme synchronization
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("creatorlens-theme");
      if (savedTheme === "dark") {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      } else {
        setIsDark(false);
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Default to light matching the reference uploaded screenshot
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("creatorlens-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("creatorlens-theme", "light");
      }
      return next;
    });
  };

  // Load persisted plans & watchlist from localStorage
  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem("creatorlens-plans-v1");
      if (storedPlans) {
        setPlans(JSON.parse(storedPlans));
      }
      const storedWatchlist = localStorage.getItem("creatorlens-watchlist-v1");
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
      }
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToast({ id: String(Date.now()), text, type });
  };

  const saveWatchlistToStorage = (items: WatchlistChannel[]) => {
    setWatchlist(items);
    try {
      localStorage.setItem("creatorlens-watchlist-v1", JSON.stringify(items));
    } catch {
      showToast("Browser storage unavailable.", "error");
    }
  };

  const savePlansToStorage = (items: PlanItem[]) => {
    setPlans(items);
    try {
      localStorage.setItem("creatorlens-plans-v1", JSON.stringify(items));
    } catch {
      showToast("Browser storage unavailable.", "error");
    }
  };

  const handleSearch = async (newTopic: string, newRegion: string, newSort: string = sort) => {
    setTopic(newTopic);
    setRegion(newRegion);
    setSort(newSort);
    setIsSearching(true);
    setStatusText("Researching…");
    showToast("Searching channels and proven formats…", "info");

    try {
      const res = await fetch(
        `/api/research?topic=${encodeURIComponent(newTopic)}&region=${encodeURIComponent(newRegion)}&sort=${encodeURIComponent(newSort)}`
      );
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();

      if (data.channels && data.channels.length > 0) {
        setChannels(data.channels);
        setVideos(data.videos || initialDemoVideos);
        const live = data.source === "youtube";
        setIsLive(live);
        setStatusText(live ? "Live YouTube public data" : "Demo research data");
        showToast(
          live ? "Live public YouTube data loaded." : "Demo research loaded. Add an API key for live YouTube data.",
          live ? "success" : "info"
        );
      } else {
        throw new Error("No channels found");
      }
    } catch {
      setChannels(initialDemoChannels);
      setVideos(initialDemoVideos);
      setIsLive(false);
      setStatusText("Demo research data");
      showToast("Using demo research. Live data requires a YouTube API key.", "info");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveChannel = (c: ChannelItem) => {
    if (watchlist.some((w) => String(w.id) === String(c.id))) {
      showToast("Channel is already in your study list.", "info");
      return;
    }

    const newItem: WatchlistChannel = {
      id: String(c.id),
      name: c.name,
      handle: c.handle || "",
      subs: c.subs || "—",
      views: c.views || "—",
      stage: c.stage || "",
      category: c.category || topic,
      fit: c.fit || "",
      url: c.url || "https://www.youtube.com",
      avatar: c.avatar || c.name.slice(0, 2).toUpperCase(),
      color: c.color || "av1",
      savedAt: new Date().toISOString().slice(0, 10),
    };

    saveWatchlistToStorage([newItem, ...watchlist]);
    showToast("Channel added to your study list.", "success");
  };

  const handleRemoveWatchlist = (id: string) => {
    const updated = watchlist.filter((w) => String(w.id) !== String(id));
    saveWatchlistToStorage(updated);
    showToast("Channel removed from study list.", "info");
  };

  const handleExportWatchlist = () => {
    if (watchlist.length === 0) {
      showToast("Save a channel before exporting your shortlist.", "info");
      return;
    }
    const csv = [
      ["Channel", "Handle", "Subscribers", "Views", "Stage", "Topic", "URL", "Saved"],
      ...watchlist.map((c) => [c.name, c.handle, c.subs, c.views, c.stage, c.category, c.url, c.savedAt]),
    ]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "creatorlens-channel-shortlist.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Channel shortlist exported as CSV.", "success");
  };

  const handleSaveIdeaToPlanner = (
    title: string,
    note: string,
    status: PlanItem["status"] | string = "Idea"
  ) => {
    const normalizedStatus: PlanItem["status"] =
      status === "Scripting" ? "In progress" : (status as PlanItem["status"]) || "Idea";

    const cleanTitle = title.trim();
    const existingIndex = plans.findIndex(
      (p) => p.title.toLowerCase() === cleanTitle.toLowerCase()
    );

    if (existingIndex >= 0) {
      const existing = plans[existingIndex];
      const updatedItem: PlanItem = {
        ...existing,
        status: normalizedStatus,
        note: note || existing.note,
      };
      const remaining = plans.filter((_, idx) => idx !== existingIndex);
      const updatedList = [updatedItem, ...remaining];
      savePlansToStorage(updatedList);
      showToast(`Updated "${cleanTitle}" in Content Planner (${normalizedStatus}).`, "success");
      return;
    }

    const newPlan: PlanItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: cleanTitle,
      note,
      status: normalizedStatus,
      created: new Date().toISOString().slice(0, 10),
    };

    savePlansToStorage([newPlan, ...plans]);
    showToast(`Saved "${cleanTitle}" to Content Planner (${normalizedStatus}).`, "success");
  };

  const handleUpdatePlanStatus = (id: string, newStatus: PlanItem["status"]) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    savePlansToStorage(updated);
    showToast("Planner status updated.", "success");
  };

  const handleDeletePlan = (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    savePlansToStorage(updated);
    showToast("Idea removed from planner.", "info");
  };

  const handleExportPlans = () => {
    if (plans.length === 0) {
      showToast("Save an idea before exporting.", "info");
      return;
    }
    const csv = [
      ["Title", "Note", "Status", "Created", "Priority"],
      ...plans.map((p) => [p.title, p.note, p.status, p.created, p.score || ""]),
    ]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "creatorlens-content-plan.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Content plan exported as CSV.", "success");
  };

  const handleGenerateAngles = () => {
    const fresh = initialDemoIdeas.map((item, idx) => ({
      ...item,
      title:
        idx === 0
          ? `A beginner-friendly ${topic} project`
          : idx === 1
          ? `Common ${topic} mistakes—and how to fix them`
          : idx === 2
          ? `Learn ${topic} by solving one real problem`
          : idx === 3
          ? `The difference between key concepts in ${topic}`
          : idx === 4
          ? `A realistic 7-day ${topic} learning plan`
          : `Three ways to approach a ${topic} challenge`,
      score: Math.max(55, Math.min(94, item.score + Math.floor(Math.random() * 9) - 4)),
    }));
    setIdeas(fresh);
    showToast("Fresh topic angles generated.", "success");
  };

  const handleSelectIdeaForBrief = (idea: IdeaItem) => {
    setTopic(idea.title);
    setCurrentView("strategy");
    showToast(`Brief started for: "${idea.title}"`, "info");
  };

  const handleContinueToProduction = (brief: VideoBrief) => {
    setProductionTransferData({
      topic: brief.topic,
      audience: brief.audience,
      outcome: brief.promise,
      format: brief.format,
      pack: brief.pack,
      autoGenerate: !brief.pack,
    });
    setCurrentView("production");
    showToast("Transferred to Production Studio.", "success");
  };

  return (
    <div className="flex min-h-screen bg-[#ECEEF2] font-sans text-gray-900 transition-colors">
      {/* Sidebar Navigation matching Outcrowd Layout */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        planCount={plans.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenPrinciples={() => setIsPrinciplesOpen(true)}
        onNewResearch={() => {
          setCurrentView("overview");
          setTopic("");
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-2 sm:p-4 lg:p-5">
        <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6F9] rounded-[32px] border border-[#E0E4EB] shadow-[0_10px_35px_rgba(0,0,0,0.03)] overflow-hidden">
          <Header
            currentView={currentView}
            onSelectView={setCurrentView}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenPrinciples={() => setIsPrinciplesOpen(true)}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isSidebarOpen={sidebarOpen}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              {currentView === "overview" && (
                <OverviewView
                  topic={topic}
                  region={region}
                  sort={sort}
                  onTopicChange={setTopic}
                  onRegionChange={setRegion}
                  onSortChange={setSort}
                  onSearch={handleSearch}
                  isSearching={isSearching}
                  channels={channels}
                  videos={videos}
                  ideasCount={ideas.length}
                  planCount={plans.length}
                  plans={plans}
                  watchlist={watchlist}
                  onSaveChannel={handleSaveChannel}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === "discover" && (
                <DiscoverView
                  topic={topic}
                  region={region}
                  sort={sort}
                  onSearch={handleSearch}
                  isSearching={isSearching}
                  channels={channels}
                  videos={videos}
                  watchlist={watchlist}
                  onSaveChannel={handleSaveChannel}
                  onRemoveWatchlist={handleRemoveWatchlist}
                  onExportWatchlist={handleExportWatchlist}
                />
              )}

              {currentView === "audit" && (
                <AuditView
                  onPlanFollowup={(title, desc) => {
                    handleSaveIdeaToPlanner(title, desc);
                    setCurrentView("strategy");
                  }}
                  onToast={showToast}
                />
              )}

              {currentView === "revenue" && (
                <RevenueAnalyticsView />
              )}

              {currentView === "diagnosis" && (
                <ClinicView
                  onSaveIdea={(t, d) => handleSaveIdeaToPlanner(t, d)}
                  onToast={showToast}
                />
              )}

              {currentView === "opportunities" && (
                <OpportunitiesView
                  topic={topic}
                  ideas={ideas}
                  onGenerateAngles={handleGenerateAngles}
                  onSelectIdeaForBrief={handleSelectIdeaForBrief}
                  onSaveIdeaToPlanner={(idea) => handleSaveIdeaToPlanner(idea.title, idea.desc)}
                />
              )}

              {currentView === "strategy" && (
                <StrategyView
                  initialTopic={topic}
                  onContinueToProduction={handleContinueToProduction}
                  onSaveToPlanner={(t, n) => handleSaveIdeaToPlanner(t, n)}
                  onToast={showToast}
                />
              )}

              {currentView === "production" && (
                <ProductionView
                  initialData={productionTransferData}
                  onSaveToPlanner={(t, n, s) => {
                    handleSaveIdeaToPlanner(t, n, s as PlanItem["status"]);
                    setCurrentView("planner");
                  }}
                  onToast={showToast}
                />
              )}

              {currentView === "planner" && (
                <PlannerView
                  plans={plans}
                  onAddIdeaClick={() => setIsManualIdeaOpen(true)}
                  onUpdateStatus={handleUpdatePlanStatus}
                  onDeletePlan={handleDeletePlan}
                  onExportPlans={handleExportPlans}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
        </div>
      </div>

      {/* Modals & Toasts */}
      <PrinciplesModal
        isOpen={isPrinciplesOpen}
        onClose={() => setIsPrinciplesOpen(false)}
      />

      <ManualIdeaModal
        isOpen={isManualIdeaOpen}
        onClose={() => setIsManualIdeaOpen(false)}
        onSave={(t, n) => handleSaveIdeaToPlanner(t, n)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
