"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Case {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  reference_type: string;
  reference_id: string;
  risk_score: number;
  recovery_probability: number;
  expected_recovery_value: number;
  current_status: string;
  risk_level: string;
  created_at: string;
}

export default function RecoveryCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/recovery/cases");
        const data = await res.json();
        setCases(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e] mr-2" />
        LOADING RECOVERY WORKSPACE...
      </div>
    );
  }

  // Calculate statistics
  const totalAtRisk = cases.reduce((acc, c) => acc + (c.expected_recovery_value / Math.max(0.1, c.recovery_probability)), 0);
  const totalRecoverable = cases.reduce((acc, c) => acc + c.expected_recovery_value, 0);
  const totalRecovered = cases.filter(c => c.current_status === "recovered").reduce((acc, c) => acc + (c.expected_recovery_value / Math.max(0.1, c.recovery_probability)), 0);
  const recoveryRate = cases.length > 0 ? (cases.filter(c => c.current_status === "recovered").length / cases.length) * 100 : 0.0;

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Revenue Recovery Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">Active collection pipelines, payment failures, and credit exposures</p>
        </header>

        {/* Dense Stats Summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-[#1e2023] pb-6 mb-10 max-w-4xl">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Revenue at risk</span>
            <span className="text-2xl font-bold font-mono text-white">₹{totalAtRisk.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Recoverable value</span>
            <span className="text-2xl font-bold font-mono text-[#0e9f6e]">₹{totalRecoverable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Recovered MTD</span>
            <span className="text-2xl font-bold font-mono text-white">₹{totalRecovered.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Recovery Rate</span>
            <span className="text-2xl font-bold font-mono text-white">{recoveryRate.toFixed(1)}%</span>
          </div>
        </section>

        {/* Recovery queue table */}
        <section className="max-w-5xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-4">
            Recovery Cases Ledger
          </span>
          <div className="border border-[#1e2023] bg-[#0e1012] overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#08090a] text-xs font-semibold text-slate-500 uppercase border-b border-[#1e2023]">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Reference Type</th>
                  <th className="px-6 py-4">Risk Score</th>
                  <th className="px-6 py-4">Recovery Prob.</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2023] text-slate-400">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-600 font-mono">
                      NO ACTIVE EXPOSURE CASES RECORDED
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        {c.customer?.name}
                      </td>
                      <td className="px-6 py-4 font-mono uppercase text-slate-500">
                        {c.reference_type}
                      </td>
                      <td className={`px-6 py-4 font-mono font-bold ${
                        c.risk_level === "high" ? "text-rose-500" : "text-amber-500"
                      }`}>
                        {Math.round(c.risk_score)}%
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {Math.round(c.recovery_probability * 100)}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold font-mono uppercase px-2.5 py-1 ${
                          c.current_status === "recovered" ? "bg-emerald-500/10 text-emerald-400" :
                          c.current_status === "human_review" ? "bg-rose-500/10 text-rose-400" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {c.current_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link 
                          href={`/recovery/${c.id}`} 
                          className="border border-[#1e2023] hover:border-slate-700 bg-transparent text-slate-350 font-mono text-xs font-bold px-3.5 py-2 transition-colors uppercase tracking-wider"
                        >
                          Review File
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
