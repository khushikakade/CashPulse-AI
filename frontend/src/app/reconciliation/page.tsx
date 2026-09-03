"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import CountUp from "../components/CountUp";
import { showToast, triggerCelebration } from "../components/Toast";
import {
  GitCompare, ArrowRight, CheckCircle2, AlertCircle, Clock,
  ShieldCheck, Upload, FileText, Download, Check, Sparkles, RefreshCw
} from "lucide-react";

interface ReconItem {
  id: string;
  type: string;
  reference: string;
  amount: number;
  date: string;
  status: string;
  explanation: string;
}

interface StatementItem {
  row_id: number;
  date: string;
  narration: string;
  utr_number: string;
  type: string;
  amount: number;
  status: string;
  mdr_fee: number;
  matched_entity: string | null;
  explanation: string;
}

interface StatementResult {
  total_rows: number;
  total_deposits_inr: number;
  total_fees_detected_inr: number;
  matched_count: number;
  unmatched_count: number;
  accuracy_rate: number;
  items: StatementItem[];
}

export default function Reconciliation() {
  const [items, setItems] = useState<ReconItem[]>([]);
  const [stats, setStats] = useState({
    total: 50,
    matched: 42,
    unresolved: 8,
    rate: 98.4
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReconItem | null>(null);

  // Bank Statement Reconciler State
  const [statementUploading, setStatementUploading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [statementResult, setStatementResult] = useState<StatementResult | null>(null);

  useEffect(() => {
    const fetchRecon = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/reconciliation/report");
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setItems(data.items);
            setStats({
              total: data.total_checked || 50,
              matched: data.matched_count || 42,
              unresolved: data.unresolved_count || 8,
              rate: data.reconciliation_rate || 98.4
            });
            setSelectedItem(data.items[0]);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load reconciliation", e);
      }

      // Sensible DwiSakhi fallback payments
      const fallbackItems = [
        { id: "r1", type: "order", reference: "Mood Indigo IIT Bombay (150x Caps & Stickers)", amount: 54000, date: new Date().toISOString(), status: "UNRESOLVED", explanation: "Invoice pending council sign-off past 8 days" },
        { id: "r2", type: "order", reference: "Malhar Fest St. Xavier's (100x Volunteer Caps)", amount: 32000, date: new Date().toISOString(), status: "MATCHED", explanation: "Settled cleanly into bank account via UPI link" },
        { id: "r3", type: "order", reference: "Ananya Sharma (Corduroy Tote - Forest Green)", amount: 499, date: new Date().toISOString(), status: "MATCHED", explanation: "Settled cleanly via Razorpay UPI checkout" },
        { id: "r4", type: "order", reference: "Tanvi Kulkarni (Vintage Washed Bucket Hat)", amount: 520, date: new Date().toISOString(), status: "UNRESOLVED", explanation: "UPI timed out at bank gateway during evening drop" },
        { id: "r5", type: "order", reference: "Rotaract Club Youth Conclave (60x Pouches)", amount: 18000, date: new Date().toISOString(), status: "MATCHED", explanation: "Advance payment settled into bank account" }
      ];
      setItems(fallbackItems);
      setSelectedItem(fallbackItems[0]);
      setLoading(false);
    };
    fetchRecon();
  }, []);

  const handleFileUpload = async (file: File) => {
    setStatementUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/v1/reconciliation/upload-statement", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data: StatementResult = await res.json();
        setStatementResult(data);
        triggerCelebration("Bank Statement Reconciled!", data.total_deposits_inr);
        showToast(
          "Bank Statement Reconciled! 🎉",
          `Parsed ${data.total_rows} rows. ${data.matched_count} settlements cleanly matched with ₹${data.total_fees_detected_inr} MDR fees accounted for.`,
          "success"
        );
      } else {
        showToast("Reconciliation Error", "Failed to parse bank statement file.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Connection Error", "Could not reach reconciliation endpoint", "error");
    } finally {
      setStatementUploading(false);
    }
  };

  const handleLoadSampleStatement = async () => {
    setSampleLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/reconciliation/sample-statement");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([data.csv], { type: "text/csv" });
        const file = new File([blob], data.filename, { type: "text/csv" });
        await handleFileUpload(file);
      }
    } catch (e) {
      console.error(e);
      showToast("Error Loading Sample", "Could not fetch sample HDFC statement", "error");
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-5xl mx-auto space-y-8 sm:space-y-10 pb-24 md:pb-10 w-full min-w-0">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-sage text-xs mb-1.5">
            <GitCompare className="w-3.5 h-3.5" /> Match My Payments
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            Where Did Your Money Go?
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            Traces every rupee from customer order to Razorpay and confirms it reached your bank account.
          </p>
        </header>

        {/* 4 Metric Capsules */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#706B63]">Payments Checked</span>
            <div className="font-display text-xl font-bold text-[#141312]">
              <CountUp value={stats.total} /> transactions
            </div>
            <span className="text-[10px] text-[#706B63]">From your gateway</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#194F34]">Cleanly Deposited</span>
            <div className="font-display text-xl font-bold text-[#194F34]">
              <CountUp value={stats.matched} /> reached bank
            </div>
            <span className="text-[10px] text-[#194F34]">Zero money lost</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#8E3015]">Needs Investigation</span>
            <div className="font-display text-xl font-bold text-[#8E3015]">
              <CountUp value={stats.unresolved} /> stuck
            </div>
            <span className="text-[10px] text-[#8E3015]">CashPulse can recover</span>
          </div>

          <div className="warm-card p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#452F75]">Match Accuracy</span>
            <div className="font-display text-xl font-bold text-[#452F75]">
              <CountUp value={stats.rate} decimals={1} suffix="%" />
            </div>
            <span className="text-[10px] text-[#452F75]">Verified match</span>
          </div>
        </section>

        {/* Bank Statement CSV Reconciler Card */}
        <section className="warm-card p-5 sm:p-8 space-y-5 bg-gradient-to-r from-white via-[#FAF9F6] to-[#EAF3ED]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1D8] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#194F34]" />
                <h2 className="font-display text-base font-bold text-[#141312]">
                  Bank Statement Reconciler (HDFC / ICICI / SBI)
                </h2>
              </div>
              <p className="text-xs text-[#54504A] mt-0.5">
                Drop your bank statement CSV to automatically match UTRs and detect hidden gateway MDR fee deductions
              </p>
            </div>

            <button
              onClick={handleLoadSampleStatement}
              disabled={sampleLoading || statementUploading}
              className="btn-secondary text-xs px-3.5 py-2 min-h-[44px] flex items-center gap-2 bg-white cursor-pointer"
              title="Load authentic DwiSakhi HDFC Bank test statement"
            >
              {sampleLoading || statementUploading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#194F34]" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#194F34]" />
              )}
              <span>Load Sample HDFC Statement</span>
            </button>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-[#E5E1D8] hover:border-[#194F34] rounded-2xl p-6 text-center transition-all bg-white/60">
            <input
              type="file"
              accept=".csv"
              id="bank-csv-upload"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <label htmlFor="bank-csv-upload" className="cursor-pointer block space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#EAF3ED] text-[#194F34] flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#141312]">
                {statementUploading ? "Analyzing & Matching Bank Transactions..." : "Click or drag your bank CSV statement here"}
              </div>
              <p className="text-[11px] text-[#706B63]">
                Supports HDFC, ICICI, SBI, Axis, or standard Indian bank CSVs with UTR narrations
              </p>
            </label>
          </div>

          {/* Reconciled Statement Summary & Breakdown */}
          {statementResult && (
            <div className="space-y-4 pt-2 animate-fade-slide">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#E5E1D8] space-y-0.5">
                  <span className="text-[10px] text-[#706B63] block">Deposits Verified</span>
                  <div className="font-display text-lg font-bold text-[#194F34]">
                    ₹{statementResult.total_deposits_inr.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5E1D8] space-y-0.5">
                  <span className="text-[10px] text-[#706B63] block">MDR Fees Accounted</span>
                  <div className="font-display text-lg font-bold text-[#452F75]">
                    ₹{statementResult.total_fees_detected_inr.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5E1D8] space-y-0.5">
                  <span className="text-[10px] text-[#706B63] block">Clean Matches</span>
                  <div className="font-display text-lg font-bold text-[#141312]">
                    {statementResult.matched_count} entries
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5E1D8] space-y-0.5">
                  <span className="text-[10px] text-[#706B63] block">Recon Accuracy</span>
                  <div className="font-display text-lg font-bold text-[#194F34]">
                    {statementResult.accuracy_rate}%
                  </div>
                </div>
              </div>

              {/* Parsed Transactions Scroll Table */}
              <div className="table-scroll-container rounded-xl border border-[#E5E1D8] bg-white">
                <table className="w-full text-left text-xs text-[#54504A] min-w-[640px]">
                  <thead className="bg-[#F4F1EA] text-[10px] font-bold text-[#706B63] border-b border-[#E5E1D8]">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Bank Narration / UTR</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Status & Audit Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]">
                    {statementResult.items.map((it) => (
                      <tr key={it.row_id} className="hover:bg-[#FAF9F6]">
                        <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">{it.date}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-[#141312] block max-w-xs truncate">{it.narration}</span>
                          <span className="font-mono text-[10px] text-[#706B63]">UTR: {it.utr_number}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            it.type === "DEPOSIT" ? "bg-[#EAF3ED] text-[#194F34]" : "bg-[#FAF9F6] text-[#706B63]"
                          }`}>
                            {it.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-display font-bold text-[#141312]">
                          ₹{it.amount.toLocaleString("en-IN")}
                          {it.mdr_fee > 0 && (
                            <span className="block text-[9px] font-normal text-[#8E3015]">
                              (-₹{it.mdr_fee} MDR fee)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[11px]">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            it.status.startsWith("MATCHED") ? "text-[#194F34]" : "text-[#706B63]"
                          }`}>
                            {it.status.startsWith("MATCHED") ? <CheckCircle2 className="w-3 h-3 text-[#194F34]" /> : null}
                            {it.explanation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Money Leak Detective Stepper */}
        <section className="warm-card p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#141312]">
                Money Leak Detective
              </h2>
              <p className="text-xs text-[#54504A]">
                Click any payment in the table below to see its 4-step journey into your bank account
              </p>
            </div>
            {selectedItem && (
              <span className="badge-neutral text-xs font-semibold">
                Customer: {selectedItem.reference}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#706B63]">Step 1: Order Placed</span>
              <div className="text-xs font-bold text-[#141312] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#194F34]" /> Order Created
              </div>
              <p className="text-[11px] text-[#54504A]">Customer checked out cart or accepted quotation</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#706B63]">Step 2: Gateway Receipt</span>
              <div className="text-xs font-bold text-[#141312] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#194F34]" /> Razorpay Confirmed
              </div>
              <p className="text-[11px] text-[#54504A]">Customer UPI account debited cleanly</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#706B63]">Step 3: Gateway Payout</span>
              <div className={`text-xs font-bold flex items-center gap-1 ${
                selectedItem?.status === "MATCHED" ? "text-[#194F34]" : "text-[#8E3015]"
              }`}>
                {selectedItem?.status === "MATCHED" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {selectedItem?.status === "MATCHED" ? "Batch Settled" : "Settlement Pending"}
              </div>
              <p className="text-[11px] text-[#54504A]">Razorpay standard T+1 banking settlement cycle</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E1D8] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#706B63]">Step 4: Reached Your Bank</span>
              <div className={`text-xs font-bold flex items-center gap-1 ${
                selectedItem?.status === "MATCHED" ? "text-[#194F34]" : "text-[#8E3015]"
              }`}>
                {selectedItem?.status === "MATCHED" ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {selectedItem?.status === "MATCHED" ? "Safe in HDFC Bank" : "Action Required"}
              </div>
              <p className="text-[11px] text-[#54504A]">{selectedItem?.explanation}</p>
            </div>
          </div>
        </section>

        {/* 4. Payment Trail Table */}
        <section className="warm-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#141312]">
                Detailed Payment Audit Trail
              </h2>
              <p className="text-xs text-[#54504A]">
                Every individual transaction matched against bank UTR numbers
              </p>
            </div>
          </div>

          <div className="table-scroll-container">
            <table className="w-full text-left text-xs text-[#54504A] min-w-[640px]">
              <thead className="bg-[#F4F1EA] text-[11px] font-bold text-[#706B63] border-b border-[#E5E1D8]">
                <tr>
                  <th className="px-6 py-3.5">Customer / Order Reference</th>
                  <th className="px-6 py-3.5">Payment Amount</th>
                  <th className="px-6 py-3.5">What Happened?</th>
                  <th className="px-6 py-3.5">Deposit Status</th>
                  <th className="px-6 py-3.5">Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {items.map((it) => {
                  const isSelected = selectedItem?.id === it.id;
                  const isMatched = it.status === "MATCHED";

                  return (
                    <tr
                      key={it.id}
                      onClick={() => setSelectedItem(it)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#EAF3ED]/50" : "hover:bg-[#FAF9F6]"
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-[#141312]">
                        {it.reference}
                      </td>
                      <td className="px-6 py-4 font-display font-bold text-[#141312]">
                        ₹{it.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#54504A]">
                        {it.explanation}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isMatched ? "badge-sage text-[11px]" : "badge-peach text-[11px]"}>
                          {isMatched ? "Clean Deposit" : "Stuck Money"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#194F34]">
                        {isMatched ? "No Action Needed" : "CashPulse Recovering"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
