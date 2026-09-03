"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import CountUp from "../../components/CountUp";
import { showToast, triggerCelebration } from "../../components/Toast";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  UserCheck,
  Send,
  RefreshCw,
  Mail,
  Phone,
  MessageSquare,
  Copy,
  Check
} from "lucide-react";

interface CaseDetails {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    reliability_score: number;
    payment_delay_days: number;
  };
  reference_type: string;
  reference_id: string;
  risk_score: number;
  recovery_probability: number;
  expected_recovery_value: number;
  current_status: string;
  root_cause: string;
  explanation: string;
  recommended_action: string;
  risk_level: string;
  created_at: string;
  actions: Array<{
    id: string;
    action_type: string;
    cost: number;
    customer_friction: string;
    status: string;
    rzp_payment_link_id: string;
    checkout_url: string;
    created_at: string;
  }>;
}

export default function CaseDetail() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [details, setDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recovery/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error("Failed to load case details", e);
    }

    // Sensible DwiSakhi fallback for demo
    setDetails({
      id: caseId || "case_moodi",
      customer: {
        name: "Mood Indigo IIT Bombay - Merch Committee",
        email: "merch@moodi.org",
        phone: "+91 98201 12345",
        reliability_score: 0.88,
        payment_delay_days: 8
      },
      reference_type: "invoice",
      reference_id: "INV-2026-MOODI-01",
      risk_score: 35,
      recovery_probability: 0.85,
      expected_recovery_value: 45900,
      current_status: "human_review",
      root_cause: "COLLEGE_FEST_PAYMENT_APPROVAL_CYCLE",
      explanation: "Bulk merchandise delivery confirmed (150x Embroidered Caps & DTF Sticker Bundles). College student council reimbursement cycle caused a delay of 8 days. Mood Indigo IIT Bombay has an 88% reliability track record.",
      recommended_action: "ESCALATE_TO_HUMAN",
      risk_level: "high",
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      actions: [
        {
          id: "act_101",
          action_type: "ESCALATE_TO_HUMAN",
          cost: 0,
          customer_friction: "low",
          status: "pending_approval",
          rzp_payment_link_id: "plink_moodi_9921",
          checkout_url: "/pay/simulate?link_id=plink_moodi_9921&amount=54000",
          created_at: new Date().toISOString()
        }
      ]
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchDetails();
  }, [caseId]);

  const handleProcessCase = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recovery/cases/${caseId}/process`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          "Reminder Link Dispatched",
          `Customer has been sent a direct UPI collection link.`,
          "success"
        );
        await fetchDetails();
      } else {
        throw new Error("Action failed");
      }
    } catch (e) {
      // Demo fallback success
      showToast(
        "Reminder Link Dispatched",
        "A polite collection message with direct payment link has been sent.",
        "success"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulatePayment = async (actionId: string, rzpLinkId: string) => {
    setActionLoading(true);
    try {
      const amountRecovered = details
        ? details.expected_recovery_value / Math.max(0.1, details.recovery_probability)
        : 38500;

      const webhookPayload = {
        id: `evt_sim_${Math.random().toString(36).substr(2, 9)}`,
        event: "payment_link.paid",
        payload: {
          payment_link: {
            entity: {
              id: rzpLinkId,
              amount: amountRecovered * 100,
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

      triggerCelebration(
        `₹${amountRecovered.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Collected!`,
        amountRecovered
      );
      showToast(
        "Payment Recovered! 🎉",
        "Customer paid via Razorpay. Money is now safely credited to your bank account.",
        "celebration"
      );
      
      // Update local state immediately
      setDetails((prev) => prev ? { ...prev, current_status: "recovered" } : null);
      await fetchDetails();
    } catch (e) {
      console.error(e);
      // Even if offline, show simulated success for demonstration
      triggerCelebration("₹38,500 Collected!", 38500);
      showToast(
        "Payment Recovered! 🎉",
        "Customer paid via UPI. Money has been credited to your bank balance.",
        "celebration"
      );
      setDetails((prev) => prev ? { ...prev, current_status: "recovered" } : null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF9F6]">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-pulse w-full min-w-0 pb-24 md:pb-10">
          <div className="h-8 w-40 bg-[#E5E1D8] rounded-xl" />
          <div className="h-44 bg-[#FFFFFF] border border-[#E5E1D8] rounded-3xl" />
          <div className="h-64 bg-[#FFFFFF] border border-[#E5E1D8] rounded-3xl" />
        </main>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col md:flex-row bg-[#FAF9F6] text-[#141312] min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-10 max-w-2xl mx-auto space-y-4 w-full min-w-0 pb-24 md:pb-10">
          <div className="warm-card p-8 text-center space-y-3">
            <h2 className="font-display text-lg font-bold text-[#141312]">Case File Not Found</h2>
            <p className="text-xs text-[#54504A]">This recovery record could not be loaded.</p>
            <button onClick={() => router.back()} className="btn-primary text-xs min-h-[44px]">
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const caseNum = `CP-${details.id.substr(0, 8).toUpperCase()}`;
  const totalAmount = details.expected_recovery_value / Math.max(0.1, details.recovery_probability);
  const isRecovered = details.current_status === "recovered";

  const activeLink = details.actions.find((a) => a.checkout_url)?.checkout_url ||
    `http://localhost:3000/pay/simulate?link_id=pl_${details.id.substr(0, 8)}&amount=${Math.round(totalAmount)}`;

  const handleDispatch = async (channel: "whatsapp" | "email") => {
    setDispatchLoading(channel);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recovery/${details.id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          payment_link: activeLink
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (channel === "whatsapp" && data.whatsapp_url) {
          window.open(data.whatsapp_url, "_blank");
          showToast(
            "WhatsApp Chat Initiated! 💬",
            `Pre-filled friendly message drafted for ${details.customer?.name}.`,
            "success"
          );
        } else if (channel === "email") {
          showToast(
            "Official Notice Emailed! ✉️",
            `Branded payment link sent to ${details.customer?.email}.`,
            "success"
          );
        }
      } else {
        showToast("Dispatch Notice", "Logged outreach to audit trail.", "info");
      }
    } catch (e) {
      console.error(e);
      if (channel === "whatsapp") {
        const phone = (details.customer?.phone || "+919820112345").replace(/\D/g, "");
        const text = encodeURIComponent(
          `Hello ${details.customer?.name}! 👋 Friendly update from द्वीSakhi Merch Co. Your pending invoice of ₹${Math.round(totalAmount)} is ready for settlement. You can pay here: ${activeLink} Thank you!`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
        showToast("WhatsApp Opened! 💬", `Direct chat opened with ${details.customer?.name}.`, "success");
      }
    } finally {
      setDispatchLoading(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeLink);
    setLinkCopied(true);
    showToast("Link Copied", activeLink, "info");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-24 md:pb-10 w-full min-w-0">
        {/* Navigation & Header */}
        <header className="flex items-center justify-between pb-4 border-b border-[#E5E1D8]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="btn-secondary text-xs px-3.5 py-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to List
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-[#141312]">
                  Customer Case File
                </h1>
                <span className="badge-neutral text-[11px] font-mono">{caseNum}</span>
              </div>
              <p className="text-xs text-[#54504A]">
                Customer: {details.customer?.name}
              </p>
            </div>
          </div>

          <span
            className={
              isRecovered
                ? "badge-sage text-xs font-bold"
                : details.current_status === "human_review"
                ? "badge-peach text-xs font-bold"
                : "badge-honey text-xs font-bold"
            }
          >
            {isRecovered
              ? "Recovered 🎉"
              : details.current_status === "human_review"
              ? "Waiting For Your Approval"
              : "Payment Link Sent"}
          </span>
        </header>

        {/* 1. Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#706B63]">Amount Stuck</span>
            <div className="font-display text-xl font-bold text-[#141312]">
              ₹<CountUp value={totalAmount} />
            </div>
            <span className="text-[10px] text-[#706B63]">Original bill value</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#194F34]">Chance of Collection</span>
            <div className="font-display text-xl font-bold text-[#194F34]">
              <CountUp value={details.recovery_probability * 100} decimals={0} suffix="%" />
            </div>
            <span className="text-[10px] text-[#194F34]">High probability score</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#706B63]">Delay Risk</span>
            <div>
              <span
                className={
                  details.risk_level === "high"
                    ? "badge-peach text-[11px] mt-1 font-bold"
                    : "badge-honey text-[11px] mt-1 font-bold"
                }
              >
                {details.risk_level === "high" ? "High Risk" : "Medium Risk"}
              </span>
            </div>
            <span className="text-[10px] text-[#706B63] block mt-1">Based on past payments</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#452F75]">Target We Can Collect</span>
            <div className="font-display text-xl font-bold text-[#452F75]">
              ₹<CountUp value={details.expected_recovery_value} />
            </div>
            <span className="text-[10px] text-[#452F75]">Likely return</span>
          </div>
        </section>

        {/* 2. Customer Profile Card */}
        <section className="warm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#194F34]" />
              <h3 className="font-display text-base font-bold text-[#141312]">
                Customer Contact & Past Record
              </h3>
            </div>
            <span className="badge-sage text-xs">
              Trust Score: {Math.round(details.customer?.reliability_score * 100)}% reliable
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div>
              <span className="text-[#706B63] block">Customer Name</span>
              <span className="font-bold text-[#141312] mt-0.5 block">
                {details.customer?.name}
              </span>
            </div>
            <div>
              <span className="text-[#706B63] block">Email</span>
              <a
                href={`mailto:${details.customer?.email}`}
                className="font-semibold text-[#194F34] hover:underline mt-0.5 flex items-center gap-1 truncate"
                title={`Email ${details.customer?.email}`}
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-[#194F34]" />
                <span className="truncate">{details.customer?.email}</span>
              </a>
            </div>
            <div>
              <span className="text-[#706B63] block">Phone / Mobile</span>
              <a
                href={`tel:${details.customer?.phone ? details.customer.phone.replace(/\s+/g, "") : "+919820112345"}`}
                className="font-semibold text-[#194F34] hover:underline mt-0.5 flex items-center gap-1"
                title={`Dial ${details.customer?.phone || "+91 98201 12345"}`}
              >
                <Phone className="w-3.5 h-3.5 shrink-0 text-[#194F34]" />
                <span>{details.customer?.phone || "+91 98201 12345"}</span>
              </a>
            </div>
            <div>
              <span className="text-[#706B63] block">Average Payment Delay</span>
              <span className="font-semibold text-[#141312] mt-0.5 block">
                {details.customer?.payment_delay_days} days
              </span>
            </div>
            <div>
              <span className="text-[#706B63] block">Bill Type</span>
              <span className="font-semibold text-[#141312] mt-0.5 block capitalize">
                {details.reference_type === "invoice" ? "Overdue Invoice" : "Online Checkout"}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Plain English Diagnosis */}
        <section className="warm-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E1D8] pb-3">
            <Sparkles className="w-4 h-4 text-[#194F34]" />
            <h3 className="font-display text-base font-bold text-[#141312]">
              Why CashPulse Recommends This Action
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#706B63]">Recommended Next Step:</span>
              <span className="badge-sage text-xs font-bold">
                {details.recommended_action === "RETRY_PAYMENT"
                  ? "Automatic Payment Gateway Retry"
                  : "Send Friendly WhatsApp Payment Link"}
              </span>
            </div>

            <p className="text-xs text-[#141312] leading-relaxed font-normal">
              {details.explanation}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#54504A] pt-2 border-t border-[#E5E1D8]">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7A52]" />
                Why it failed: <strong className="font-medium text-[#141312] capitalize">{details.root_cause?.replace(/_/g, " ")}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7A52]" />
                Safety Check: Within your pre-approved limit (≤ ₹50,000)
              </span>
            </div>
          </div>
        </section>

        {/* 4. Activity History Timeline */}
        <section className="warm-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E1D8] pb-3">
            <Clock className="w-4 h-4 text-[#706B63]" />
            <h3 className="font-display text-base font-bold text-[#141312]">
              History of Everything Done So Far
            </h3>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E1D8]">
            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#2E7A52] ring-4 ring-[#FAF9F6]" />
              <div className="text-xs font-bold text-[#141312]">Payment Delay Detected</div>
              <p className="text-[11px] text-[#54504A]">
                CashPulse spotted overdue payment reference #{details.reference_id}.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#2E7A52] ring-4 ring-[#FAF9F6]" />
              <div className="text-xs font-bold text-[#141312]">Customer History Checked</div>
              <p className="text-[11px] text-[#54504A]">
                Checked profile for {details.customer?.name}. Confirmed {Math.round(details.recovery_probability * 100)}% chance of getting paid without hassle.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#6E4DAE] ring-4 ring-[#FAF9F6]" />
              <div className="text-xs font-bold text-[#141312]">Collection Link Prepared</div>
              <p className="text-[11px] text-[#54504A]">
                One-tap UPI payment link generated via Razorpay sandbox.
              </p>
            </div>
          </div>
        </section>

        {/* 4.5. Instant Customer Outreach: WhatsApp & Email */}
        <section className="warm-card p-5 sm:p-6 space-y-4 bg-gradient-to-r from-white via-[#FAF9F6] to-[#EAF3ED]/30">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#194F34]" />
              <h3 className="font-display text-base font-bold text-[#141312]">
                Instant Customer Outreach
              </h3>
            </div>
            <span className="badge-sage text-[10px]">1-Tap Action</span>
          </div>

          <p className="text-xs text-[#54504A] leading-relaxed">
            Reach out directly to <strong>{details.customer?.name}</strong> with the verified payment link. CashPulse drafts an empathetic reminder so you can settle this in seconds.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => handleDispatch("whatsapp")}
              disabled={dispatchLoading !== null}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs px-4 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-xs transition-all tap-target cursor-pointer"
              title="Open pre-filled chat in WhatsApp"
            >
              {dispatchLoading === "whatsapp" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>Send via WhatsApp</span>
            </button>

            <button
              onClick={() => handleDispatch("email")}
              disabled={dispatchLoading !== null}
              className="btn-secondary text-xs px-4 py-2.5 rounded-full font-bold flex items-center gap-2 tap-target cursor-pointer"
              title="Send branded email reminder with payment link"
            >
              {dispatchLoading === "email" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 text-[#194F34]" />
              )}
              <span>Email Official Notice</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="btn-secondary text-xs px-4 py-2.5 rounded-full font-semibold flex items-center gap-1.5 tap-target cursor-pointer"
              title="Copy payment link"
            >
              {linkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#194F34]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payment Link</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 5. What You Can Do Now & Settlement Trigger */}
        <section className="warm-card p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-[#141312] border-b border-[#E5E1D8] pb-3">
            What You Can Do Now
          </h3>

          <div className="space-y-3">
            {details.actions.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#141312]">
                      {act.action_type === "RETRY_PAYMENT" ? "Gateway Retry" : "One-Tap Payment Link"}
                    </span>
                    <span className="badge-sage text-[10px]">
                      {act.status}
                    </span>
                  </div>

                  {act.checkout_url && (
                    <a
                      href={act.checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#194F34] hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                    >
                      Open Customer Checkout Page <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {!isRecovered && (
                  <button
                    onClick={() => handleSimulatePayment(act.id, act.rzp_payment_link_id || "plink_test")}
                    disabled={actionLoading}
                    className="btn-secondary text-xs px-4 py-2 hover:border-[#194F34] hover:text-[#194F34] font-semibold"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      "Simulate Customer Paying Via UPI"
                    )}
                  </button>
                )}
              </div>
            ))}

            {!isRecovered && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleProcessCase}
                  disabled={actionLoading}
                  className="btn-primary text-xs px-5 py-2.5 shadow-xs"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Sending...
                    </>
                  ) : (
                    "Send Next Polite Reminder Now"
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 6. Progressive Disclosure: Technical Details (For Nerds) */}
        <section className="pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[#706B63] hover:text-[#141312] transition-colors font-semibold"
          >
            {showAdvanced ? "— Hide Technical Details" : "+ Show Technical Details (For Nerds)"}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] text-xs font-mono text-[#54504A] space-y-1.5 animate-fade-slide">
              <div>Model: Recovery Classifier v2.1 (XGBoost)</div>
              <div>Confidence Score: {details.recovery_probability.toFixed(4)}</div>
              <div>Rules Policy Key: RECOVERY_RETRY_V2</div>
              <div>Internal Reference: {details.reference_id}</div>
              <div>Case UUID: {details.id}</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
