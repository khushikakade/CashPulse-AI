"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [activeBusiness, setActiveBusiness] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/business/active");
        const data = await res.json();
        if (data.active) {
          setActiveBusiness({ name: data.name, id: data.id });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchActive();
  }, []);

  return (
    <div className="bg-[#08090a] text-[#f4f5f6] min-h-screen flex flex-col font-sans selection:bg-[#0e9f6e] selection:text-black animate-fade-in">
      {/* Top Border Indicator */}
      <div className="h-1 bg-[#0e9f6e]" />
      
      {/* Editorial Header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-8 flex justify-between items-baseline border-b border-[#1e2023]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black tracking-wider uppercase text-[#f4f5f6]">CASHPULSE AI</span>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">/ B2B OPERATIONAL CORE</span>
        </div>
        <Link 
          href="/dashboard" 
          className="text-sm font-mono font-bold text-[#0e9f6e] hover:text-[#f4f5f6] transition-colors uppercase tracking-wider"
        >
          {activeBusiness ? `Access ${activeBusiness.name} Console` : "Access Console"} &rarr;
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 flex flex-col space-y-16">
        
        {/* Editorial Title */}
        <div className="text-left max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-[#f4f5f6] leading-[1.1] mb-6 uppercase">
            Cash is not the problem.<br/>
            <span className="text-[#0e9f6e] font-normal">Stuck cash is.</span>
          </h1>
          <p className="text-slate-455 text-base md:text-lg leading-relaxed max-w-2xl mb-8">
            An autonomous financial operations layer for Indian MSMEs. CashPulse actively audits receivables, isolates transaction errors, and triggers bounded recovery routines through Razorpay Test Mode APIs.
          </p>
          <div>
            <Link 
              href="/dashboard"
              className="bg-[#0e9f6e] text-black font-mono text-sm font-extrabold px-8 py-4 hover:bg-emerald-400 transition-colors uppercase tracking-wider inline-block"
            >
              {activeBusiness ? `Open ${activeBusiness.name} Workspace` : "Configure Workspace"}
            </Link>
          </div>
        </div>

        {/* Dynamic Workflow Explanation */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#1e2023] pt-12">
          <div className="space-y-3">
            <span className="text-xs text-[#0e9f6e] font-mono font-bold uppercase">01 / DETECT & DIAGNOSE</span>
            <h3 className="text-lg font-bold text-white uppercase font-sans">AI-Driven Risk Scan</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              CashPulse continuously monitors invoice lists and payment statuses. It identifies overdue items and failed checkouts instantly, diagnosing bank network errors or customer credit issues.
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-xs text-[#0e9f6e] font-mono font-bold uppercase">02 / COMPLY & APPROVE</span>
            <h3 className="text-lg font-bold text-white uppercase font-sans">Bounded Autonomy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated actions evaluate against safety guardrails. Small-value retries execute automatically, while high-value actions (≥ ₹50,000) route to the human operator queue for approval.
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-xs text-[#0e9f6e] font-mono font-bold uppercase">03 / RESCUE & SETTLE</span>
            <h3 className="text-lg font-bold text-white uppercase font-sans">Razorpay Integrations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Initiates direct retries or custom payment links. Settled links trigger immediate updates via webhooks, feeding the cash runway forecaster and updating the dashboard ledger in real-time.
            </p>
          </div>
        </section>

        {/* AI Stack Disclosure */}
        <section className="bg-[#0e1012] border border-[#1e2023] p-8 space-y-6">
          <div className="flex justify-between border-b border-[#1e2023] pb-4 text-xs text-slate-500 font-mono">
            <span>UNDER THE HOOD: THE AI ARCHITECTURE</span>
            <span>CASHPULSE_COGNITIVE_STACK</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
            <div className="space-y-2">
              <h4 className="text-white font-bold uppercase font-mono text-xs">🧠 Cognitive Risk Agent</h4>
              <p className="text-slate-400 text-xs">
                Powered by the **Google Gemini Pro** model. The agent processes transaction events, determines the root cause of failures, draft customer communications, and selects optimal collection strategies based on historical profiles.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-bold uppercase font-mono text-xs">📈 Stochastic Runway Forecast</h4>
              <p className="text-slate-400 text-xs">
                Built on **Scikit-Learn (Linear Regression)**. The system models cash trajectories, combining historical inflows and fixed costs with outstanding invoice probabilities to chart a 90-day cash envelope.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-8 border-t border-[#1e2023] flex justify-between items-baseline text-xs text-slate-500 font-mono mt-12">
        <div>&copy; 2026 CASHPULSE FinOps.</div>
        <div>RAZORPAY BUILDATHON CORE TRACK 3/4</div>
      </footer>
    </div>
  );
}
