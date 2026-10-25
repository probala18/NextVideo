import React from "react";
import { Metadata } from "next";
import { RevenueAnalyticsView } from "@/components/RevenueAnalyticsView";
import Link from "next/link";
import { ChevronLeft, LayoutDashboard, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Revenue Analytics & Channel Earnings Estimator — NextVideo",
  description:
    "Estimate YouTube creator AdSense earnings based on observed public view counts, persistent daily snapshots, and published industry RPM benchmarks.",
};

export default function RevenueAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#07080A] font-sans text-[#E8ECF5] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-8 py-3.5 bg-[#07080A]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#9FA7BD] hover:text-white bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 hover:bg-white/[0.07]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>
          <div className="h-5 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] block" />
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] block absolute inset-0 animate-ping opacity-40" />
            </div>
            <span className="text-xs font-mono font-bold text-[#CBD1E1] tracking-wider">
              REVENUE ANALYTICS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#8B5CF6]/10 to-[#6366F1]/10 border border-[#8B5CF6]/20 text-[#A78BFA]">
            LIVE DASHBOARD
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <RevenueAnalyticsView />
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-white/[0.04] text-xs font-mono text-[#495063] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[#9FA7BD] font-bold">nextvideo</span>
          <span className="px-2 py-0.5 bg-gradient-to-r from-[#8B5CF6]/10 to-[#6366F1]/10 border border-[#8B5CF6]/20 text-[#A78BFA] text-[10px] rounded-lg">
            REVENUE INTELLIGENCE
          </span>
          <span>· Persistent view snapshots & industry RPM models</span>
        </div>

        <span className="text-[11px] text-[#495063]">
          Public YouTube Data API v3 integration · Never reveals private AdSense statements
        </span>
      </footer>
    </div>
  );
}
