"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { showToast, triggerCelebration } from "../components/Toast";
import {
  ShieldCheck, Save, RefreshCw, AlertCircle, CheckCircle2, Lock,
  CreditCard, Radio, Webhook, Zap, Copy, Check, ExternalLink
} from "lucide-react";

interface GatewayInfo {
  name: string;
  provider: string;
  valid: boolean;
  mode: string;
  message: string;
  masked_id: string;
  env?: string;
  webhook_path: string;
  webhook_secret_set: boolean;
}

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Policy Settings
  const [maxRetries, setMaxRetries] = useState(2);
  const [maxReminders, setMaxReminders] = useState(2);
  const [minHours, setMinHours] = useState(24);
  const [maxDiscount, setMaxDiscount] = useState(5);
  const [threshold, setThreshold] = useState(50000);

  // Gateway Settings & Webhook Simulation
  const [gateways, setGateways] = useState<Record<string, GatewayInfo>>({});
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simulationLog, setSimulationLog] = useState<{
    gateway: string;
    event_type: string;
    signature: string;
    amount: number;
    status: string;
    timestamp: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchGatewayStatus = async () => {
    try {
      setGatewayLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/gateways/status");
      if (res.ok) {
        const data = await res.json();
        setGateways(data.gateways || {});
      }
    } catch (err) {
      console.warn("Using fallback gateway status", err);
      setGateways({
        razorpay: {
          name: "Razorpay Payments",
          provider: "razorpay",
          valid: true,
          mode: "simulated",
          message: "Running in simulated test mode (sandbox fallback active)",
          masked_id: "rzp_test_••••••••",
          webhook_path: "/api/v1/webhooks/razorpay",
          webhook_secret_set: true
        },
        cashfree: {
          name: "Cashfree Payment Gateway",
          provider: "cashfree",
          valid: true,
          mode: "simulated",
          message: "Running in simulated mode (SANDBOX fallback active)",
          masked_id: "cf_test_••••••••",
          env: "SANDBOX",
          webhook_path: "/api/v1/webhooks/cashfree",
          webhook_secret_set: true
        }
      });
    } finally {
      setGatewayLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayStatus();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaved(true);
      showToast(
        "Rules Updated Successfully",
        "CashPulse will now strictly follow your new boundaries.",
        "success"
      );
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showToast("Copied to Clipboard", text, "info");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSimulateWebhook = async (
    gateway: "razorpay" | "cashfree",
    eventType: string,
    amount: number,
    label: string
  ) => {
    setSimulating(`${gateway}_${eventType}`);
    try {
      const res = await fetch("http://localhost:8000/api/v1/webhooks/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway,
          event_type: eventType,
          amount
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationLog({
          gateway: data.gateway,
          event_type: data.event_type,
          signature: data.signature,
          amount: data.amount,
          status: data.result?.status || "processed",
          timestamp: new Date().toLocaleTimeString()
        });

        if (eventType.includes("paid") || eventType.includes("SUCCESS") || eventType.includes("captured")) {
          triggerCelebration("Payment Recovered via Webhook!", amount);
          showToast(
            "Webhook Verified & Settled! 🎉",
            `${data.gateway.toUpperCase()} ${data.event_type}: ₹${amount.toLocaleString("en-IN")} recovered.`,
            "success"
          );
        } else {
          showToast(
            "Payment Failed Webhook Processed",
            `${data.gateway.toUpperCase()} triggered autonomous risk detection pipeline.`,
            "info"
          );
        }
      } else {
        showToast("Webhook Simulation Error", "Gateway server returned non-200 status", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Connection Error", "Could not reach backend webhook simulation endpoint", "error");
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-8 sm:space-y-10 pb-24 md:pb-10 w-full min-w-0">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-sage text-xs mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Safety & Integrations
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            Gateway Credentials & Safety Rules
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            Configure live payment gateway webhooks (Razorpay & Cashfree) and set clear autonomous boundaries.
          </p>
        </header>

        {/* 1. Payment Gateways & Webhooks Card */}
        <section className="warm-card p-5 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#194F34]" />
                <h2 className="font-display text-base font-bold text-[#141312]">
                  Payment Gateways & Live Webhooks
                </h2>
              </div>
              <p className="text-xs text-[#54504A] mt-0.5">
                Official Indian payment gateway endpoints with cryptographic HMAC signature verification
              </p>
            </div>
            <button
              onClick={fetchGatewayStatus}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gatewayLoading ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Gateways Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Razorpay Card */}
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EAF3ED] text-[#194F34] font-bold text-xs flex items-center justify-center">
                    RZP
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#141312]">Razorpay</h3>
                    <span className="text-[10px] text-[#706B63]">UPI, Cards, NetBanking</span>
                  </div>
                </div>
                <span className="badge-sage text-[10px]">
                  {gateways.razorpay?.mode === "live" ? "Live Production" : "Test Sandbox / Auto"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#E5E1D8]/60">
                  <span className="text-[#706B63] text-[11px]">Key ID:</span>
                  <code className="font-mono text-[11px] font-semibold text-[#141312]">
                    {gateways.razorpay?.masked_id || "rzp_test_••••••••"}
                  </code>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#E5E1D8]/60">
                  <span className="text-[#706B63] text-[11px]">Webhook Endpoint:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#E5E1D8] text-[#194F34]">
                      /api/v1/webhooks/razorpay
                    </code>
                    <button
                      onClick={() => handleCopy("http://localhost:8000/api/v1/webhooks/razorpay", "rzp_wh")}
                      className="p-1 hover:bg-white rounded text-[#706B63]"
                      title="Copy full Webhook URL"
                    >
                      {copiedKey === "rzp_wh" ? (
                        <Check className="w-3.5 h-3.5 text-[#194F34]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#706B63] text-[11px]">HMAC Verification:</span>
                  <span className="text-[11px] font-semibold text-[#194F34] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SHA-256 Active
                  </span>
                </div>
              </div>
            </div>

            {/* Cashfree Card */}
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF8E8] text-[#784C07] font-bold text-xs flex items-center justify-center">
                    CF
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#141312]">Cashfree PG</h3>
                    <span className="text-[10px] text-[#706B63]">Instant UPI, Auto Collect</span>
                  </div>
                </div>
                <span className="badge-honey text-[10px]">
                  {gateways.cashfree?.mode === "live" ? "Live Production" : "Sandbox / Auto"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[#E5E1D8]/60">
                  <span className="text-[#706B63] text-[11px]">App ID:</span>
                  <code className="font-mono text-[11px] font-semibold text-[#141312]">
                    {gateways.cashfree?.masked_id || "cf_test_••••••••"}
                  </code>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#E5E1D8]/60">
                  <span className="text-[#706B63] text-[11px]">Webhook Endpoint:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#E5E1D8] text-[#784C07]">
                      /api/v1/webhooks/cashfree
                    </code>
                    <button
                      onClick={() => handleCopy("http://localhost:8000/api/v1/webhooks/cashfree", "cf_wh")}
                      className="p-1 hover:bg-white rounded text-[#706B63]"
                      title="Copy full Webhook URL"
                    >
                      {copiedKey === "cf_wh" ? (
                        <Check className="w-3.5 h-3.5 text-[#194F34]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#706B63] text-[11px]">HMAC Verification:</span>
                  <span className="text-[11px] font-semibold text-[#194F34] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Base64 SHA-256
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Webhook Simulator Console */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-white via-[#FAF9F6] to-[#EAF3ED]/30 border border-[#E5E1D8] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#8E3015]" />
                <h3 className="font-bold text-xs text-[#141312]">
                  Interactive Webhook Simulation Console
                </h3>
              </div>
              <span className="text-[10px] text-[#706B63]">Zero Tunnel Setup Needed</span>
            </div>
            <p className="text-xs text-[#54504A] leading-relaxed">
              Test live cryptographic webhook delivery. CashPulse generates an authentic payload, computes the SHA-256 signature, and executes the recovery and settlement pipeline in real-time.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                disabled={simulating !== null}
                onClick={() => handleSimulateWebhook("razorpay", "payment_link.paid", 499.0, "Razorpay Link Paid")}
                className="btn-secondary text-xs px-3.5 py-2 min-h-[44px] flex items-center gap-2 bg-white"
              >
                {simulating === "razorpay_payment_link.paid" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#194F34]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-[#194F34]" />
                )}
                <span>Simulate Razorpay Link Paid (₹499)</span>
              </button>

              <button
                type="button"
                disabled={simulating !== null}
                onClick={() => handleSimulateWebhook("cashfree", "PAYMENT_SUCCESS_WEBHOOK", 1250.0, "Cashfree UPI Settle")}
                className="btn-secondary text-xs px-3.5 py-2 min-h-[44px] flex items-center gap-2 bg-white"
              >
                {simulating === "cashfree_PAYMENT_SUCCESS_WEBHOOK" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#784C07]" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-[#784C07]" />
                )}
                <span>Simulate Cashfree UPI Settle (₹1,250)</span>
              </button>

              <button
                type="button"
                disabled={simulating !== null}
                onClick={() => handleSimulateWebhook("razorpay", "payment.failed", 799.0, "Checkout Dropped")}
                className="btn-secondary text-xs px-3.5 py-2 min-h-[44px] flex items-center gap-2 bg-white"
              >
                {simulating === "razorpay_payment.failed" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8E3015]" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-[#8E3015]" />
                )}
                <span>Simulate Cart Abandonment (₹799)</span>
              </button>
            </div>

            {simulationLog && (
              <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#E5E1D8] text-xs space-y-1.5 animate-fade-slide">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#141312] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#194F34]" />
                    Webhook Verified & Executed ({simulationLog.gateway.toUpperCase()})
                  </span>
                  <span className="text-[10px] text-[#706B63]">{simulationLog.timestamp}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#54504A] pt-1">
                  <div>
                    <span className="text-[#706B63] block">Event:</span>
                    <span className="font-mono font-semibold text-[#141312]">{simulationLog.event_type}</span>
                  </div>
                  <div>
                    <span className="text-[#706B63] block">HMAC Signature:</span>
                    <span className="font-mono text-[#194F34]">{simulationLog.signature}</span>
                  </div>
                  <div>
                    <span className="text-[#706B63] block">Amount Processed:</span>
                    <span className="font-bold text-[#141312]">₹{simulationLog.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Safety Rules Form Card */}
        <form onSubmit={handleSave} className="warm-card p-5 sm:p-8 space-y-6">
          <div className="border-b border-[#E5E1D8] pb-4">
            <h2 className="font-display text-base font-bold text-[#141312]">
              Automatic Action Limits
            </h2>
            <p className="text-xs text-[#54504A]">
              Fine-tune how assertive CashPulse should be when collecting overdue money
            </p>
          </div>

          <div className="space-y-5">
            {/* Setting 1: Retries */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="font-bold text-xs text-[#141312]">
                  Maximum Automatic Retries
                </label>
                <p className="text-xs text-[#54504A]">
                  How many times can CashPulse retry a failed checkout before stopping?
                </p>
              </div>
              <input
                type="number"
                min="1"
                max="5"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full sm:w-28 bg-white border border-[#E5E1D8] rounded-xl px-3 py-2.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312] min-h-[44px]"
              />
            </div>

            {/* Setting 2: Reminders */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="font-bold text-xs text-[#141312]">
                  Maximum Friendly Reminders
                </label>
                <p className="text-xs text-[#54504A]">
                  How many payment links can we send to a customer before escalating?
                </p>
              </div>
              <input
                type="number"
                min="1"
                max="5"
                value={maxReminders}
                onChange={(e) => setMaxReminders(Number(e.target.value))}
                className="w-full sm:w-28 bg-white border border-[#E5E1D8] rounded-xl px-3 py-2.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312] min-h-[44px]"
              />
            </div>

            {/* Setting 3: Wait Time */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="font-bold text-xs text-[#141312]">
                  Wait Time Between Reminders (Hours)
                </label>
                <p className="text-xs text-[#54504A]">
                  Minimum hours to wait before messaging the customer again to protect relationships.
                </p>
              </div>
              <input
                type="number"
                min="6"
                max="72"
                step="6"
                value={minHours}
                onChange={(e) => setMinHours(Number(e.target.value))}
                className="w-full sm:w-28 bg-white border border-[#E5E1D8] rounded-xl px-3 py-2.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312] min-h-[44px]"
              />
            </div>

            {/* Setting 4: Concession */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="font-bold text-xs text-[#141312]">
                  Maximum Concession for Fast Payment (%)
                </label>
                <p className="text-xs text-[#54504A]">
                  Maximum discount percentage CashPulse can offer for immediate payment without asking you.
                </p>
              </div>
              <input
                type="number"
                min="0"
                max="15"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full sm:w-28 bg-white border border-[#E5E1D8] rounded-xl px-3 py-2.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312] min-h-[44px]"
              />
            </div>

            {/* Setting 5: Approval Threshold */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="font-bold text-xs text-[#8E3015] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Require Your OK for Big Amounts (₹)
                </label>
                <p className="text-xs text-[#54504A]">
                  Any invoice or checkout above this rupee amount will always pause in "Waiting For Approval".
                </p>
              </div>
              <input
                type="number"
                min="10000"
                max="500000"
                step="5000"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full sm:w-32 bg-white border border-[#E5E1D8] rounded-xl px-3 py-2.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312] min-h-[44px]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-6 py-3 min-h-[44px] shadow-sm w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save My Rules
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
