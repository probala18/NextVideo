"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Star,
  Search,
  Sparkles,
  Layers,
  Compass,
  ScanEye,
  DollarSign,
  Video,
  FileEdit,
  Activity,
  CheckCircle2,
  Flame,
  ArrowUpRight,
  X,
  TrendingUp,
  BarChart3,
  Sliders,
  Bookmark,
  PlaySquare
} from "lucide-react";

interface SonicLandingViewProps {
  onEnterStudio: (targetView?: string) => void;
}

interface FeatureItem {
  id: string;
  name: string;
  category: "INTEL" | "AUDIT" | "REVENUE" | "STUDIO" | "PIPELINE";
  metricLabel: string;
  metricValue: string;
  rating: number;
  reviewsCount: number;
  tagline: string;
  accentColor: string;
  badgeName: string;
  specs: string[];
  deliverables: string;
  studioTarget: string;
  icon: React.ElementType;
}

const SUITE_FEATURES: FeatureItem[] = [
  {
    id: "competitor-radar",
    name: "Competitor Outlier Radar",
    category: "INTEL",
    metricLabel: "VELOCITY BOOST",
    metricValue: "10x Baseline",
    rating: 4.9,
    reviewsCount: 342,
    tagline: "Scans YouTube channels in your niche to identify breakout videos that outperformed channel averages by 300% to 1000%.",
    accentColor: "#52634F",
    badgeName: "Olive Radar",
    specs: [
      "Real-time YouTube Data API v3 integration",
      "Historical view-to-subscriber multiplier algorithm",
      "Format classification (walkthroughs, essays, reviews)",
    ],
    deliverables: "Interactive Radar + Outlier Table + Watchlist",
    studioTarget: "discover",
    icon: Compass,
  },
  {
    id: "revenue-engine",
    name: "AdSense & Brand Revenue Predictor",
    category: "REVENUE",
    metricLabel: "SIMULATED RPM",
    metricValue: "$8.40 – $14.20",
    rating: 5.0,
    reviewsCount: 518,
    tagline: "High-precision monetization simulator calculating AdSense RPM, category niche premiums, and brand sponsorship pricing tiers.",
    accentColor: "#FF4500",
    badgeName: "Flame Terracotta",
    specs: [
      "Dynamic view velocity and seasonal RPM sliders",
      "Interactive 12-month compound earnings curve",
      "Dedicated Brand Deal Calculator with deliverable multipliers",
    ],
    deliverables: "Revenue Breakdown + Projected Payouts + Rate Sheet",
    studioTarget: "revenue",
    icon: DollarSign,
  },
  {
    id: "script-clinic",
    name: "Video Retention & Hook Clinic",
    category: "STUDIO",
    metricLabel: "RETENTION BENCHMARK",
    metricValue: "68% at 30s",
    rating: 4.9,
    reviewsCount: 226,
    tagline: "Diagnose audience drop-off points in your first 30 seconds. Generate psychological hooks, curiosity gaps, and payoff loops.",
    accentColor: "#1C1D21",
    badgeName: "Obsidian Console",
    specs: [
      "Intro friction diagnosis (fluff removal, promise speed)",
      "Curiosity loop framing with instant test alternatives",
      "Hook strength scoring (0-100) before you hit record",
    ],
    deliverables: "Diagnostic Audit + Script Hooks + Pacing Fixes",
    studioTarget: "diagnosis",
    icon: Activity,
  },
  {
    id: "channel-audit",
    name: "Channel Baseline Audit",
    category: "AUDIT",
    metricLabel: "HEALTH SCORE",
    metricValue: "92 / 100",
    rating: 4.9,
    reviewsCount: 189,
    tagline: "Comprehensive audit of your channel’s upload cadence, topic consistency, thumbnail contrast, and subscriber conversion efficiency.",
    accentColor: "#EFECE6",
    badgeName: "Architect Birch",
    specs: [
      "Niche alignment & topic saturation analysis",
      "Audience fatigue indicators and title clarity check",
      "Actionable 30-day corrective roadmap",
    ],
    deliverables: "Complete Channel Scorecard + Strategy Directives",
    studioTarget: "audit",
    icon: ScanEye,
  },
  {
    id: "production-studio",
    name: "Production Studio & Shoot Pack",
    category: "STUDIO",
    metricLabel: "SHOOT READINESS",
    metricValue: "Instant Pack",
    rating: 4.95,
    reviewsCount: 1204,
    tagline: "Turns verified ideas into production-ready shoots with teleprompter copy, shot lists, B-roll cue cards, and gear setup presets.",
    accentColor: "#76B947",
    badgeName: "Lime Emerald",
    specs: [
      "Automated A-roll teleprompter script builder",
      "Visual B-roll storyboard cue cards",
      "Direct export to YouTube description & title variants",
    ],
    deliverables: "Full Shoot Pack + Teleprompter + Cue Sheet",
    studioTarget: "production",
    icon: Video,
  },
  {
    id: "content-pipeline",
    name: "Kanban Video Pipeline Planner",
    category: "PIPELINE",
    metricLabel: "ACTIVE STAGES",
    metricValue: "5 Milestones",
    rating: 4.8,
    reviewsCount: 94,
    tagline: "Drag-and-drop creator production calendar organizing your video pipeline from spark of inspiration to uploaded master.",
    accentColor: "#333A42",
    badgeName: "Anodized Slate",
    specs: [
      "Status tracking: Idea, Scripting, Filming, Editing, Published",
      "One-click idea injection from Outlier Radar",
      "Production notes, target publish dates, and thumbnail drafts",
    ],
    deliverables: "Kanban Board + JSON/CSV Pipeline Export",
    studioTarget: "planner",
    icon: FileEdit,
  },
];

