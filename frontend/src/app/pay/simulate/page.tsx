"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { showToast } from "../../components/Toast";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";

function SimulateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const linkId = searchParams.get("link_id") || "plink_test";
  const amount = Number(searchParams.get("amount") || 15000);

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
      showToast(
        "Payment Authorized",
        `Simulated settlement of ₹${amount.toLocaleString("en-IN")} completed.`,
        "celebration"
      );
    } catch (e) {
      console.error(e);
      showToast("Simulation Error", "Failed to dispatch test webhook event.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full warm-card p-8 sm:p-10 space-y-6 relative shadow-2xl">
      {/* Sandbox Header */}
      <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-[#225C3E] flex items-center justify-center font-bold text-xs">
            RZP
          </div>
          <div>
            <span className="font-semibold text-xs text-[#1A1A1A] block">
              Razorpay Checkout Sandbox
            </span>
            <span className="text-[10px] text-[#7A7770]">Customer Portal</span>
          </div>
        </div>

        <span className="badge-honey text-[10px]">
          Test Mode
        </span>
      </div>

      {success ? (
        <div className="text-center py-6 space-y-4 animate-fade-slide">
          <div className="w-14 h-14 bg-[#EAF3ED] text-[#225C3E] rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-display text-2xl font-bold text-[#1A1A1A]">
            Payment Authorized!
          </h2>

          <p className="text-xs text-[#5C5954] leading-relaxed max-w-xs mx-auto">
            Simulated settlement webhook sent. The original overdue invoice has been marked as recovered in your CashPulse dashboard.
          </p>

          <div className="pt-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-primary w-full text-xs py-3"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E5DF] space-y-3">
            <div>
              <span className="text-[10px] text-[#7A7770] uppercase font-medium block">
                Payment Link Reference
              </span>
              <div className="font-mono text-xs font-semibold text-[#1A1A1A] mt-0.5">
                {linkId}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E8E5DF]">
              <span className="text-[10px] text-[#7A7770] uppercase font-medium block">
                Amount Due
              </span>
              <div className="font-display text-2xl font-bold text-[#225C3E] mt-0.5">
                ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <p className="text-xs text-[#5C5954] leading-relaxed">
            This simulates the customer paying via UPI, NetBanking, or card. Clicking below triggers the verified payment webhook.
          </p>

          <button
            onClick={handleSimulatePayment}
            disabled={loading}
            className="btn-primary w-full text-xs py-3.5"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Simulating Settlement...
              </>
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
    <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen flex flex-col items-center justify-center font-sans px-4 py-12">
      <Suspense
        fallback={
          <div className="text-xs text-[#7A7770]">
            Loading Checkout Sandbox...
          </div>
        }
      >
        <SimulateContent />
      </Suspense>
    </div>
  );
}
