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
  ArrowUpRight
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeBusiness, setActiveBusiness] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/business/active");
        const data = await res.json();
        if (data.active) {
          setActiveBusiness({ name: data.name, id: data.id });
          document.cookie = `business_id=${data.id}; path=/; max-age=31536000; SameSite=Lax`;
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchActive();
  }, []);

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

  return (
    <aside className="w-64 bg-[#161514] border-r border-[#292622] text-[#B5B0A6] flex flex-col h-screen sticky top-0 font-sans select-none shrink-0 transition-all z-20">
      {/* Brand Header: Links back to Landing Page (/) */}
      <div className="px-4 py-5 border-b border-[#292622]">
        <Link
          href="/"
          title="Back to CashPulse.com (Marketing Site)"
          className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#1E1C1A] border border-transparent hover:border-[#3E3A34] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2A2723] border border-[#3E3A34] flex items-center justify-center text-[#BBDCC7] shadow-sm transition-transform group-hover:scale-105">
              <span className="font-display font-black text-sm text-[#C8E1D1] tracking-tight">CP</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-base font-bold text-[#FAF9F6] tracking-tight leading-tight">
                  CashPulse
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B62] animate-pulse-subtle" />
              </div>
              <span className="text-[10px] text-[#8C877E] font-medium flex items-center gap-1 group-hover:text-[#BBDCC7] transition-colors">
                ← Back to website
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#706B62] group-hover:text-[#FAF9F6] transition-colors shrink-0" />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 overflow-y-auto space-y-6">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <span className="text-[10px] font-bold text-[#706B62] px-3 mb-1.5 block tracking-wider uppercase">
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#2A2723] text-[#FAF9F6] font-semibold shadow-xs border border-[#3E3A34]"
                        : "text-[#B5B0A6] hover:text-[#FAF9F6] hover:bg-[#1E1C1A]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-[#C8E1D1]" : "text-[#706B62]"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BBDCC7] ml-auto shrink-0 animate-pulse-subtle" />
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
                {activeBusiness ? activeBusiness.name : "द्वीSakhi"}
              </div>
              <div className="text-[10px] text-[#8C877E] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E8B62] animate-pulse-subtle" />
                <span>Neha & Khushi • D2C Merch</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2E2B26] flex items-center justify-between text-[11px] text-[#8C877E]">
            <Link
              href="/"
              title="Exit to Marketing Site"
              className="hover:text-[#FAF9F6] flex items-center gap-1 transition-colors text-[10px] font-medium"
            >
              <span>CashPulse.com</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-sans font-medium text-[#B5B0A6] bg-[#2A2723] border border-[#3E3A34] rounded-md">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}