export const SonicLandingView: React.FC<SonicLandingViewProps> = ({ onEnterStudio }) => {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);
  const [quickTopic, setQuickTopic] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const categories = ["ALL", "INTEL", "AUDIT", "REVENUE", "STUDIO", "PIPELINE"];

  const filteredFeatures =
    activeCategory === "ALL"
      ? SUITE_FEATURES
      : SUITE_FEATURES.filter((f) => f.category === activeCategory);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnterStudio("discover");
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans antialiased selection:bg-[#FF4500] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (EXACT SONIC PILL AESTHETIC WITH CREATORLENS FEATURES)       */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#F9F9FB]/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Mark: Geometric bold logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-left group cursor-pointer"
            >
              <div className="text-2xl sm:text-3xl font-black tracking-[-0.04em] uppercase text-[#111111] flex items-center gap-1.5">
                <span>CREATOR</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500] inline-block animate-pulse" />
              </div>
              <div className="text-[9px] font-bold tracking-[0.22em] text-[#777777] uppercase -mt-1 group-hover:text-[#111111] transition-colors">
                YOUTUBE INTELLIGENCE // WORKSPACE
              </div>
            </button>
          </div>

          {/* Center Category Navigation Pills (Exact Sonic Pill Nav Style) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E5E7EB] p-1.5 rounded-full shadow-sm">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 text-xs font-black tracking-wider uppercase rounded-full transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-[#111111] text-white shadow-sm"
                    : "text-[#555555] hover:text-[#111111] hover:bg-[#F2F4F8]"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Right Action Icons & Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search Channel or Niche"
              className="w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#555555] hover:text-[#111111] hover:border-[#111111] transition shadow-xs"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEnterStudio("planner")}
              title="Pipeline Watchlist"
              className="relative w-10 h-10 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#555555] hover:text-[#111111] hover:border-[#111111] transition shadow-xs"
            >
              <Bookmark className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#76B947] text-white text-[10px] font-black flex items-center justify-center">
                3
              </span>
            </button>

            {/* Studio Switcher Button */}
            <button
              onClick={() => onEnterStudio("overview")}
              className="bg-[#111111] hover:bg-[#000000] text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
              <span>ENTER STUDIO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Search Dropdown Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[#E5E7EB] bg-white px-4 py-3 overflow-hidden"
            >
              <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a topic or competitor channel (e.g., beginner Python tutorials, AI productivity)..."
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  className="flex-1 bg-[#F9F9FB] border border-[#E5E7EB] rounded-full px-4 py-2 text-xs font-semibold text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#111111]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-[#FF4500] hover:bg-[#E03E00] text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition"
                >
                  Analyze Niche →
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (EXACT SONIC COMPOSITION & TYPOGRAPHY)                     */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-10 pb-12 sm:pb-16 overflow-hidden border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Top Subtitle with Green Indicator Dot - Exactly matching Dribbble reference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#76B947]" />
                <span className="text-xs sm:text-sm font-black tracking-widest text-[#111111] uppercase font-sans">
                  DESIGNED FOR MODERN YOUTUBE CREATORS
                </span>
              </div>
              <div className="text-[11px] font-mono tracking-widest text-[#777777] uppercase hidden sm:block">
                WORKSPACE STUFF // ED. 2026
              </div>
            </div>

            {/* Giant Geometric Display Typography (CREATOR) - Exact Sonic Typographic Scale */}
            <div className="relative select-none pointer-events-none">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-[19vw] sm:text-[18vw] lg:text-[16.5vw] font-black tracking-[-0.08em] leading-[0.85] text-[#111111] uppercase -ml-1 sm:-ml-3 text-center sm:text-left"
              >
                CREATOR
              </motion.h1>
            </div>

            {/* ================================================================= */}
            {/* CENTER ASSET STAGE (EXACT SONIC HERO WORKSTATION COMPOSITION)      */}
            {/* ================================================================= */}
            <div className="relative -mt-10 sm:-mt-24 lg:-mt-36 z-20 flex items-center justify-center">
              <div className="relative w-full max-w-5xl flex flex-col items-center">
                {/* Center Hero Product Image (Uploaded Product Workspace Stand & Accessories) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="relative group w-full flex justify-center py-4 sm:py-8"
                >
                  {/* Subtle ambient studio glow behind product */}
                  <div className="absolute inset-0 max-w-2xl mx-auto bg-gradient-to-b from-transparent via-[#F2F4F8] to-transparent rounded-full filter blur-3xl opacity-60 -z-10" />

                  <div className="relative max-w-3xl w-full flex items-center justify-center">
                    <img
                      src="/hero-creator-kit.jpg"
                      alt="CreatorLens Studio Pro Creator Kit"
                      className="w-full max-w-2xl sm:max-w-3xl object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.14)] transition-transform duration-500 group-hover:scale-[1.01]"
                    />

                    {/* Floating Upper Right Tag: ● WORKSPACE + 4-line sleek typography */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="absolute top-4 sm:top-12 right-2 sm:right-6 lg:right-12 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-xl max-w-[220px] sm:max-w-[260px] text-left"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#76B947] animate-pulse" />
                        <span className="text-[11px] font-black tracking-widest text-[#111111] uppercase">
                          WORKSPACE
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-extrabold text-[#333333] leading-relaxed tracking-wider uppercase font-mono">
                        PREMIUM CREATOR ESSENTIALS CRAFTED TO AUDIT CHANNELS, FORECAST REVENUE, AND ELEVATE EVERY VIDEO — FROM SCRIPT TO PUBLISH.
                      </p>
                    </motion.div>

                    {/* Floating Bottom Right CTA Button: Flame Orange Pill SET UP NOW → */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="absolute bottom-2 sm:bottom-8 right-2 sm:right-10 lg:right-16 z-30"
                    >
                      <button
                        onClick={() => onEnterStudio("overview")}
                        className="group bg-[#FF4500] hover:bg-[#E03E00] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-8 py-3.5 sm:py-4 rounded-full flex items-center gap-3 shadow-xl shadow-[#FF4500]/30 hover:shadow-2xl hover:shadow-[#FF4500]/40 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
                      >
                        <span>SET UP NOW</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </motion.div>

                    {/* Floating Bottom Left Asset Indicator: Interactive Switcher */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="absolute bottom-2 sm:bottom-8 left-2 sm:left-6 lg:left-12 bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl p-3 sm:p-4 shadow-lg flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#52634F] flex items-center justify-center text-white font-mono font-black text-xs">
                        9×
                      </div>
                      <div>
                        <div className="text-[10px] font-mono tracking-widest text-[#777777] uppercase">
                          INTELLIGENCE ECOSYSTEM
                        </div>
                        <div className="text-xs font-black text-[#111111] uppercase tracking-wide">
                          Pro Creator Studio Rig
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 3. 4-COLUMN METRIC BAR (EXACT TYPOGRAPHY & RATIO FROM DRIBBBLE)     */}
            {/* ================================================================= */}
            <div className="mt-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E5E7EB]">
                {/* Column 1: Creators Empowered */}
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#777777] mb-1">
                    CREATORS EMPOWERED
                  </span>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] tracking-tight">
                    18,000+
                  </div>
                  <span className="text-xs text-[#555555] font-medium mt-1">
                    Channels optimizing their video pipeline
                  </span>
                </div>

                {/* Column 2: Studio Modules */}
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#777777] mb-1">
                    STUDIO MODULES
                  </span>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] tracking-tight">
                    9 Core
                  </div>
                  <span className="text-xs text-[#555555] font-medium mt-1">
                    Intel, Audit, Revenue, Clinic, Studio, Planner
                  </span>
                </div>

                {/* Column 3: Average Rating with Red-Orange Star */}
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#777777] mb-1">
                    AVERAGE RATING
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] tracking-tight">
                      4.9
                    </span>
                    <Star className="w-7 h-7 sm:w-8 sm:h-8 fill-[#FF4500] text-[#FF4500]" />
                  </div>
                  <span className="text-xs text-[#555555] font-medium mt-1">
                    Based on 4,200+ verified creators
                  </span>
                </div>

                {/* Column 4: Real-time Data Sync */}
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#777777] mb-1">
                    DATA SYNC
                  </span>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] tracking-tight">
                    24/7 Live
                  </div>
                  <span className="text-xs text-[#555555] font-medium mt-1">
                    YouTube Data API v3 real-time intelligence
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MODULAR STUDIO SUITE CATALOG GRID (OUR FEATURES)                       */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB]">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]" />
              <span className="text-xs font-black tracking-widest text-[#777777] uppercase">
                YOUTUBE CREATOR INTELLIGENCE & PRODUCTION SUITE
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#111111] uppercase">
              MODULAR STUDIO SUITE
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs font-black tracking-wider uppercase rounded-full transition cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#111111] text-white"
                    : "bg-white border border-[#E5E7EB] text-[#555555] hover:text-[#111111] hover:border-[#111111]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelectedFeature(feature)}
                className="group bg-white border border-[#E5E7EB] hover:border-[#111111] rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Card Top: Category Tag & Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded bg-[#F2F4F8] text-[#333333]">
                      {feature.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#111111]">
                      <Star className="w-3.5 h-3.5 fill-[#FF4500] text-[#FF4500]" />
                      <span>{feature.rating}</span>
                      <span className="text-[#888888]">({feature.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Visual Representation Area with Feature Color */}
                  <div className="w-full h-48 bg-[#F8F9FA] rounded-xl border border-[#ECEEF2] mb-6 flex items-center justify-center p-6 relative overflow-hidden group-hover:bg-[#F2F4F8] transition-colors">
                    <div
                      className="w-24 h-24 rounded-2xl shadow-lg flex items-center justify-center p-3 transform transition-transform group-hover:scale-105"
                      style={{ backgroundColor: feature.accentColor }}
                    >
                      <div className="w-full h-full border border-white/20 rounded-xl flex items-center justify-center text-white text-center">
                        <Icon className="w-8 h-8 opacity-90" />
                      </div>
                    </div>

                    <span className="absolute bottom-3 right-3 text-[10px] font-mono text-[#777777] uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded border border-[#E5E7EB]">
                      {feature.badgeName}
                    </span>
                  </div>

                  {/* Feature Name & Tagline */}
                  <h3 className="text-lg font-black text-[#111111] mb-1 group-hover:text-[#FF4500] transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-xs font-medium text-[#666666] leading-relaxed line-clamp-2 mb-4">
                    {feature.tagline}
                  </p>
                </div>

                {/* Bottom: Metric Value & Launch Action */}
                <div className="pt-4 border-t border-[#F0F2F5] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#888888] font-bold uppercase block tracking-wider">
                      {feature.metricLabel}
                    </span>
                    <span className="text-xl font-black text-[#111111] tracking-tight">
                      {feature.metricValue}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnterStudio(feature.studioTarget);
                      }}
                      className="bg-[#111111] hover:bg-[#FF4500] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>LAUNCH</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. EDITORIAL PHILOSOPHY: CHALLENGE & CONCEPT (FROM DRIBBBLE REFERENCE)     */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16">
          {/* Left Column: Design Manifesto for Creators */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-[#FF4500]" />
                <span className="text-xs font-black tracking-widest text-[#777777] uppercase">
                  PHILOSOPHY & CRAFT
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] tracking-tight uppercase leading-[1.05]">
                MINIMALISM. FUNCTIONALITY. CREATOR ERGONOMICS.
              </h2>
            </div>

            <p className="text-base text-[#444444] leading-relaxed font-medium">
              CreatorLens is an intelligence-focused workspace showcasing channel forensics, script diagnostics, and production tools designed for modern YouTube creators. We combine algorithmic precision with deep creator craft.
            </p>

            {/* Quick feature highlights */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#76B947]/15 flex items-center justify-center text-[#76B947] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-black text-[#111111]">Bold experimental typography</div>
                  <div className="text-xs text-[#666666]">Establishes a recognizable contemporary identity that commands attention.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#76B947]/15 flex items-center justify-center text-[#76B947] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-black text-[#111111]">Clean white canvas</div>
                  <div className="text-xs text-[#666666]">Keeps attention strictly on the creator insights without distracting gradients.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#76B947]/15 flex items-center justify-center text-[#76B947] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-black text-[#111111]">Modular intelligence grid</div>
                  <div className="text-xs text-[#666666]">Makes exploring analytics, hooks, and RPM metrics intuitive without clutter.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Challenge & Concept Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 1: The Challenge */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🎯</span>
                  <span className="text-xs font-black tracking-widest text-[#111111] uppercase">
                    THE CHALLENGE
                  </span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm font-medium text-[#444444] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF4500] font-bold">•</span>
                    <span><strong>Eliminate guesswork</strong> in YouTube topic selection, competitor research, and video packaging.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF4500] font-bold">•</span>
                    <span><strong>Communicate retention & RPM quality</strong> without relying on clunky, technical spreadsheets.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF4500] font-bold">•</span>
                    <span><strong>Create a distinctive workspace</strong> that feels high-performance, contemporary, and creator-focused.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-[#F0F2F5] text-[11px] font-mono text-[#777777] uppercase">
                OBJECTIVE: EFFORTLESS FLOW
              </div>
            </div>

            {/* Card 2: Idea & Concept */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💡</span>
                  <span className="text-xs font-black tracking-widest text-[#111111] uppercase">
                    IDEA & CONCEPT
                  </span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm font-medium text-[#444444] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#76B947] font-bold">•</span>
                    <span><strong>Build around minimalism</strong>, creator velocity, and modern ergonomics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#76B947] font-bold">•</span>
                    <span><strong>Generous whitespace & oversized type</strong> to create an uncluttered editorial workspace.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#76B947] font-bold">•</span>
                    <span><strong>Playful green & orange accents</strong> to highlight breakout outliers, key interactions, and high-impact CTAs.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-[#F0F2F5] text-[11px] font-mono text-[#777777] uppercase">
                RESULT: CURATED SPEED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BIG CALL TO ACTION: STEP INTO THE COMPLETE INTELLIGENCE STUDIO         */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#111111] text-white rounded-3xl p-8 sm:p-14 lg:p-16 relative overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4500]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#76B947]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase text-white">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]" />
              <span>NEXT-GEN CREATOR PLATFORM</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[1.05]">
              STEP INTO THE COMPLETE INTELLIGENCE STUDIO.
            </h2>

            <p className="text-base sm:text-lg text-white/80 font-medium leading-relaxed">
              Access live channel auditing, YouTube market discovery, revenue engines, script clinic, and our full content production pipeline.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => onEnterStudio("overview")}
                className="bg-[#FF4500] hover:bg-[#E03E00] text-white font-black text-sm uppercase tracking-wider px-8 py-4 rounded-full flex items-center gap-3 shadow-lg shadow-[#FF4500]/30 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>LAUNCH STUDIO DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onEnterStudio("discover")}
                className="bg-white/10 hover:bg-white/20 text-white font-black text-sm uppercase tracking-wider px-8 py-4 rounded-full transition border border-white/20 cursor-pointer"
              >
                EXPLORE CHANNEL INTEL
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E5E7EB] bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-black tracking-tight text-[#111111] uppercase">
              CREATORLENS // WORKSPACE
            </div>
            <div className="text-xs text-[#777777] font-medium mt-1">
              Inspired by Sonic Workspace Dribbble design reference (Sans Design).
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#555555]">
            <button onClick={() => onEnterStudio("overview")} className="hover:text-[#111111] cursor-pointer">Dashboard</button>
            <button onClick={() => onEnterStudio("discover")} className="hover:text-[#111111] cursor-pointer">Channel Intel</button>
            <button onClick={() => onEnterStudio("audit")} className="hover:text-[#111111] cursor-pointer">Audit</button>
            <button onClick={() => onEnterStudio("revenue")} className="hover:text-[#111111] cursor-pointer">Revenue</button>
            <button onClick={() => onEnterStudio("production")} className="hover:text-[#111111] cursor-pointer">Studio</button>
            <button onClick={() => onEnterStudio("planner")} className="hover:text-[#111111] cursor-pointer">Pipeline</button>
          </div>

          <div className="text-xs font-mono text-[#888888]">
            © {new Date().getFullYear()} CREATORLENS WORKSPACE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 8. INTERACTIVE FEATURE DETAIL MODAL                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E5E7EB] relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#F2F4F8] hover:bg-[#E5E7EB] flex items-center justify-center text-[#555555] hover:text-[#111111] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded bg-[#F2F4F8] text-[#111111]">
                  {selectedFeature.category}
                </span>
                <span className="text-xs font-mono text-[#777777]">
                  DELIVERABLE: {selectedFeature.deliverables}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight uppercase mb-2">
                {selectedFeature.name}
              </h3>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-black text-[#111111]">{selectedFeature.metricValue}</span>
                <div className="flex items-center gap-1 text-xs font-bold text-[#111111]">
                  <Star className="w-4 h-4 fill-[#FF4500] text-[#FF4500]" />
                  <span>{selectedFeature.rating}</span>
                  <span className="text-[#888888]">({selectedFeature.reviewsCount} creator reviews)</span>
                </div>
              </div>

              {/* Accent swatch & badge */}
              <div className="mb-6 p-4 rounded-xl bg-[#F9F9FB] border border-[#E5E7EB] flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl shadow-md border border-white flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedFeature.accentColor }}
                >
                  <selectedFeature.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-[#111111]">{selectedFeature.badgeName}</div>
                  <div className="text-xs text-[#777777] font-mono">Module Route: /{selectedFeature.studioTarget}</div>
                </div>
              </div>

              <p className="text-sm font-medium text-[#444444] leading-relaxed mb-6">
                {selectedFeature.tagline}
              </p>

              {/* Specs */}
              <div className="space-y-2 mb-8">
                <div className="text-xs font-black uppercase tracking-wider text-[#111111]">KEY CAPABILITIES</div>
                {selectedFeature.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-medium text-[#555555]">
                    <CheckCircle2 className="w-4 h-4 text-[#76B947]" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#F0F2F5]">
                <button
                  onClick={() => {
                    const target = selectedFeature.studioTarget;
                    setSelectedFeature(null);
                    onEnterStudio(target);
                  }}
                  className="w-full sm:w-auto flex-1 bg-[#FF4500] hover:bg-[#E03E00] text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-full flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>LAUNCH THIS MODULE IN STUDIO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
