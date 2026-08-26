"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

function SimulateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const linkId = searchParams.get("link_id") || "plink_test";
  const amount = Number(searchParams.get("amount") || 0);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      const webhookPayload = {
        id: `evt_sim_${Math.random().toString(36).substring(2, 11)}`,
        event: "payment_link.paid",
        payload: {
          payment_link: {
            entity: {
              id: linkId,
              amount: amount * 100,
              status: "paid"
            }
          }
        }
      };

      const res = await fetch("http://localhost:8000/api/v1/webhooks/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Razorpay-Signature": "dummy_signature_in_mock_mode"
        },
        body: JSON.stringify(webhookPayload)
      });
      await res.json();
      setSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Failed to simulate webhook callback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full border border-[#1e2023] bg-[#0e1012] p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e2023] pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#002f34] flex items-center justify-center font-mono text-[10px] text-[#0e9f6e] font-extrabold">
            RZP
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            Razorpay Sandbox
          </span>
        </div>
        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 font-mono uppercase font-bold">
          Test Mode
        </span>
      </div>

      {success ? (
        <div className="text-center py-6 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-[#0e9f6e] mx-auto animate-bounce" />
          <h2 className="text-lg font-bold text-white font-mono uppercase">Payment Authorized</h2>
          <p className="text-xs text-slate-450 leading-relaxed font-mono">
            Simulated settlement webhook sent. Original payment reference has been marked as recovered in CashPulse dashboard.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-[#0e9f6e] hover:bg-[#10b981] text-black font-mono text-xs font-bold py-3 uppercase tracking-wider transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-mono uppercase">Payment Link ID</span>
            <div className="text-sm font-bold text-white font-mono">{linkId}</div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-mono uppercase">Amount Owed</span>
            <div className="text-2xl font-bold text-white font-mono">
              ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-black border border-[#1e2023] text-xs font-mono text-slate-400 leading-relaxed">
            This is a simulated Razorpay payment gateway client. Press the button below to execute an immediate successful checkout simulation.
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={loading}
            className="w-full bg-[#0e9f6e] hover:bg-[#10b981] text-black font-mono text-xs font-extrabold py-3.5 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Simulate Successful Settlement"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SimulatePayment() {
  return (
    <div className="bg-[#08090a] text-[#f4f5f6] min-h-screen flex flex-col items-center justify-center font-sans px-4">
      <Suspense fallback={
        <div className="text-slate-400 font-mono text-xs">
          Loading Sandbox Portal...
        </div>
      }>
        <SimulateContent />
      </Suspense>
    </div>
  );
}
