"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Loader2 } from "lucide-react";

export default function Scenarios() {
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>("healthy");

  const triggerScenario = async (name: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/scenarios/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_name: name })
      });
      const data = await res.json();
      if (data.status === "success") {
        setActiveScenario(name);
        alert(`Stress scenario: "${name.toUpperCase().replace(/_/g, ' ')}" activated.`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to trigger scenario stress.");
    } finally {
      setLoading(false);
    }
  };

  const scenariosList = [
    {
      name: "healthy",
      title: "Healthy Baseline Operations",
      description: "Standard cash flows, gateway credit channels running at ~95% success factor, normal collection cycles.",
      color: "border-[#1e2023] bg-[#0e1012]"
    },
    {
      name: "payment_failure_spike",
      title: "Payment Failure API Surge",
      description: "Sudden bank server timeouts. Drops checkout success factor to ~40%, trapping pending transactions.",
      color: "border-rose-950/40 bg-rose-950/5 text-rose-400"
    },
    {
      name: "receivables_crisis",
      title: "Receivable Collections Freeze",
      description: "Institutional credit buyers delay invoice settlements, reducing immediate available cash balances.",
      color: "border-amber-950/40 bg-amber-950/5 text-amber-400"
    },
    {
      name: "cash_crunch",
      title: "Liquidity Shortfall Stress",
      description: "Aggregates tax dates and supplier obligations while receivables are pending. High likelihood of cash trap.",
      color: "border-red-950/50 bg-red-950/10 text-red-400"
    }
  ];

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Scenario stress simulator</h1>
          <p className="text-slate-400 text-sm mt-1">Stress-test recovery algorithms and automated rules under simulated cash anomalies</p>
        </header>

        <section className="max-w-3xl space-y-6">
          <div className="bg-[#0e1012] border border-[#1e2023] p-5 text-sm font-mono text-slate-350 leading-relaxed">
            SIMULATION CORE: SELECT STRESS SCENARIO TO INJECT LEDGER VARIANCE. AGENTS WILL REACT AUTOMATICALLY.
          </div>

          <div className="space-y-4">
            {scenariosList.map((sc) => (
              <div 
                key={sc.name} 
                className={`border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${sc.color} ${
                  activeScenario === sc.name ? "ring-1 ring-[#0e9f6e]" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-bold text-white text-base uppercase tracking-tight">{sc.title}</h3>
                    {activeScenario === sc.name && (
                      <span className="text-[10px] font-mono font-bold text-[#0e9f6e] uppercase bg-[#0e9f6e]/5 px-2 py-0.5 border border-[#0e9f6e]/20">
                        ACTIVE STATE
                      </span>
                    )}
                  </div>
                  <p className="text-slate-350 text-xs leading-relaxed">{sc.description}</p>
                </div>
                
                <button
                  onClick={() => triggerScenario(sc.name)}
                  disabled={loading}
                  className="bg-transparent hover:bg-slate-900 border border-slate-700 text-white font-mono text-xs font-bold px-4 py-2.5 transition-colors uppercase whitespace-nowrap"
                >
                  {loading && activeScenario === sc.name ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Trigger Stress"
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
