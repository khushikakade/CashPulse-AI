"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { showToast } from "../components/Toast";
import { ShieldCheck, Save, RefreshCw, AlertCircle, CheckCircle2, Lock } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [maxRetries, setMaxRetries] = useState(2);
  const [maxReminders, setMaxReminders] = useState(2);
  const [minHours, setMinHours] = useState(24);
  const [maxDiscount, setMaxDiscount] = useState(5);
  const [threshold, setThreshold] = useState(50000);

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

  return (
    <div className="flex bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-sage text-xs mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Safety Policies
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            What CashPulse Is Allowed To Do
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            Set clear boundaries. Decide which actions CashPulse can take automatically, and when it must stop and ask you.
          </p>
        </header>

        {/* Form Card */}
        <form onSubmit={handleSave} className="warm-card p-6 md:p-8 space-y-6">
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
                className="w-24 bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312]"
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
                className="w-24 bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312]"
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
                className="w-24 bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312]"
              />
            </div>

            {/* Setting 4: Discount */}
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
                className="w-24 bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312]"
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
                className="w-28 bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 text-xs text-[#141312] font-semibold text-center focus:outline-none focus:border-[#141312]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-6 py-2.5 shadow-sm"
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
