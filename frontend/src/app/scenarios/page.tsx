"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import CountUp from "../components/CountUp";
import { showToast } from "../components/Toast";
import { Sliders, Zap, CheckCircle2, AlertCircle, RefreshCw, ArrowDownRight, ShieldAlert } from "lucide-react";

export default function Scenarios() {
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>("healthy");
  const [latePayPercent, setLatePayPercent] = useState<number>(20);
  
  // Sensible default state calibrated to DwiSakhi scale
  const [cashAvailable, setCashAvailable] = useState<number>(316188);
  const [outstandingReceivables, setOutstandingReceivables] = useState<number>(202580);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/dashboard/metrics");
      if (!res.ok) throw new Error("Metrics API failed");
      const data = await res.json();
      if (data.metrics) {
        if (data.metrics.cash_available) {
          setCashAvailable(Number(data.metrics.cash_available));
        }
        if (data.metrics.outstanding_receivables) {
          setOutstandingReceivables(Number(data.metrics.outstanding_receivables));
        }
      }
    } catch (e) {
      console.error("Failed to load metrics for scenarios", e);
      // Keep baseline defaults so tool remains fully functional
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [activeScenario]);

  const triggerScenario = async (name: string, title: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/scenarios/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_name: name })
      });
      if (!res.ok) throw new Error("Scenario trigger failed");
      const data = await res.json();
      if (data.status === "success") {
        setActiveScenario(name);
        showToast(
          "Situation Simulated",
          `"${title}" is now active. DwiSakhi's cash forecast and risk figures have been updated.`,
          "info"
        );
        await fetchMetrics();
      }
    } catch (e) {
      console.error(e);
      showToast("Simulation Error", "Could not trigger this test situation.", "error");
    } finally {
      setLoading(false);
    }
  };

  const scenariosList = [
    {
      name: "healthy",
      title: "Normal D2C Order Day",
      description: "Standard daily website & Instagram collections. 95%+ of student checkouts succeed without delay.",
      tag: "Normal",
      type: "sage"
    },
    {
      name: "payment_failure_spike",
      title: "UPI & Gateway Checkout Failure Spike",
      description: "Bank server drops checkout success to ~40%. College student UPI intents get stuck before reaching you.",
      tag: "UPI Drops",
      type: "honey"
    },
    {
      name: "receivables_crisis",
      title: "College Fest Committees Delaying Payments",
      description: "Student council reimbursement cycles freeze, delaying ₹1.8L+ in bulk fest merchandise settlements.",
      tag: "Fest Delays",
      type: "honey"
    },
    {
      name: "cash_crunch",
      title: "Month-End Studio Rent & Fabric Crunch",
      description: "Shahpur Jat studio rent and Tirupur cotton blank supplier bills coincide with client payment delays.",
      tag: "Emergency",
      type: "peach"
    }
  ];

  // Dynamic calculations based on late payments slider
  const effectiveReceivables = Math.max(50000, outstandingReceivables);
  const stressImpact = Math.round(effectiveReceivables * (latePayPercent / 100));
  const scenarioCash = Math.max(0, Math.round(cashAvailable - stressImpact));

  return (
    <div className="flex bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-honey text-xs mb-1.5">
            <Sliders className="w-3.5 h-3.5" /> What-If Simulator
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            What If Money Gets Tight?
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            Test what happens to your bank balance if clients delay payments, before it actually happens.
          </p>
        </header>

        {/* Interactive What-If Section */}
        <section className="warm-card p-6 md:p-8 space-y-6">
          <div className="border-b border-[#E5E1D8] pb-3">
            <h2 className="font-display text-base font-bold text-[#141312]">
              Late Payment Slider
            </h2>
            <p className="text-xs text-[#54504A]">
              Drag the slider to test what happens if customers take longer to settle their bills
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-[#141312] flex items-center gap-2">
                <span>If</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FDF0EB] text-[#8E3015] font-bold text-sm border border-[#F5C7B5]">
                  {latePayPercent}%
                </span>
                <span>of customers delay payment:</span>
              </label>
              <span className="text-[11px] text-[#706B63] font-medium">
                Testing against ₹{effectiveReceivables.toLocaleString("en-IN")} in pending bills
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={latePayPercent}
              onChange={(e) => setLatePayPercent(Number(e.target.value))}
              className="w-full h-2.5 bg-[#E5E1D8] rounded-lg appearance-none cursor-pointer accent-[#141312]"
            />

            <div className="flex justify-between text-[11px] text-[#706B63] font-medium">
              <span>0% (Everyone pays on time)</span>
              <span>50% delay</span>
              <span>100% (Nobody pays on time)</span>
            </div>
          </div>

          {/* Real-time Narrative Impact Sentence */}
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8E3015]">
              <ShieldAlert className="w-4 h-4 text-[#8E3015]" /> What This Means For Your Business
            </div>
            <p className="font-display text-base sm:text-lg text-[#141312] leading-relaxed">
              If <strong className="text-[#8E3015] font-bold">{latePayPercent}%</strong> of your customers pay late, you would lose{" "}
              <strong className="text-[#8E3015] font-bold">
                ₹{stressImpact.toLocaleString("en-IN")}
              </strong>{" "}
              in immediate available cash, leaving you with{" "}
              <strong className="text-[#194F34] font-bold">
                ₹{scenarioCash.toLocaleString("en-IN")}
              </strong>{" "}
              in your account to pay bills and salaries.
            </p>
          </div>

          {/* 3 Outcome Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E1D8] shadow-xs">
              <span className="text-[11px] font-semibold text-[#706B63] block">
                Your Normal Cash
              </span>
              <div className="font-display text-xl font-bold text-[#141312] mt-1">
                ₹{cashAvailable.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-[#706B63] mt-0.5 block">
                Money currently in bank
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#EAF3ED] border border-[#BBDCC7] shadow-xs">
              <span className="text-[11px] font-semibold text-[#194F34] block">
                Your Cash Left If Delayed
              </span>
              <div className="font-display text-xl font-bold text-[#194F34] mt-1">
                ₹{scenarioCash.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-[#194F34]/80 mt-0.5 block">
                Estimated balance remaining
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FDF0EB] border border-[#F5C7B5] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8E3015] block">
                How Much You'd Lose
              </span>
              <div className="font-display text-xl font-bold text-[#8E3015] mt-1 flex items-center gap-1">
                <span>-₹{stressImpact.toLocaleString("en-IN")}</span>
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#8E3015]/80 mt-0.5 block">
                Stuck customer money
              </span>
            </div>
          </div>
        </section>

        {/* Pre-Configured Test Situations */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E1D8] pb-2">
            <h2 className="font-display text-base font-bold text-[#141312]">
              Real Situations You Can Test
            </h2>
            <p className="text-xs text-[#54504A]">
              Click any situation below to test how CashPulse’s automated recovery responds
            </p>
          </div>

          <div className="space-y-3">
            {scenariosList.map((sc) => {
              const isActive = activeScenario === sc.name;

              return (
                <div
                  key={sc.name}
                  className={`warm-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isActive ? "ring-2 ring-[#194F34] bg-[#EAF3ED]/30" : "warm-card-hover"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display text-base font-bold text-[#141312]">
                        {sc.title}
                      </h3>
                      {isActive && (
                        <span className="badge-sage text-[10px]">
                          Active Situation
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#54504A] max-w-xl">
                      {sc.description}
                    </p>
                  </div>

                  <button
                    onClick={() => triggerScenario(sc.name, sc.title)}
                    disabled={loading}
                    className={
                      isActive
                        ? "btn-secondary text-xs px-4 py-2 border-[#194F34] text-[#194F34] font-semibold"
                        : "btn-secondary text-xs px-4 py-2"
                    }
                  >
                    {loading && activeScenario === sc.name ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                        Simulating...
                      </>
                    ) : isActive ? (
                      "Currently Active"
                    ) : (
                      "Test This Situation"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
