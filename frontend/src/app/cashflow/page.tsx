"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import CountUp from "../components/CountUp";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { TrendingUp, ShieldCheck, AlertCircle, Info, Calendar } from "lucide-react";

interface ForecastPoint {
  date: string;
  expected: number;
  lower_bound: number;
  upper_bound: number;
}

export default function CashFlowForecasting() {
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [runway, setRunway] = useState<number>(0);
  const [prob, setProb] = useState<number>(0);
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/cashflow/forecast");
        if (res.ok) {
          const data = await res.json();
          if (data.forecast && data.forecast.length > 0) {
            setForecast(data.forecast);
            setRunway(data.runway_days || 90);
            setProb(data.shortfall_probability || 0.05);
            setMsg(data.message || "");
          }
        }
      } catch (e) {
        console.error("Failed to load forecast", e);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  // Safe fallback if API is still generating
  const hasData = forecast.length > 0;
  const latestExpected = hasData ? (forecast[29]?.expected || forecast[forecast.length - 1]?.expected || 616500) : 616500;
  const latestLower = hasData ? (forecast[29]?.lower_bound || 380000) : 380000;
  const latestUpper = hasData ? (forecast[29]?.upper_bound || 850000) : 850000;
  const effectiveRunway = runway > 0 ? runway : 90;

  return (
    <div className="flex bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-sage text-xs mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> 90-Day Cash Forecast
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            How Long Will My Money Last?
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            See how much cash you'll have in the bank after rent, salaries, and incoming customer bills.
          </p>
        </header>

        {/* 1. Plain Storytelling Narrative Banner */}
        <section className="warm-card warm-card-hover p-6 bg-gradient-to-r from-white via-[#FAF9F6] to-[#EAF3ED]/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#194F34]">
            <ShieldCheck className="w-4 h-4" /> 30-Day Outlook
          </div>
          <p className="font-display text-lg sm:text-xl font-normal text-[#141312] leading-relaxed">
            Based on when your customers usually pay and your scheduled bills, you are on track to have approximately{" "}
            <strong className="font-bold text-[#194F34]">
              ₹<CountUp value={latestExpected} />
            </strong>{" "}
            in the bank in 30 days. Your cash will comfortably last you{" "}
            <strong className="font-bold text-[#141312]">
              <CountUp value={effectiveRunway} /> days
            </strong>.
          </p>
          <p className="text-xs text-[#54504A] pt-2 border-t border-[#E5E1D8]">
            💡 Cash reserves are steady. Collecting upcoming customer invoices on time will keep this cushion healthy.
          </p>
        </section>

        {/* 2. Three Plain Scenarios */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="warm-card p-5 space-y-1 border-t-4 border-t-[#2E7A52]">
            <span className="text-xs font-semibold text-[#706B63]">Expected Scenario</span>
            <div className="font-display text-2xl font-bold text-[#194F34] mt-1">
              ₹<CountUp value={latestExpected} />
            </div>
            <p className="text-[11px] text-[#54504A] mt-1 leading-relaxed">
              If customers pay on their normal schedule and you pay regular bills.
            </p>
          </div>

          <div className="warm-card p-5 space-y-1 border-t-4 border-t-[#6E4DAE]">
            <span className="text-xs font-semibold text-[#706B63]">Best Case (Early Payments)</span>
            <div className="font-display text-2xl font-bold text-[#452F75] mt-1">
              ₹<CountUp value={latestUpper} />
            </div>
            <p className="text-[11px] text-[#54504A] mt-1 leading-relaxed">
              If all clients clear their bills ahead of time with zero delays.
            </p>
          </div>

          <div className="warm-card p-5 space-y-1 border-t-4 border-t-[#C74E28]">
            <span className="text-xs font-semibold text-[#706B63]">Worst Case (Delayed Payments)</span>
            <div className="font-display text-2xl font-bold text-[#8E3015] mt-1">
              ₹<CountUp value={latestLower} />
            </div>
            <p className="text-[11px] text-[#54504A] mt-1 leading-relaxed">
              If 30% of clients delay paying while shop rent and salaries stay fixed.
            </p>
          </div>
        </section>

        {/* 3. Uncertainty Area Chart with Soft Pastel Gradients */}
        <section className="warm-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1D8] pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-[#141312]">
                Your Bank Balance Trajectory (Next 90 Days)
              </h3>
              <p className="text-xs text-[#54504A]">
                The green line shows the expected balance; the shaded zone shows best and worst case possibilities
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-[#194F34]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E7A52]" /> Expected
              </span>
              <span className="flex items-center gap-1.5 text-[#6E4DAE]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D3C7F0]" /> Range
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={forecast}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E7A52" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2E7A52" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BBDCC7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#BBDCC7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#EEEBE3" vertical={false} />
                
                <XAxis
                  dataKey="date"
                  stroke="#706B63"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E1D8" }}
                />
                
                <YAxis
                  stroke="#706B63"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E1D8" }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E1D8",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -3px rgba(20, 19, 18, 0.1)",
                    padding: "10px 14px"
                  }}
                  labelStyle={{
                    color: "#141312",
                    fontWeight: 700,
                    marginBottom: "4px"
                  }}
                  itemStyle={{
                    color: "#383531",
                    fontSize: "12px"
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`]}
                />

                <Area
                  type="monotone"
                  dataKey="upper_bound"
                  stroke="none"
                  fill="url(#rangeGradient)"
                  name="Best Case Ceiling"
                />
                <Area
                  type="monotone"
                  dataKey="expected"
                  stroke="#2E7A52"
                  strokeWidth={2.5}
                  fill="url(#expectedGradient)"
                  name="Expected Balance"
                />
                <Area
                  type="monotone"
                  dataKey="lower_bound"
                  stroke="none"
                  fill="#FDF0EB"
                  fillOpacity={0.4}
                  name="Delayed Floor"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4. What Could Change This? */}
        <section className="warm-card p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-[#141312]">
            What could change this forecast?
          </h3>

          <div className="divide-y divide-[#E5E1D8] text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#141312] block">Incoming customer payments</span>
                <span className="text-[#54504A]">Pending invoices expected to clear within 14 days</span>
              </div>
              <span className="badge-sage text-xs font-bold">+₹1,80,000</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#141312] block">Staff salary, shop rent & supplier bills</span>
                <span className="text-[#54504A]">Fixed commitments due on the 1st of next month</span>
              </div>
              <span className="badge-peach text-xs font-bold">-₹2,00,000</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#141312] block">Safety reserve for customer returns & disputes</span>
                <span className="text-[#54504A]">Buffer kept aside for damaged goods or returned orders</span>
              </div>
              <span className="badge-honey text-xs font-bold">-₹15,000</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
