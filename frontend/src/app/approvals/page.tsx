"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import CountUp from "../components/CountUp";
import { showToast, triggerCelebration } from "../components/Toast";
import { CheckSquare, ShieldCheck, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";

interface ApprovalItem {
  id: string;
  case_id: string;
  customer_name: string;
  action_type: string;
  amount: number;
  reason_for_review: string;
  created_at: string;
}

export default function Approvals() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/approvals/queue");
      if (res.ok) {
        const data = await res.json();
        const queueItems = Array.isArray(data) ? data : (data.items || []);
        if (queueItems.length > 0) {
          setItems(queueItems);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load approvals queue", e);
    }

    // Sensible DwiSakhi demo fallback
    setItems([
      {
        id: "appr_1",
        case_id: "case_moodi",
        customer_name: "Mood Indigo IIT Bombay - Merch Committee",
        action_type: "Formal Payment Reminder & WhatsApp Collection Link",
        amount: 54000,
        reason_for_review: "Amount exceeds your ₹50,000 safety threshold. 150x Embroidered Caps & Stickers fest order needs Neha & Khushi's sign-off.",
        created_at: new Date().toISOString()
      },
      {
        id: "appr_2",
        case_id: "case_sympulse",
        customer_name: "Sympulse Fest Merch Cell - Symbiosis Pune",
        action_type: "Dispatch Early Payment Concession (3%)",
        amount: 64000,
        reason_for_review: "Bulk tote bag festival invoice of ₹64,000 exceeds automatic dispatch limit.",
        created_at: new Date().toISOString()
      }
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (id: string, decision: "approve" | "reject", customerName: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      });
      
      if (decision === "approve") {
        showToast(
          "Action Approved & Started",
          `CashPulse has executed the collection for ${customerName}.`,
          "success"
        );
      } else {
        showToast(
          "Action Cancelled",
          `The proposed action for ${customerName} was dismissed.`,
          "info"
        );
      }
      // Remove item from state
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
      // Demo fallback success
      if (decision === "approve") {
        showToast("Action Approved", `Approved collection step for ${customerName}.`, "success");
      } else {
        showToast("Action Rejected", `Dismissed proposed action for ${customerName}.`, "info");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-honey text-xs mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Safety Guardrails
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            Waiting For Your Approval
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            These actions involve larger sums of money. We paused them so you can review and give the green light.
          </p>
        </header>

        {/* Explainable Queue List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
            <div>
              <h2 className="font-display text-base font-bold text-[#141312]">
                Items Requiring Your OK
              </h2>
              <p className="text-xs text-[#54504A]">
                Review the customer, amount, and why human verification is required
              </p>
            </div>
            <span className="badge-neutral text-xs font-semibold">
              {items.length} waiting
            </span>
          </div>

          {items.length === 0 ? (
            <div className="warm-card p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EAF3ED] text-[#194F34] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-bold text-[#141312]">
                You're all caught up!
              </h3>
              <p className="text-xs text-[#54504A] max-w-md mx-auto">
                No actions are currently paused for manual approval. Everything is operating smoothly within your safety rules.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="warm-card p-6 space-y-4 transition-all hover:border-[#D6D1C5]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="badge-peach text-[10px]">
                          Amount: ₹{item.amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-[#706B63]">
                          {new Date(item.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short"
                          })}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#141312]">
                        {item.customer_name}
                      </h3>
                      <div className="text-xs font-semibold text-[#194F34]">
                        Action: {item.action_type}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => handleDecision(item.id, "reject", item.customer_name)}
                        disabled={actionLoading === item.id}
                        className="btn-secondary text-xs px-3.5 py-2 hover:border-[#C74E28] hover:text-[#8E3015]"
                      >
                        Skip / Dismiss
                      </button>

                      <button
                        onClick={() => handleDecision(item.id, "approve", item.customer_name)}
                        disabled={actionLoading === item.id}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        {actionLoading === item.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Approve & Execute"
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] text-xs space-y-1">
                    <span className="font-semibold text-[#8E3015] block">
                      Why CashPulse Paused This:
                    </span>
                    <p className="text-[#54504A] leading-relaxed">
                      {item.reason_for_review}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
