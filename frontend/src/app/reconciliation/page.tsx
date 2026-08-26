"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Loader2, ArrowRight } from "lucide-react";

interface ReconItem {
  id: string;
  type: string;
  reference: string;
  amount: number;
  date: string;
  status: string;
  explanation: string;
}

export default function Reconciliation() {
  const [items, setItems] = useState<ReconItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    unresolved: 0,
    rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReconItem | null>(null);

  useEffect(() => {
    const fetchRecon = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/reconciliation/report");
        const data = await res.json();
        setItems(data.items);
        setStats({
          total: data.total_checked,
          matched: data.matched_count,
          unresolved: data.unresolved_count,
          rate: data.reconciliation_rate
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecon();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e] mr-2" />
        SOURCING PAYMENTS LEDGER...
      </div>
    );
  }

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Payments Ledger</h1>
          <p className="text-slate-400 text-sm mt-1 font-normal">Direct sync via connected Razorpay account</p>
        </header>

        {/* Dense figures row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-[#1e2023] pb-6 mb-10 max-w-4xl">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Total Checked</span>
            <span className="text-xl font-bold font-mono text-white">{stats.total} Payments</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Matched Payments</span>
            <span className="text-xl font-bold font-mono text-[#0e9f6e]">{stats.matched} Succeeded</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Exceptions</span>
            <span className="text-xl font-bold font-mono text-rose-500">{stats.unresolved} Unresolved</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Sync Accuracy</span>
            <span className="text-xl font-bold font-mono text-white">{stats.rate}%</span>
          </div>
        </section>

        {/* Money Leak Detective Visual Flow */}
        <section className="mb-10 max-w-5xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-3">
            Money Leak Detective
          </span>
          <div className="bg-[#0e1012] border border-[#1e2023] p-6">
            <p className="text-slate-400 text-xs font-mono mb-6">
              SELECT ANY PAYMENT BELOW TO TRACE SECURE FLOW PATH: CUSTOMER &rarr; ORDER &rarr; PAY GATEWAY &rarr; ESCROW SETTLEMENT.
            </p>
            
            {selectedItem ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 py-5 px-5 bg-black border border-[#1e2023] font-mono text-sm">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">CUSTOMER</span>
                  <span className="text-white font-bold">{selectedItem.reference}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-650 hidden md:block" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">ORDER VALUE</span>
                  <span className="text-white font-bold">₹{selectedItem.amount.toLocaleString("en-IN")}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-650 hidden md:block" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">GATEWAY STATUS</span>
                  <span className={selectedItem.status === "UNRESOLVED" ? "text-rose-500 font-bold" : "text-[#0e9f6e] font-bold"}>
                    {selectedItem.status === "UNRESOLVED" ? "Failed" : "Succeeded"}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-650 hidden md:block" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">SETTLEMENT ESCROW</span>
                  <span className={selectedItem.status === "MATCHED" ? "text-[#0e9f6e] font-bold" : "text-amber-500 font-bold"}>
                    {selectedItem.status === "MATCHED" ? "Deposited" : "Hold"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center border border-dashed border-[#1e2023] text-slate-500 font-mono text-xs">
                SELECT A PAYMENT RECORD TO VISUALIZE ROUTING
              </div>
            )}
          </div>
        </section>

        {/* Ledger Table */}
        <section className="max-w-5xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-4">
            Payments Ledger Logs
          </span>
          <div className="border border-[#1e2023] bg-[#0e1012] overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#08090a] text-xs font-semibold text-slate-500 uppercase border-b border-[#1e2023]">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">What's Happening</th>
                  <th className="px-6 py-4">Chance of Recovery</th>
                  <th className="px-6 py-4">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2023] text-slate-400">
                {items.map((it) => {
                  const chance = it.status === "MATCHED" ? "100%" : (it.status === "PARTIAL_MATCH" ? "70%" : "20%");
                  const nextStep = it.status === "MATCHED" ? "None (Settled)" : (it.status === "PARTIAL_MATCH" ? "Re-verify details" : "Retry transaction");
                  
                  // Human-friendly status translation
                  const humanStatus = it.status === "MATCHED" ? "Succeeded (Escrow clear)" : 
                                      (it.status === "PARTIAL_MATCH" ? "Waiting for payment confirmation" : "Payment didn't go through");

                  return (
                    <tr 
                      key={it.id} 
                      onClick={() => setSelectedItem(it)}
                      className="hover:bg-slate-900/10 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        {it.reference}
                      </td>
                      <td className="px-6 py-4 font-bold font-mono text-white whitespace-nowrap">
                        ₹{it.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <span className={`font-bold ${
                          it.status === "MATCHED" ? "text-[#0e9f6e]" :
                          it.status === "PARTIAL_MATCH" ? "text-amber-500" :
                          "text-rose-500"
                        }`}>
                          {humanStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold">
                        {chance}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-350">
                        {nextStep}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
