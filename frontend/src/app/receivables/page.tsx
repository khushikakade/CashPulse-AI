"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Loader2 } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
  probability_of_payment: number;
  customer: {
    name: string;
    email: string;
  };
}

export default function Receivables() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invRes = await fetch("http://localhost:8000/api/v1/recovery/cases");
        const cases = await invRes.json();
        
        const invCases = cases.filter((c: any) => c.reference_type === "invoice");
        
        const mappedInvoices = invCases.map((c: any) => ({
          id: c.reference_id,
          invoice_number: `INV-2026-00${Math.floor(Math.random() * 90) + 10}`,
          amount: c.expected_recovery_value / Math.max(0.1, c.recovery_probability),
          due_date: c.created_at,
          status: c.current_status === "recovered" ? "paid" : "overdue",
          probability_of_payment: c.recovery_probability,
          customer: c.customer
        }));
        
        setInvoices(mappedInvoices);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e] mr-2" />
        LOADING CREDIT RECEIVABLES...
      </div>
    );
  }

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Receivables Intelligence</h1>
          <p className="text-slate-450 text-sm mt-1">Schedules of outstanding invoices ranked by cash collection likelihood</p>
        </header>

        <section className="max-w-5xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-4">
            Receivables Ledger Priorities
          </span>
          <div className="border border-[#1e2023] bg-[#0e1012] overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#08090a] text-xs font-semibold text-slate-500 uppercase border-b border-[#1e2023]">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Debtor Customer</th>
                  <th className="px-6 py-4">Overdue Balance</th>
                  <th className="px-6 py-4">Age / Due Date</th>
                  <th className="px-6 py-4">Collection Prob.</th>
                  <th className="px-6 py-4">Escrow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2023] text-slate-400">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-650 font-mono">
                      NO CREDIT OUTSTANDINGS LOCATED
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white uppercase tracking-tight">{inv.customer?.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{inv.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-extrabold font-mono text-white">
                        ₹{inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(inv.due_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <span className={`font-bold ${
                          inv.probability_of_payment < 0.4 ? "text-rose-500" :
                          inv.probability_of_payment < 0.75 ? "text-amber-500" :
                          "text-[#0e9f6e]"
                        }`}>
                          {Math.round(inv.probability_of_payment * 100)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold font-mono uppercase px-2.5 py-1 ${
                          inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {inv.status}
                        </span>
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
