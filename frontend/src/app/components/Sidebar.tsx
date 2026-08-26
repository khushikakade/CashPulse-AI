"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      label: "Home",
      items: [{ name: "Cash Control Center", href: "/dashboard" }]
    },
    {
      label: "My Money",
      items: [
        { name: "Reconciliation Matcher", href: "/reconciliation" },
        { name: "Outstanding Receivables", href: "/receivables" }
      ]
    },
    {
      label: "Get Money Back",
      items: [
        { name: "Automated Recovery Pipeline", href: "/recovery" }
      ]
    },
    {
      label: "Plan Ahead",
      items: [
        { name: "Runway Forecasting", href: "/cashflow" },
        { name: "Liquidity Stress Testing", href: "/scenarios" }
      ]
    },
    {
      label: "Automatic Actions",
      items: [
        { name: "Operations Approval Queue", href: "/approvals" },
        { name: "Audit Trail & Event Logs", href: "/audit" },
        { name: "Autonomy Policies", href: "/settings" }
      ]
    }
  ];

  return (
    <aside className="w-60 bg-[#08090a] border-r border-[#1e2023] text-slate-400 flex flex-col h-screen sticky top-0 font-sans select-none shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-[#1e2023]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#0e9f6e] flex items-center justify-center font-mono text-xs text-black font-extrabold rounded-none">
            CP
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#f4f5f6] tracking-wider uppercase">CashPulse</h1>
            <span className="text-[10px] text-[#0e9f6e] uppercase tracking-widest font-mono font-bold block">FinOps OS</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-6">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-2 mb-2">
              {group.label}
            </span>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-2.5 py-2 text-sm font-medium rounded transition-colors ${
                      isActive 
                        ? "text-[#0e9f6e] bg-[#0e9f6e]/5 font-semibold" 
                        : "hover:text-[#f4f5f6] hover:bg-slate-900/30"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-[#1e2023] font-mono text-xs text-slate-500 flex flex-col gap-1.5 leading-relaxed">
        <div>ENTITY: {activeBusiness ? activeBusiness.name.toUpperCase() : "LOADING..."}</div>
        <div>GATEWAY: rzp_test_mode</div>
        <div>STATUS: ONLINE</div>
      </div>
    </aside>
  );
}
