"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  GitCompare,
  RotateCcw,
  TrendingUp,
  Sliders,
  CheckSquare,
  History,
  ShieldCheck,
  Building2,
  Sparkles,
  Command,
  ArrowUpRight,
  Menu,
  X,
  Layers
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeBusiness, setActiveBusiness] = useState<{ name: string; id: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/business/active");
        if (res.ok) {
          const data = await res.json();
          if (data.active) {
            setActiveBusiness({ name: data.name, id: data.id });
            document.cookie = `business_id=${data.id}; path=/; max-age=31536000; SameSite=Lax`;
          }
        }
      } catch (e) {
        // Silent fallback to DwiSakhi demo
      }
    };
    fetchActive();
  }, []);

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const groups = [
    {
      label: "TODAY",
      items: [
        { name: "Today's Cash", href: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      label: "MONEY OWED",
      items: [
        { name: "Who Owes You Money", href: "/receivables", icon: Receipt },
        { name: "Match My Payments", href: "/reconciliation", icon: GitCompare }
      ]
    },
    {
      label: "COLLECT MONEY",
      items: [
        { name: "Get Stuck Money Back", href: "/recovery", icon: RotateCcw }
      ]
    },
    {
      label: "LOOK AHEAD",
      items: [
        { name: "How Long Will My Money Last?", href: "/cashflow", icon: TrendingUp },
        { name: "What If Money Gets Tight?", href: "/scenarios", icon: Sliders }
      ]
    },
    {
      label: "SAFETY & PERMISSIONS",
      items: [
        { name: "Waiting For Your Approval", href: "/approvals", icon: CheckSquare },
        { name: "History of Everything Done", href: "/audit", icon: History },
        { name: "What CashPulse Can Do", href: "/settings", icon: ShieldCheck }
      ]
    }
  ];

  const quickNav = [
    { label: "Cash", href: "/dashboard", icon: LayoutDashboard },
    { label: "Bills", href: "/receivables", icon: Receipt },
    { label: "Recover", href: "/recovery", icon: RotateCcw },
    { label: "What-If", href: "/scenarios", icon: Sliders }
  ];

  const businessName = activeBusiness?.name || "द्वीSakhi";

  const renderNavContent = () => (
    <>
      {/* Brand Header */}
      <div className="px-4 py-4 border-b border-[#292622] flex items-center justify-between">
        <Link
          href="/"
          title="Back to CashPulse.com (Marketing Site)"
          className="flex items-center gap-3 p-1 rounded-2xl hover:bg-[#1E1C1A] transition-all group flex-1"
        >
          <div className="w-9 h-9 rounded-xl bg-[#2A2723] border border-[#3E3A34] flex items-center justify-center text-[#BBDCC7] shadow-sm transition-transform group-hover:scale-105">
            <span className="font-display font-black text-sm text-[#C8E1D1] tracking-tight">CP</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold text-[#FAF9F6] tracking-tight leading-tight">
                CashPulse
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B62] animate-pulse" />
            </div>
            <span className="text-[10px] text-[#8C877E] font-medium flex items-center gap-1 group-hover:text-[#BBDCC7] transition-colors">
              ← Back to website
            </span>
          </div>
        </Link>

        {/* Close button inside mobile sheet */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2.5 rounded-xl text-[#B5B0A6] hover:text-white hover:bg-[#2A2723] transition-colors tap-target"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-3.5 overflow-y-auto space-y-6">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <span className="text-[10px] font-bold text-[#706B63] px-3 mb-1.5 block tracking-wider uppercase">
              {group.label}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] ${
                      isActive
                        ? "bg-[#2A2723] text-[#FAF9F6] font-semibold shadow-xs border border-[#3E3A34]"
                        : "text-[#B5B0A6] hover:text-[#FAF9F6] hover:bg-[#1E1C1A]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-[#C8E1D1]" : "text-[#706B63]"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BBDCC7] ml-auto shrink-0 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Active Shop Card / Footer */}
      <div className="p-3.5 border-t border-[#292622]">
        <div className="bg-[#1E1C1A] border border-[#2E2B26] rounded-2xl p-3 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2A2723] flex items-center justify-center text-[#B5B0A6] shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#FAF9F6] truncate">
                {businessName}
              </div>
              <div className="text-[10px] text-[#8C877E] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B62] animate-pulse" />
                <span>Neha & Khushi • D2C Merch</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2E2B26] flex items-center justify-between text-[11px] text-[#8C877E]">
            <Link
              href="/"
              title="Exit to Marketing Site"
              className="hover:text-[#FAF9F6] flex items-center gap-1 transition-colors text-[10px] font-medium tap-target min-h-[36px]"
            >
              <span>CashPulse.com</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-sans font-medium text-[#B5B0A6] bg-[#2A2723] border border-[#3E3A34] rounded-md">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP PERMANENT SIDEBAR (Visible on md+ screens)          */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden md:flex w-64 bg-[#161514] border-r border-[#292622] text-[#B5B0A6] flex-col h-screen sticky top-0 font-sans select-none shrink-0 transition-all z-20">
        {renderNavContent()}
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE TOP APP BAR (Visible on <md screens)                */}
      {/* ------------------------------------------------------------- */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#161514] border-b border-[#292622] text-[#B5B0A6]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#2A2723] border border-[#3E3A34] flex items-center justify-center text-[#BBDCC7]">
            <span className="font-display font-black text-xs text-[#C8E1D1]">CP</span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-display text-sm font-bold text-[#FAF9F6]">CashPulse</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B62] animate-pulse" />
            </div>
            <span className="text-[10px] text-[#8C877E] block truncate max-w-[140px]">
              {businessName} • Live
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            title="Exit to Marketing Site"
            className="text-[10px] font-medium text-[#8C877E] hover:text-[#FAF9F6] px-2.5 py-1.5 rounded-lg border border-[#2E2B26] bg-[#1E1C1A] flex items-center gap-1"
          >
            Site <ArrowUpRight className="w-2.5 h-2.5" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-[#FAF9F6] bg-[#221F1C] border border-[#3E3A34] hover:bg-[#2A2723] transition-colors tap-target ml-1"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. MOBILE SLIDE-OUT DRAWER OVERLAY                            */}
      {/* ------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Sheet */}
          <div className="relative w-72 max-w-[85vw] bg-[#161514] border-r border-[#292622] text-[#B5B0A6] flex flex-col h-full shadow-2xl z-10 animate-fade-slide">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MOBILE BOTTOM QUICK NAVIGATION BAR (Thumb accessible)     */}
      {/* ------------------------------------------------------------- */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161514]/95 backdrop-blur-md border-t border-[#292622] px-2 py-1 flex items-center justify-around"
      >
        {quickNav.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl tap-target transition-all ${
                isActive
                  ? "text-[#C8E1D1] font-bold"
                  : "text-[#8C877E] hover:text-[#FAF9F6]"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-[#C8E1D1]" : "text-[#706B63]"}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#00F59B] mt-0.5" />
              )}
            </Link>
          );
        })}

        {/* Menu Tab button to open drawer */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl tap-target text-[#8C877E] hover:text-[#FAF9F6] transition-all cursor-pointer"
        >
          <Layers className="w-4 h-4 mb-0.5 text-[#706B63]" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
}
