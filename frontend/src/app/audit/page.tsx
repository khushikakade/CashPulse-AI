"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Loader2 } from "lucide-react";

interface AuditLog {
  id: string;
  event_type: string;
  message: string;
  payload: any;
  created_at: string;
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/audit/trail");
        const data = await res.json();
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e] mr-2" />
        LOADING SYSTEM AUDITS...
      </div>
    );
  }

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">Operational Audit Ledger</h1>
          <p className="text-slate-450 text-sm mt-1">Traceability logs documenting all automated decisions, safety checks, and webhook validations</p>
        </header>

        <section className="max-w-5xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-4">
            System Events Log
          </span>
          <div className="border border-[#1e2023] bg-[#0e1012] overflow-hidden">
            <table className="w-full text-left text-sm text-slate-350">
              <thead className="bg-[#08090a] text-xs font-semibold text-slate-500 uppercase border-b border-[#1e2023]">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Topic</th>
                  <th className="px-6 py-4">Event Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2023] text-slate-400">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-600 font-mono">
                      NO AUDIT LOGS RECORDED
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold font-mono uppercase px-2 py-1 ${
                          log.event_type === "PAYMENT_RECOVERED" ? "bg-emerald-500/10 text-emerald-400" :
                          log.event_type === "POLICY_BLOCKED" ? "bg-rose-500/10 text-rose-400" :
                          log.event_type === "RISK_DETECTED" ? "bg-indigo-500/10 text-indigo-400" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300 leading-relaxed">
                        {log.message}
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
