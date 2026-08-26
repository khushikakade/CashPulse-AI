"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Loader2 } from "lucide-react";

interface Policy {
  key: string;
  value: string;
  description: string;
}

export default function SettingsPage() {
  const [policies, setPolicies] = useState<Policy[]>([
    { key: "MAX_PAYMENT_RETRIES", value: "2", description: "Maximum automatic retries before stopping and escalating" },
    { key: "MAX_AUTOMATED_REMINDERS", value: "2", description: "Maximum number of reminders sent to a single customer" },
    { key: "MIN_HOURS_BETWEEN_REMINDERS", value: "24", description: "Minimum wait time before sending another notification" },
    { key: "MAX_AUTOMATED_DISCOUNT", value: "5", description: "Maximum automated early settlement discount percentage" },
    { key: "HIGH_VALUE_THRESHOLD", value: "50000", description: "Threshold above which human approval is mandatory for any intervention" }
  ]);
  const [loading, setLoading] = useState(false);

  const handleUpdatePolicy = (key: string, value: string) => {
    setPolicies(prev => prev.map(p => p.key === key ? { ...p, value } : p));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Operational parameters updated.");
    }, 600);
  };

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">Operational Safety Policies</h1>
          <p className="text-slate-400 text-sm mt-1">Configure limits, triggers, and parameters governing automated workflows</p>
        </header>

        <section className="max-w-2xl space-y-6">
          <div className="bg-[#0e1012] border border-[#1e2023] p-5 text-sm font-mono text-slate-350 leading-relaxed">
            SYSTEM CONSTRAINT: AUTONOMOUS INTERVENTIONS RUN ONLY INSIDE THESE GATED PARAMETERS. EXCEEDING VALUES AUTOMATICALLY SUSPEND AUTO-EXECUTION AND REQUIRE VERIFICATION.
          </div>

          <div className="border border-[#1e2023] bg-[#0e1012] divide-y divide-[#1e2023]">
            {policies.map((p) => (
              <div key={p.key} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm">
                <div className="flex-1">
                  <span className="text-xs text-[#0e9f6e] font-bold block uppercase mb-1.5 font-mono">{p.key}</span>
                  <p className="text-slate-350 text-xs leading-normal">{p.description}</p>
                </div>
                
                <input 
                  type="text" 
                  value={p.value}
                  onChange={(e) => handleUpdatePolicy(p.key, e.target.value)}
                  className="bg-black border border-[#1e2023] px-3.5 py-2.5 text-sm font-bold font-mono text-white w-full md:w-28 focus:border-[#0e9f6e] focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="bg-[#0e9f6e] hover:bg-emerald-400 text-black font-mono text-xs font-extrabold px-6 py-3 transition-colors uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Commit Changes"
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
