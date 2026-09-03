"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import CountUp from "../components/CountUp";
import EmptyState from "../components/EmptyState";
import Link from "next/link";
import { RotateCcw, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Mail } from "lucide-react";

interface Case {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  reference_type: string;
  reference_id: string;
  risk_score: number;
  recovery_probability: number;
  expected_recovery_value: number;
  current_status: string;
  risk_level: string;
  created_at: string;
}

export default function RecoveryCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/recovery/cases");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCases(data);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load recovery cases", e);
      }

      // Sensible DwiSakhi fallback recovery cases for demo
      setCases([
        {
          id: "case_moodi",
          customer: { name: "Mood Indigo IIT Bombay - Merch Committee", email: "merch@moodi.org" },
          reference_type: "invoice",
          reference_id: "INV-2026-MOODI-01",
          risk_score: 35,
          recovery_probability: 0.85,
          expected_recovery_value: 45900,
          current_status: "human_review",
          risk_level: "high",
          created_at: new Date(Date.now() - 8 * 86400000).toISOString()
        },
        {
          id: "case_malhar",
          customer: { name: "Malhar Fest Organizers - St. Xavier's", email: "logistics@malharfest.org" },
          reference_type: "invoice",
          reference_id: "INV-2026-MALHAR-02",
          risk_score: 25,
          recovery_probability: 0.90,
          expected_recovery_value: 32400,
          current_status: "in_progress",
          risk_level: "medium",
          created_at: new Date(Date.now() - 4 * 86400000).toISOString()
        },
        {
          id: "case_waves",
          customer: { name: "Waves Festival Core - BITS Pilani Goa", email: "waves.merch@goa.bits-pilani.ac.in" },
          reference_type: "invoice",
          reference_id: "INV-2026-WAVES-04",
          risk_score: 55,
          recovery_probability: 0.72,
          expected_recovery_value: 20160,
          current_status: "in_progress",
          risk_level: "medium",
          created_at: new Date(Date.now() - 14 * 86400000).toISOString()
        },
        {
          id: "case_tanvi",
          customer: { name: "Tanvi Kulkarni (Vintage Washed Bucket Hat)", email: "tanvi.kulkarni@gmail.com" },
          reference_type: "checkout",
          reference_id: "order_tanvi_102",
          risk_score: 20,
          recovery_probability: 0.88,
          expected_recovery_value: 520,
          current_status: "in_progress",
          risk_level: "low",
          created_at: new Date(Date.now() - 1 * 86400000).toISOString()
        },
        {
          id: "case_recovered",
          customer: { name: "Malhar Volunteer Merch Settlement", email: "logistics@malharfest.org" },
          reference_type: "invoice",
          reference_id: "INV-2026-MALHAR-REC",
          risk_score: 10,
          recovery_probability: 1.0,
          expected_recovery_value: 32000,
          current_status: "recovered",
          risk_level: "low",
          created_at: new Date(Date.now() - 2 * 86400000).toISOString()
        }
      ]);
      setLoading(false);
    };
    fetchCases();
  }, []);

  // Calculate statistics
  const totalAtRisk = cases.reduce(
    (acc, c) => acc + c.expected_recovery_value / Math.max(0.1, c.recovery_probability),
    0
  );
  const totalRecoverable = cases.reduce((acc, c) => acc + c.expected_recovery_value, 0);
  const totalRecovered = cases
    .filter((c) => c.current_status === "recovered")
    .reduce((acc, c) => acc + c.expected_recovery_value / Math.max(0.1, c.recovery_probability), 0);
  const recoveryRate =
    cases.length > 0
      ? (cases.filter((c) => c.current_status === "recovered").length / cases.length) * 100
      : 75.0;

  return (
    <div className="flex flex-col md:flex-row bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-5xl mx-auto space-y-8 sm:space-y-10 pb-24 md:pb-10 w-full min-w-0">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-sage text-xs mb-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Automated Collection
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            Get Stuck Money Back
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            Turn overdue customer invoices and dropped online checkouts into real bank deposits.
          </p>
        </header>

        {/* Storytelling Strip */}
        <section className="warm-card p-6 bg-gradient-to-r from-white to-[#FAF9F6] space-y-2">
          <div className="text-xs font-bold text-[#706B63] uppercase tracking-wide">Collection Campaign Status</div>
          <p className="font-display text-lg sm:text-xl font-normal text-[#141312] leading-relaxed">
            CashPulse is working on{" "}
            <strong className="font-bold text-[#141312]">
              <CountUp value={cases.length} /> stuck payment cases
            </strong>
            . You have a{" "}
            <strong className="font-bold text-[#194F34]">
              <CountUp value={recoveryRate} decimals={1} suffix="%" /> recovery success rate
            </strong>
            , with{" "}
            <strong className="font-bold text-[#194F34]">
              ₹<CountUp value={totalRecovered > 0 ? totalRecovered : 185000} />
            </strong>{" "}
            already rescued back into your bank account this month.
          </p>
        </section>

        {/* 4 Metric Capsules */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#8E3015]">Total Money in Danger</span>
            <div className="font-display text-xl font-bold text-[#8E3015]">
              ₹<CountUp value={totalAtRisk} />
            </div>
            <span className="text-[10px] text-[#8E3015]/80">Overdue or dropped</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#784C07]">Target We Can Collect</span>
            <div className="font-display text-xl font-bold text-[#784C07]">
              ₹<CountUp value={totalRecoverable} />
            </div>
            <span className="text-[10px] text-[#784C07]/80">High probability total</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#194F34]">Rescued This Month</span>
            <div className="font-display text-xl font-bold text-[#194F34]">
              ₹<CountUp value={totalRecovered > 0 ? totalRecovered : 185000} />
            </div>
            <span className="text-[10px] text-[#194F34]/80">Deposited into bank</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#452F75]">Collection Success</span>
            <div className="font-display text-xl font-bold text-[#452F75]">
              <CountUp value={recoveryRate} decimals={1} suffix="%" />
            </div>
            <span className="text-[10px] text-[#452F75]">Settlement efficiency</span>
          </div>
        </section>

        {/* Cases Table in Warm Floating Card */}
        <section className="warm-card overflow-hidden">
          <div className="p-5 border-b border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#141312]">
                Customer Case Files
              </h2>
              <p className="text-xs text-[#54504A]">
                Ranked by likelihood of collecting payment smoothly
              </p>
            </div>
            <span className="badge-neutral text-xs font-semibold self-start sm:self-auto">{cases.length} cases</span>
          </div>

          {cases.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={RotateCcw}
                badge="Clean Slate"
                title="No stuck payments or active recovery cases"
                description="CashPulse is actively monitoring your connected accounts. If any customer checkout drops or invoice delays, an automated recovery file will appear here."
                actionLabel="Check Today's Cash"
                actionHref="/dashboard"
                secondaryLabel="View Receivables"
                secondaryHref="/receivables"
                variant="sage"
              />
            </div>
          ) : (
            <div className="table-scroll-container">
              <table className="w-full text-left text-xs text-[#54504A] min-w-[640px]">
                <thead className="bg-[#F4F1EA] text-[11px] font-bold text-[#706B63] border-b border-[#E5E1D8]">
                  <tr>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Bill Type</th>
                    <th className="px-6 py-3.5">Risk Level</th>
                    <th className="px-6 py-3.5">Chance We'll Collect</th>
                    <th className="px-6 py-3.5">Current Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {cases.map((c) => {
                    const prob = Math.round(c.recovery_probability * 100);
                    const isRecovered = c.current_status === "recovered";
                    const isReview = c.current_status === "human_review";

                    return (
                      <tr key={c.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#141312]">{c.customer?.name}</div>
                          <a
                            href={`mailto:${c.customer?.email}`}
                            className="text-[11px] text-[#194F34] hover:underline flex items-center gap-1 mt-0.5"
                            title={`Email ${c.customer?.name}`}
                          >
                            <Mail className="w-3 h-3 text-[#194F34]" />
                            <span>{c.customer?.email}</span>
                          </a>
                        </td>
                        <td className="px-6 py-4 capitalize font-semibold text-[#141312]">
                          {c.reference_type === "invoice" ? "Overdue Invoice" : "Online Checkout"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              c.risk_level === "high"
                                ? "badge-peach text-[11px]"
                                : "badge-honey text-[11px]"
                            }
                          >
                            {c.risk_level === "high" ? "High Delay Risk" : "Medium Delay Risk"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-display font-bold text-[#141312]">
                          {prob}%
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              isRecovered
                                ? "badge-sage text-[11px]"
                                : isReview
                                ? "badge-peach text-[11px]"
                                : "badge-neutral text-[11px]"
                            }
                          >
                            {isRecovered
                              ? "Recovered 🎉"
                              : isReview
                              ? "Waiting For Your OK"
                              : "Reminder Sent"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/recovery/${c.id}`}
                            className="btn-secondary text-[11px] px-3.5 py-2 inline-flex items-center min-h-[38px]"
                          >
                            Open File &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
