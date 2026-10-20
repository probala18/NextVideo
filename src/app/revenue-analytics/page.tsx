import React from "react";
import { Metadata } from "next";
import { RevenueAnalyticsView } from "@/components/RevenueAnalyticsView";
import Link from "next/link";
import { ChevronLeft, LayoutDashboard, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Revenue Analytics & Channel Earnings Estimator — CreatorLens",
  description:
    "Estimate YouTube creator AdSense earnings based on observed public view counts, persistent daily snapshots, and published industry RPM benchmarks.",
};

export default function RevenueAnalyticsPage() {
  return (
    <div className="min-h-screen bg-ink-950 font-sans text-ink-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-ink-950/95 backdrop-blur-md border-b border-ink-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-ink-400 hover:text-ink-100 bg-ink-900 border border-ink-800 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>
          <div className="h-4 w-px bg-ink-800" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-studio-orange animate-pulse" />
            <span className="text-xs font-mono font-bold text-ink-200">
              REVENUE ANALYTICS DESK
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink-900 border border-ink-800 text-studio-orange">
            NEXT.JS 14 APP ROUTER
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <RevenueAnalyticsView />
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-ink-800 text-xs font-mono text-ink-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-ink-300 font-bold">creatorlens</span>
          <span className="px-1.5 py-0.2 bg-ink-900 border border-ink-800 text-studio-orange text-[10px] rounded">
            REVENUE INTELLIGENCE
          </span>
          <span>· Persistent view snapshots & industry RPM models</span>
        </div>

        <span className="text-[11px] text-ink-500">
          Public YouTube Data API v3 integration · Never reveals private AdSense statements
        </span>
      </footer>
    </div>
  );
}
