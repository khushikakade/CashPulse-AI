"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToast } from "../components/Toast";
import { Sparkles, Building2, TrendingUp, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, ArrowUpRight } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "द्वीSakhi",
    business_type: "D2C Brand",
    product_sold: "Tote Bags, Bucket Hats, Caps, Pouches, DTF Stickers",
    monthly_revenue: 420000,
    customer_count: 180,
    payment_terms: "COD + UPI/Razorpay"
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
        document.cookie = `business_id=${data.business_id}; path=/; max-age=31536000; SameSite=Lax`;
        showToast(
          "Welcome to CashPulse! 🎉",
          `${formData.name} is now connected with active cash protection.`,
          "celebration"
        );
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
      showToast("Setup Error", "Failed to register business details.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen flex flex-col items-center justify-center font-sans px-4 py-12 relative overflow-x-hidden w-full">
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#EAF3ED] rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#FEF8E8] rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-lg w-full warm-card p-6 sm:p-10 space-y-8 relative z-10 shadow-2xl">
        {/* Brand & Progress Header */}
        <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-5">
          <Link href="/" title="Back to CashPulse.com" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3ED] border border-[#C8E1D1] flex items-center justify-center text-[#225C3E] group-hover:scale-105 transition-transform">
              <span className="font-display font-black text-sm text-[#225C3E]">CP</span>
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-[#1A1A1A] group-hover:text-[#225C3E] transition-colors flex items-center gap-1">
                CashPulse <ArrowUpRight className="w-3 h-3 text-[#7A7770]" />
              </h1>
              <span className="text-[11px] text-[#7A7770] block">
                ← Back to website
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  step === s
                    ? "bg-[#225C3E] w-6"
                    : step > s
                    ? "bg-[#C8E1D1]"
                    : "bg-[#E8E5DF]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Business Profile */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-slide">
            <div>
              <span className="text-xs font-semibold text-[#225C3E] uppercase tracking-wider">Step 1 of 3</span>
              <h2 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
                Tell us about your business
              </h2>
              <p className="text-xs text-[#5C5954] mt-1">
                We’ll customize payment collection workflows to your specific commercial model.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Business or Trading Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. द्वीSakhi Merch Co. (or Mumbai Apparel Studio)"
                  className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E8E5DF] rounded-xl text-sm focus:outline-none focus:border-[#225C3E] focus:ring-1 focus:ring-[#225C3E] text-[#1A1A1A] placeholder-[#A8A59E]"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Industry or Business Type
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E8E5DF] rounded-xl text-sm focus:outline-none focus:border-[#225C3E] focus:ring-1 focus:ring-[#225C3E] text-[#1A1A1A]"
                >
                  <option value="D2C">D2C & E-Commerce Brand</option>
                  <option value="Manufacturing">Manufacturing & Fabrication</option>
                  <option value="Retail">Retail & Distribution</option>
                  <option value="Services">B2B Professional Services</option>
                  <option value="Wholesale">Wholesale Trader</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (!formData.name.trim()) {
                  showToast("Business Name Required", "Please enter your business or legal entity name.", "error");
                  return;
                }
                setStep(2);
              }}
              className="btn-primary w-full text-sm py-3.5 min-h-[44px]"
            >
              Continue to Operations &rarr;
            </button>
          </div>
        )}

        {/* Step 2: Commercial Model */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-slide">
            <div>
              <span className="text-xs font-semibold text-[#225C3E] uppercase tracking-wider">Step 2 of 3</span>
              <h2 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
                Operations & Volume
              </h2>
              <p className="text-xs text-[#5C5954] mt-1">
                Help us calibrate liquidity risk predictions to your cash velocity.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Primary Products or Services Sold
                </label>
                <input
                  type="text"
                  value={formData.product_sold}
                  onChange={(e) => setFormData({ ...formData, product_sold: e.target.value })}
                  placeholder="e.g. D2C Apparel & Merch, College Fest Orders, Studio Prints"
                  className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E8E5DF] rounded-xl text-sm focus:outline-none focus:border-[#225C3E] focus:ring-1 focus:ring-[#225C3E] text-[#1A1A1A] placeholder-[#A8A59E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Estimated Monthly Turnover (₹)
                </label>
                <input
                  type="number"
                  value={formData.monthly_revenue}
                  onChange={(e) => setFormData({ ...formData, monthly_revenue: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E8E5DF] rounded-xl text-sm focus:outline-none focus:border-[#225C3E] focus:ring-1 focus:ring-[#225C3E] text-[#1A1A1A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  Standard Customer Payment Terms
                </label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E8E5DF] rounded-xl text-sm focus:outline-none focus:border-[#225C3E] focus:ring-1 focus:ring-[#225C3E] text-[#1A1A1A]"
                >
                  <option value="immediately">Immediate payment (Online checkout / POS)</option>
                  <option value="later">Credit terms (Net 15 / Net 30 invoices)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary text-xs px-4"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-primary flex-1 text-sm py-3.5"
              >
                Continue to Integration &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Gateway Sync */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-slide">
            <div>
              <span className="text-xs font-semibold text-[#225C3E] uppercase tracking-wider">Step 3 of 3</span>
              <h2 className="font-display text-2xl font-bold text-[#1A1A1A] mt-0.5">
                Connect Payment Sync
              </h2>
              <p className="text-xs text-[#5C5954] mt-1">
                Link with Razorpay Test Mode to simulate instant transaction telemetry and automated recovery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#EAF3ED]/60 border border-[#C8E1D1] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#225C3E]">
                <ShieldCheck className="w-4 h-4" /> Razorpay Sandbox Ready
              </div>
              <p className="text-xs text-[#5C5954] leading-relaxed">
                CashPulse operates in test simulation mode. Invoices and checkouts can be safely simulated without any real money movement.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E5DF] cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-0.5 accent-[#225C3E] w-4 h-4"
              />
              <span className="text-xs text-[#1A1A1A] leading-tight font-medium">
                Enable connected real-time webhook ingestion (Test API channel)
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary text-xs px-4"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 text-sm py-3.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    Configuring Workspace...
                  </>
                ) : (
                  "Complete Setup & Open Workspace"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
