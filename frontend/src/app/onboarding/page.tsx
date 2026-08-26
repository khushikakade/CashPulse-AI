"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    business_type: "D2C",
    product_sold: "",
    monthly_revenue: 1500000,
    customer_count: 150,
    payment_terms: "later"
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === "success") {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit onboarding data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#08090a] text-[#f4f5f6] min-h-screen flex flex-col items-center justify-center font-sans px-4">
      <div className="max-w-md w-full border border-[#1e2023] bg-[#0e1012] p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[#1e2023] pb-4">
          <div className="w-6 h-6 bg-[#0e9f6e] flex items-center justify-center font-mono text-[10px] text-black font-extrabold">
            CP
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Onboarding Wizard</h1>
            <span className="text-[9px] text-[#0e9f6e] uppercase tracking-widest font-mono font-bold block">STEP {step} OF 3</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-tight font-mono">Let's register your business</h2>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-mono block">Business Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Electronics"
                className="w-full bg-black border border-[#1e2023] p-3 text-sm focus:border-[#0e9f6e] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-mono block">Business Type</label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="w-full bg-black border border-[#1e2023] p-3 text-sm focus:border-[#0e9f6e] focus:outline-none"
              >
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="D2C">D2C Brand</option>
                <option value="Services">Services</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
            <button
              onClick={() => {
                if (!formData.name) return alert("Please specify business name.");
                setStep(2);
              }}
              className="w-full bg-[#0e9f6e] hover:bg-[#10b981] text-black font-mono text-xs font-bold py-3.5 transition-colors uppercase tracking-wider"
            >
              Continue &rarr;
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-tight font-mono">Operations Details</h2>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-mono block">Products Sold</label>
              <input
                type="text"
                value={formData.product_sold}
                onChange={(e) => setFormData({ ...formData, product_sold: e.target.value })}
                placeholder="e.g. Home Appliances"
                className="w-full bg-black border border-[#1e2023] p-3 text-sm focus:border-[#0e9f6e] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-mono block">Monthly Revenue Estimate (₹)</label>
              <input
                type="number"
                value={formData.monthly_revenue}
                onChange={(e) => setFormData({ ...formData, monthly_revenue: Number(e.target.value) })}
                className="w-full bg-black border border-[#1e2023] p-3 text-sm focus:border-[#0e9f6e] focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 uppercase font-mono block">Customer payment terms</label>
              <select
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full bg-black border border-[#1e2023] p-3 text-sm focus:border-[#0e9f6e] focus:outline-none"
              >
                <option value="immediately">Immediate checkout payment</option>
                <option value="later">Credit terms (Invoiced later)</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="border border-[#1e2023] hover:border-slate-700 bg-transparent text-slate-400 font-mono text-xs px-4 py-3 uppercase tracking-wider"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#0e9f6e] hover:bg-[#10b981] text-black font-mono text-xs font-bold py-3.5 transition-colors uppercase tracking-wider"
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-tight font-mono">Connect payments gateway</h2>
            <div className="p-4 bg-black border border-[#1e2023] text-xs font-mono text-slate-400 leading-relaxed">
              To dynamically ingest transaction events, failed checkouts, and execute collections, connect your Razorpay account.
            </div>
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" id="rzp_chk" defaultChecked className="accent-[#0e9f6e]" />
              <label htmlFor="rzp_chk" className="text-xs text-white cursor-pointer select-none">
                Enable connected sync (Razorpay Test Mode)
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="border border-[#1e2023] hover:border-slate-700 bg-transparent text-slate-400 font-mono text-xs px-4 py-3 uppercase tracking-wider"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-[#0e9f6e] hover:bg-[#10b981] text-black font-mono text-xs font-extrabold py-3.5 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
