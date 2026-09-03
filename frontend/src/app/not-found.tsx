import Link from "next/link";
import { LayoutDashboard, ArrowLeft, Receipt, Sparkles, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#141312] font-sans flex flex-col items-center justify-center p-6 relative overflow-x-hidden">
      {/* Warm Ambient Glows */}
      <div className="absolute top-1/3 -left-24 w-80 h-80 bg-[#EAF3ED] rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-1/3 -right-24 w-80 h-80 bg-[#FEF8E8] rounded-full blur-3xl opacity-70 pointer-events-none" />

      <main className="max-w-md w-full warm-card p-8 sm:p-10 text-center space-y-6 relative z-10 shadow-xl border border-[#E5E1D8]">
        {/* Brand Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#161514] border border-[#292622] flex items-center justify-center shadow-md">
          <span className="font-display font-black text-2xl text-[#00F59B] tracking-tight">CP</span>
        </div>

        {/* 404 Beacon */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF0EB] border border-[#F5C7B5] text-[#8E3015] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" /> 404 • Page Not Found
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight">
            Off the Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#54504A] leading-relaxed max-w-sm mx-auto">
            The page, customer case, or invoice you’re looking for doesn’t exist or might have been reconciled into a new location.
          </p>
        </div>

        {/* Navigation Affordances */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/dashboard"
            className="btn-primary w-full min-h-[44px] text-xs sm:text-sm flex items-center justify-center gap-2 py-3 rounded-xl shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Today's Cash</span>
          </Link>

          <Link
            href="/receivables"
            className="btn-secondary w-full min-h-[44px] text-xs sm:text-sm flex items-center justify-center gap-2 py-3 rounded-xl"
          >
            <Receipt className="w-4 h-4" />
            <span>Check Who Owes You Money</span>
          </Link>

          <Link
            href="/"
            className="w-full min-h-[44px] text-xs text-[#706B63] hover:text-[#141312] flex items-center justify-center gap-1.5 py-2.5 transition-colors font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Marketing Homepage</span>
          </Link>
        </div>

        <div className="text-[11px] text-[#706B63] pt-2 border-t border-[#E5E1D8]">
          CashPulse AI • Autonomous Working Capital OS
        </div>
      </main>
    </div>
  );
}
