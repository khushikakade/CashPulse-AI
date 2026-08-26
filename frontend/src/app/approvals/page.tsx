"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Loader2 } from "lucide-react";

interface ApprovalItem {
  action_id: string;
  case_id: string;
  customer_name: string;
  amount: number;
  action_type: string;
  confidence: number;
  risk_level: string;
  reason: string;
}

export default function ApprovalsQueue() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/approvals/queue");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecision = async (actionId: string, approve: boolean) => {
    setBtnLoading(actionId);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/approvals/${actionId}/decide?approve=${approve}`, {
        method: "POST"
      });
      await res.json();
      alert(`Action successfully ${approve ? 'approved' : 'rejected'}`);
      await fetchQueue();
    } catch (e) {
      console.error(e);
    } finally {
      setBtnLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e] mr-2" />
        LOADING PENDING AUDITS...
      </div>
    );
  }

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">Approvals Queue</h1>
          <p className="text-slate-400 text-sm mt-1">Actions suspended by risk policies awaiting operational review</p>
        </header>

        <section className="max-w-4xl space-y-6">
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="border border-dashed border-[#1e2023] p-12 text-center text-slate-500 font-mono text-sm">
                SYSTEM IN COMPLIANCE. NO ESCALATIONS PENDING.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.action_id} className="border border-[#1e2023] bg-[#0e1012] p-6 hover:border-slate-800 transition-colors">
                  <div className="flex justify-between items-baseline mb-4">
                    <div>
                      <span className="text-xs text-[#0e9f6e] font-bold block uppercase font-mono mb-1">
                        {item.action_type}
                      </span>
                      <h3 className="text-base font-bold text-white uppercase tracking-tight">{item.customer_name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold font-mono text-white">₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="text-sm text-slate-350 font-mono mb-5 border-t border-[#1e2023] pt-4">
                    <strong>EXPLANATION:</strong> {item.reason}
                  </div>

                  <div className="flex justify-end gap-4 pt-2">
                    <button
                      onClick={() => handleDecision(item.action_id, false)}
                      disabled={btnLoading !== null}
                      className="border border-[#1e2023] hover:border-slate-700 bg-transparent text-slate-400 font-mono text-xs font-bold px-4 py-2.5 transition-colors uppercase"
                    >
                      Reject Action
                    </button>
                    <button
                      onClick={() => handleDecision(item.action_id, true)}
                      disabled={btnLoading !== null}
                      className="bg-[#0e9f6e] hover:bg-emerald-400 text-black font-mono text-xs font-bold px-4 py-2.5 transition-colors uppercase"
                    >
                      {btnLoading === item.action_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Approve & Execute"
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
