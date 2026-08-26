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
        RECONCILING TRANSACTION GRAPHS...
      </div>
    );
  }

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Ledger Reconciliation</h1>
          <p className="text-slate-400 text-sm mt-1">Audit verification across invoice orders, payment gateways, and settlement ledgers</p>
        </header>

        {/* Dense figures row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-[#1e2023] pb-6 mb-10 max-w-4xl">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Ledger rows scanned</span>
            <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Matched transactions</span>
            <span className="text-xl font-bold font-mono text-[#0e9f6e]">{stats.matched}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Exceptions isolated</span>
            <span className="text-xl font-bold font-mono text-rose-500">{stats.unresolved}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Match accuracy</span>
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
              SELECT ANY ROW IN THE LEDGER TABLE BELOW TO VIEW ITS PIPELINE INTEGRITY PATH.
            </p>
            
            {selectedItem ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 py-5 px-5 bg-black border border-[#1e2023] font-mono text-sm">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">CUSTOMER</span>
                  <span className="text-white font-bold">{selectedItem.reference}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-650 hidden md:block" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">ORDER</span>
                  <span className="text-white font-bold">₹{selectedItem.amount.toLocaleString("en-IN")}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-650 hidden md:block" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">PAYMENT GATEWAY</span>
                  <span className={selectedItem.status === "UNRESOLVED" ? "text-rose-500 font-bold" : "text-[#0e9f6e] font-bold"}>
                    {selectedItem.status === "UNRESOLVED" ? "FAILED" : "CAPTURED"}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-650 hidden md:block" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase">SETTLEMENT ESCROW</span>
                  <span className={selectedItem.status === "MATCHED" ? "text-[#0e9f6e] font-bold" : "text-amber-500 font-bold"}>
                    {selectedItem.status === "MATCHED" ? "DEPOSITED" : "HOLD_PENDING"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center border border-dashed border-[#1e2023] text-slate-500 font-mono text-xs">
                SELECT TRANSACTION TO TRACE ROUTING NODES
              </div>
            )}
          </div>
        </section>

        {/* Ledger Table */}
        <section className="max-w-5xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-4">
            Scanned Ledger Line Matches
          </span>
          <div className="border border-[#1e2023] bg-[#0e1012] overflow-hidden">
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="bg-[#08090a] text-xs font-semibold text-slate-500 uppercase border-b border-[#1e2023]">
                <tr>
                  <th className="px-6 py-4">Ref Number</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Audit Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2023] text-slate-400">
                {items.map((it) => (
                  <tr 
                    key={it.id} 
                    onClick={() => setSelectedItem(it)}
                    className="hover:bg-slate-900/10 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-200 font-mono">
                      {it.reference}
                    </td>
                    <td className="px-6 py-4 font-mono uppercase text-slate-500">
                      {it.type}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-white">
                      ₹{it.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold font-mono uppercase px-2.5 py-1 ${
                        it.status === "MATCHED" ? "bg-emerald-500/10 text-emerald-400" :
                        it.status === "PARTIAL_MATCH" ? "bg-amber-500/10 text-amber-400" :
                        "bg-rose-500/10 text-rose-400"
                      }`}>
                        {it.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-450 leading-relaxed">
                      {it.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
