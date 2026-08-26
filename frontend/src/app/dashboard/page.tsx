"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Loader2, Zap } from "lucide-react";
import Link from "next/link";

interface Metrics {
  financial_health_score: number;
  cash_available: number;
  expected_30day_cash: number;
  revenue_at_risk: number;
  recoverable_value: number;
  recovered_this_month: number;
  outstanding_receivables: number;
  failed_payments_value: number;
  cash_runway_days: number;
  projected_shortfall_value: number;
}

interface ActionItem {
  case_id: string;
  action_id: string;
  title: string;
  description: string;
  impact_value: number;
  confidence: number;
  risk_level: string;
  needs_approval: boolean;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/dashboard/metrics");
      const data = await res.json();
      setMetrics(data.metrics);
      setActions(data.top_actions);
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExecuteAction = async (caseId: string, actionId: string) => {
    setActionLoading(caseId);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recovery/cases/${caseId}/process`, {
        method: "POST"
      });
      const data = await res.json();
      alert(`Intervention status: ${data.status.toUpperCase()}`);
      await fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-[#0e9f6e] mr-2" />
        AUDITING AARAV_HOMETECH LEDGERS...
      </div>
    );
  }

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Editorial Header */}
        <header className="flex justify-between items-baseline mb-10 border-b border-[#1e2023] pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Operational Command Center</h1>
            <p className="text-slate-400 text-sm mt-1">Aarav HomeTech &bull; Ledger State Live</p>
          </div>
          
          <Link 
            href="/scenarios" 
            className="text-sm font-mono font-bold text-[#0e9f6e] hover:text-[#f4f5f6] transition-colors uppercase tracking-wider flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-[#0e9f6e]/10" />
            Chaos Simulator
          </Link>
        </header>

        {/* 1. Cash Position Horizontal Line */}
        {metrics && (
          <section className="mb-12">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-2">
              Cash Ledger Balance
            </span>
            <div className="text-5xl font-extrabold font-mono text-white mb-8">
              ₹{metrics.cash_available.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-b border-[#1e2023] py-6">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-mono">Runway days</span>
                <span className="text-base font-bold font-mono text-white">{metrics.cash_runway_days} DAYS</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-mono">Expected Inflow (30D)</span>
                <span className="text-base font-bold font-mono text-[#0e9f6e]">
                  ₹{(metrics.cash_available + metrics.outstanding_receivables * 0.70).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-mono">Total Revenue At Risk</span>
                <span className="text-base font-bold font-mono text-rose-500">
                  ₹{metrics.revenue_at_risk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-mono">Recovered Cash (MTD)</span>
                <span className="text-base font-bold font-mono text-[#0e9f6e]">
                  ₹{metrics.recovered_this_month.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 2. Qualitative Liquidity Block */}
        <section className="mb-12 max-w-2xl bg-[#0e1012] border border-[#1e2023] p-6 font-mono text-sm text-slate-350 space-y-4">
          <div className="flex justify-between text-xs text-slate-500 border-b border-[#1e2023] pb-3">
            <span>BUSINESS LIQUIDITY ASSESSMENT</span>
            <span className="text-[#0e9f6e] font-bold">STABLE</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>Cash coverage: <span className="text-white font-bold">STRONG</span></div>
            <div>Receivables cycle: <span className="text-amber-500 font-bold">WATCH</span></div>
            <div>Payment success rate: <span className="text-white font-bold">STABLE</span></div>
            <div>Settlement timelines: <span className="text-white font-bold">STABLE</span></div>
          </div>
        </section>

        {/* 3. Money That Needs Attention */}
        <section className="mb-10 max-w-5xl">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono mb-6 border-b border-[#1e2023] pb-3">
            MONEY THAT NEEDS ATTENTION
          </h2>
          
          <div className="space-y-6">
            {actions.length === 0 ? (
              <div className="p-10 border border-[#1e2023] text-center text-slate-500 font-mono text-sm">
                LIQUIDITY CHANNELS SECURE. NO AT-RISK OUTLIERS.
              </div>
            ) : (
              actions.map((act) => (
                <div key={act.case_id} className="border border-[#1e2023] bg-[#0e1012] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-slate-800 transition-colors">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-extrabold font-mono text-white">
                        ₹{act.impact_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-[#0e9f6e] bg-[#0e9f6e]/5 px-2.5 py-0.5 rounded-none font-mono">
                        Prob: {Math.round(act.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 font-medium">
                      {act.title} &mdash; {act.description.split(".")[0]}.
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-[#1e2023]">
                    <Link 
                      href={`/recovery/${act.case_id}`} 
                      className="text-sm font-mono font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider"
                    >
                      Audit
                    </Link>
                    
                    <button
                      onClick={() => handleExecuteAction(act.case_id, act.action_id)}
                      disabled={actionLoading === act.case_id}
                      className="flex items-center gap-2 bg-[#0e9f6e] hover:bg-emerald-400 text-black font-mono text-xs font-extrabold px-5 py-3 transition-colors disabled:opacity-50 uppercase tracking-wider"
                    >
                      {actionLoading === act.case_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : act.needs_approval ? (
                        "Request Approval"
                      ) : (
                        "Execute Recovery"
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
