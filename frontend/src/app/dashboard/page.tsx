"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import CountUp from "../components/CountUp";
import EmptyState from "../components/EmptyState";
import { showToast, triggerCelebration } from "../components/Toast";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Zap,
  Receipt,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Metrics {
  financial_health_score: number;
  cash_available: number;
  expected_30day_cash: number;
  revenue_at_risk: number;
  recoverable_value: number;
  recovered_this_month: number;
  outstanding_receivables: number;
  failed_payments_value: number;
  cash_runway_days: number;
  projected_shortfall_value: number;
}

interface ActionItem {
  case_id: string;
  action_id: string;
  title: string;
  description: string;
  impact_value: number;
  confidence: number;
  risk_level: string;
  needs_approval: boolean;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [brief, setBrief] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      const activeRes = await fetch("http://localhost:8000/api/v1/business/active");
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        if (!activeData.active) {
          router.push("/onboarding");
          return;
        } else if (activeData.id) {
          document.cookie = `business_id=${activeData.id}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }

      const res = await fetch("http://localhost:8000/api/v1/dashboard/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setActions(data.top_actions || []);
      }

      const briefRes = await fetch("http://localhost:8000/api/v1/dashboard/brief");
      if (briefRes.ok) {
        const briefData = await briefRes.json();
        setBrief(briefData.brief);
      }
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const sse = new EventSource("http://localhost:8000/api/v1/events/stream");

    const handleRecovered = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        triggerCelebration(`₹${data.amount.toLocaleString()} Recovered!`, data.amount);
        showToast(
          "Payment Recovered! 🎉",
          `₹${data.amount.toLocaleString()} has been collected and credited back to your bank account.`,
          "celebration"
        );
        fetchDashboardData();
      } catch (err) {
        console.error(err);
      }
    };

    const handleFailed = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        showToast(
          "Payment Issue Spotted",
          `₹${data.amount.toLocaleString()} failed due to: ${data.error}. CashPulse is diagnosing next steps.`,
          "error"
        );
        fetchDashboardData();
      } catch (err) {
        console.error(err);
      }
    };

    sse.addEventListener("payment.recovered", handleRecovered as any);
    sse.addEventListener("payment.failed", handleFailed as any);

    return () => {
      sse.close();
    };
  }, []);

  const handleExecuteAction = async (caseId: string, actionId: string, title: string) => {
    setActionLoading(caseId);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recovery/cases/${caseId}/process`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Action execution failed");
      const data = await res.json();
      showToast(
        "Action Started",
        `Friendly reminder link dispatched to the customer.`,
        "success"
      );
      await fetchDashboardData();
    } catch (e) {
      console.error(e);
      showToast("Could Not Process", "Unable to trigger this recovery action.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF9F6]">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-pulse w-full min-w-0 pb-24 md:pb-10">
          <div className="h-8 w-48 bg-[#E5E1D8] rounded-xl" />
          <div className="h-44 bg-[#FFFFFF] border border-[#E5E1D8] rounded-3xl p-6 space-y-4">
            <div className="h-6 w-3/4 bg-[#E5E1D8] rounded-lg" />
            <div className="h-4 w-1/2 bg-[#F4F1EA] rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="h-16 bg-[#F4F1EA] rounded-2xl" />
              <div className="h-16 bg-[#F4F1EA] rounded-2xl" />
              <div className="h-16 bg-[#F4F1EA] rounded-2xl" />
              <div className="h-16 bg-[#F4F1EA] rounded-2xl" />
            </div>
          </div>
          <div className="h-48 bg-[#FFFFFF] border border-[#E5E1D8] rounded-3xl" />
        </main>
      </div>
    );
  }

  // Safe fallbacks calibrated to DwiSakhi scale
  const cashAvail = metrics?.cash_available ?? 316188;
  const expectedComing = metrics ? metrics.outstanding_receivables * 0.85 : 172193;
  const atRisk = metrics?.revenue_at_risk ?? 127122;
  const recovered = metrics?.recovered_this_month ?? 32000;
  const runwayDays = metrics?.cash_runway_days ?? 70;
  const healthScore = metrics?.financial_health_score ?? 88;

  return (
    <div className="flex flex-col md:flex-row bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-5xl mx-auto space-y-8 sm:space-y-10 pb-24 md:pb-10 w-full min-w-0">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#194F34] mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Good morning Neha & Khushi
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight">
              Today's Cash
            </h1>
            <p className="text-xs text-[#54504A] mt-1 font-normal">
              Here is what needs your attention today to keep tote bags, bucket hats, and college fest orders moving.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/scenarios"
              className="btn-secondary text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-[#B87E14]" />
              What If Money Gets Tight?
            </Link>

            <Link
              href="/recovery"
              className="btn-primary text-xs"
            >
              Get Stuck Money Back &rarr;
            </Link>
          </div>
        </header>

        {/* 1. Human Storytelling Hero Banner */}
        <section className="warm-card warm-card-hover p-7 bg-gradient-to-b from-white to-[#FAF9F6] space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
            <span className="text-xs font-bold text-[#706B63] flex items-center gap-2 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-[#2E7A52]" /> Your Money Summary
            </span>
            <span className="badge-sage text-xs">
              {runwayDays} Days Safety Cushion
            </span>
          </div>

          {/* Conversational Narrative Sentence */}
          <div className="font-display text-xl sm:text-2xl font-normal text-[#141312] leading-relaxed">
            You’ve got{" "}
            <strong className="font-bold text-[#194F34]">
              ₹<CountUp value={cashAvail} />
            </strong>{" "}
            in the bank right now — enough to cover your studio rent, fabric suppliers, and courier shipping for the next{" "}
            <strong className="font-bold text-[#141312]">
              <CountUp value={runwayDays} /> days
            </strong>{" "}
            comfortably. There's approximately{" "}
            <strong className="font-bold text-[#B87E14]">
              ₹<CountUp value={expectedComing} />
            </strong>{" "}
            pending from college fest orders and online checkouts, and CashPulse has already recovered{" "}
            <strong className="font-bold text-[#194F34]">
              ₹<CountUp value={recovered} />
            </strong>{" "}
            in stuck payments this month.
          </div>

          {/* AI Note in Plain English */}
          {brief && (
            <p className="text-xs text-[#383531] leading-relaxed bg-[#FAF9F6] border border-[#E5E1D8] rounded-2xl p-4 font-normal">
              💡 <strong className="font-semibold text-[#141312]">Assistant Advice:</strong> {brief}
            </p>
          )}

          {/* 4 Supporting Pastel Metric Capsules */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs">
              <span className="text-[11px] font-semibold text-[#706B63] block">
                Cash in Bank
              </span>
              <span className="font-display text-xl font-bold text-[#141312] mt-1 block">
                ₹<CountUp value={cashAvail} />
              </span>
              <span className="text-[10px] text-[#706B63] mt-1 block">
                Ready to spend
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FEF8E8] border border-[#FADF96] shadow-xs">
              <span className="text-[11px] font-semibold text-[#784C07] block">
                Expected Soon
              </span>
              <span className="font-display text-xl font-bold text-[#784C07] mt-1 block">
                ₹<CountUp value={expectedComing} />
              </span>
              <span className="text-[10px] text-[#784C07]/80 mt-1 block">
                Incoming customer bills
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FDF0EB] border border-[#F5C7B5] shadow-xs">
              <span className="text-[11px] font-semibold text-[#8E3015] block">
                Money in Danger
              </span>
              <span className="font-display text-xl font-bold text-[#8E3015] mt-1 block">
                ₹<CountUp value={atRisk} />
              </span>
              <span className="text-[10px] text-[#8E3015]/80 mt-1 block">
                Delayed or failed checkouts
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#EAF3ED] border border-[#BBDCC7] shadow-xs">
              <span className="text-[11px] font-semibold text-[#194F34] block">
                Rescued This Month
              </span>
              <span className="font-display text-xl font-bold text-[#194F34] mt-1 block">
                ₹<CountUp value={recovered} />
              </span>
              <span className="text-[10px] text-[#194F34]/80 mt-1 block">
                Settled back into bank
              </span>
            </div>
          </div>
        </section>

        {/* 2. Business Cash Health Checkup */}
        <section className="warm-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
            <div>
              <h2 className="font-display text-base font-bold text-[#141312]">
                How Healthy Is Your Cash Flow?
              </h2>
              <p className="text-xs text-[#54504A]">
                Quick health check comparing your current liquidity to safe operating levels
              </p>
            </div>
            <span className="badge-sage text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Looking Steady ({healthScore}/100)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[#706B63] block">Cash Buffer</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#141312]">Comfortable</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E7A52]" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[#706B63] block">Client Bill Settlements</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#B87E14]">Under Watch</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#B87E14]" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[#706B63] block">Failed Online Checkouts</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#194F34]">Auto-Recovering</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E7A52]" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[#706B63] block">Overdue Money Owed</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#8E3015]">Needs Follow-up</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#C74E28]" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Action Hub: Things You Should Look At Today */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#141312]">
                Things You Should Look At Today
              </h2>
              <p className="text-xs text-[#54504A]">
                Customer payments with the highest chance of fast collection
              </p>
            </div>
            <Link
              href="/recovery"
              className="text-xs font-semibold text-[#194F34] hover:underline flex items-center gap-1"
            >
              See all stuck money <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {actions.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                badge="All Clear"
                title="No urgent customer money to collect today"
                description="All client invoices and online checkout drops are actively tracked. CashPulse will alert you if any customer bill delays."
                actionLabel="Explore Scenarios"
                actionHref="/scenarios"
                secondaryLabel="View Receivables"
                secondaryHref="/receivables"
                variant="sage"
              />
            ) : (
              actions.map((act, idx) => (
                <div
                  key={act.case_id}
                  className="warm-card warm-card-hover p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E5E1D8] flex items-center justify-center font-display font-bold text-xs text-[#706B63] shrink-0">
                      {idx + 1}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-display text-lg font-bold text-[#141312]">
                          ₹<CountUp value={act.impact_value} />
                        </span>
                        <span className="badge-sage text-[11px]">
                          {Math.round(act.confidence * 100)}% chance of getting paid
                        </span>
                        {act.needs_approval && (
                          <span className="badge-honey text-[11px]">
                            Needs your OK first
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-[#141312]">
                        {act.title}
                      </h4>
                      <p className="text-xs text-[#54504A] leading-relaxed max-w-xl">
                        {act.description || "Identified as a recoverable customer bill with low friction."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E1D8] justify-end">
                    <Link
                      href={`/recovery/${act.case_id}`}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      Why this action?
                    </Link>

                    <button
                      onClick={() => handleExecuteAction(act.case_id, act.action_id, act.title)}
                      disabled={actionLoading === act.case_id}
                      className="btn-primary text-xs px-4 py-2"
                    >
                      {actionLoading === act.case_id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                          Processing...
                        </>
                      ) : act.needs_approval ? (
                        "Ask Me First (Approval)"
                      ) : (
                        "Collect This Now"
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
