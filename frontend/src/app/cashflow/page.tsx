"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Loader2 } from "lucide-react";

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
        const data = await res.json();
        setForecast(data.forecast);
        setRunway(data.runway_days);
        setProb(data.shortfall_probability);
        setMsg(data.message);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#08090a] items-center justify-center text-slate-400 font-mono text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e] mr-2" />
        SENSING CREDIT CHANNELS...
      </div>
    );
  }

  const latestExpected = forecast[29]?.expected || 0;
  const latestLower = forecast[29]?.lower_bound || 0;
  const latestUpper = forecast[29]?.upper_bound || 0;

  return (
    <div className="flex bg-[#08090a] text-[#f4f5f6] min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 border-b border-[#1e2023] pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Will I have enough money?</h1>
          <p className="text-slate-400 text-sm mt-1">90-Day cash runway projections based on your payments and bills</p>
        </header>

        <section className="mb-10 max-w-3xl font-mono text-sm bg-[#0e1012] border border-[#1e2023] p-5 text-slate-350">
          Based on your current customer payments and upcoming expenses, you should have approximately <strong className="text-white">₹{latestExpected.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong> available in 30 days.
        </section>

        {/* Forecast analytical header block */}
        <section className="mb-10 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-[#1e2023] pb-6">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Expected Case</span>
            <span className="text-xl font-bold font-mono text-[#0e9f6e]">₹{latestExpected.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">Optimistic Case</span>
            <span className="text-xl font-bold font-mono text-white">₹{latestUpper.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest block font-mono">If payments are delayed</span>
            <span className="text-xl font-bold font-mono text-rose-500">₹{latestLower.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
        </section>

        {/* Uncertainty graph */}
        <section className="bg-[#0e1012] border border-[#1e2023] p-6 max-w-4xl mb-10">
          <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-wider font-mono">
            WHAT WE EXPECT (90 DAYS)
          </h3>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={forecast}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1d1f" />
                <XAxis dataKey="date" stroke="#4a4b4d" fontSize={11} fontClassName="font-mono" />
                <YAxis 
                  stroke="#4a4b4d" 
                  fontSize={11} 
                  fontClassName="font-mono"
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}K`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0e1012", borderColor: "#1e2023" }}
                  labelStyle={{ color: "#64748b", fontFamily: "monospace" }}
                  itemStyle={{ color: "#f8fafc", fontFamily: "monospace" }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`]}
                />
                <Area 
                  type="monotone" 
                  dataKey="upper_bound" 
                  stroke="none" 
                  fill="#0e9f6e" 
                  fillOpacity={0.03} 
                  name="Optimistic"
                />
                <Area 
                  type="monotone" 
                  dataKey="expected" 
                  stroke="#0e9f6e" 
                  strokeWidth={1.5} 
                  fillOpacity={0.05} 
                  fill="#0e9f6e" 
                  name="Expected"
                />
                <Area 
                  type="monotone" 
                  dataKey="lower_bound" 
                  stroke="none" 
                  fill="#c81e1e" 
                  fillOpacity={0.03} 
                  name="Stressed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* What changes the forecast list */}
        <section className="max-w-xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono block mb-4">
            WHAT COULD CHANGE THIS?
          </span>
          <div className="border border-[#1e2023] bg-[#0e1012] font-mono text-sm p-5 divide-y divide-[#1e2023] space-y-4">
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-slate-400">Money coming from customers</span>
              <span className="text-[#0e9f6e] font-bold">+₹1,80,000.00</span>
            </div>
            <div className="flex justify-between items-baseline pt-3">
              <span className="text-slate-400">Supplier payments & fixed obligations</span>
              <span className="text-rose-500 font-bold">-₹2,00,000.00</span>
            </div>
            <div className="flex justify-between items-baseline pt-3">
              <span className="text-slate-400">Refund claims expected</span>
              <span className="text-rose-500 font-bold">-₹15,000.00</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
