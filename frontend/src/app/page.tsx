"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  TrendingUp,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
  Building2,
  ChevronRight,
  Check,
  Activity,
  ArrowUpRight,
  Layers,
  Clock,
  Eye,
  MessageSquareQuote
} from "lucide-react";

export default function Home() {
  const [activeBusiness, setActiveBusiness] = useState<{ name: string; id: string } | null>(null);
  
  // Interactive 3D Hero Card Mouse Tilt
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [cardRotate, setCardRotate] = useState({ x: 0, y: 0 });
  const [cardHover, setCardHover] = useState(false);

  // Hero Card Live Demo Simulation State
  const [demoRecovered, setDemoRecovered] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Interactive Product Showcase Tab State
  const [activeTab, setActiveTab] = useState<"radar" | "recovery" | "forecast">("radar");

  // Interactive Live Recovery Calculator State
  const [calcRevenue, setCalcRevenue] = useState<number>(650000);
  const [calcLeakRate, setCalcLeakRate] = useState<number>(14);

  // Fetch active business
  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/business/active");
        if (res.ok) {
          const data = await res.json();
          if (data.active) {
            setActiveBusiness({ name: data.name, id: data.id });
          }
        }
      } catch (e) {
        // Silent catch for marketing page
      }
    };
    fetchActive();
  }, []);

  // Handle 3D Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Dampen the angle
    setCardRotate({
      x: -(y / rect.height) * 12,
      y: (x / rect.width) * 12
    });
  };

  const handleMouseLeave = () => {
    setCardRotate({ x: 0, y: 0 });
    setCardHover(false);
  };

  // Simulate Instant Settlement in Hero Card
  const handleSimulateHeroRecovery = () => {
    if (demoRecovered) {
      setDemoRecovered(false);
      return;
    }
    setDemoLoading(true);
    setTimeout(() => {
      setDemoLoading(false);
      setDemoRecovered(true);
    }, 650);
  };

  // Calculated ROI figures
  const potentialLeak = Math.round(calcRevenue * (calcLeakRate / 100));
  const estimatedRecovered = Math.round(potentialLeak * 0.78);
  const extraRunwayDays = Math.round((estimatedRecovered / (calcRevenue * 0.45 / 30)));
  const hoursSaved = Math.round((potentialLeak / 10000) * 2.2);

  // Ticker items
  const tickerItems = [
    { text: "Recovered ₹54,000 from Mood Indigo IIT Bombay (150x Caps & Stickers)", time: "Just now", badge: "Fest Order" },
    { text: "Revived dropped UPI intent of ₹520 for Tanvi K. (Bucket Hat)", time: "2m ago", badge: "D2C Drop" },
    { text: "Collected ₹36,000 from St. Xavier's Malhar (120x Canvas Totes)", time: "7m ago", badge: "Bulk Merch" },
    { text: "Recovered ₹480 from Ananya S. via 1-tap WhatsApp link", time: "11m ago", badge: "UPI Revived" },
    { text: "Settled ₹28,000 overdue invoice for Waves BITS Pilani Core", time: "19m ago", badge: "Council Bill" },
    { text: "Prevented COD RTO return of ₹1,299 for Kunal V. (Verified Address)", time: "26m ago", badge: "COD Saved" },
    { text: "Recovered ₹18,000 advance payment from Rotaract Youth Conclave", time: "34m ago", badge: "Event Advance" },
    { text: "Revived ₹799 Mystery Goodie Bundle checkout for Suhani M.", time: "42m ago", badge: "Website Drop" }
  ];

  return (
    <div className="bg-[#08090C] text-[#F1F5F9] min-h-screen font-sans selection:bg-[#00F59B]/20 selection:text-[#00F59B] overflow-x-hidden relative">
      
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND ATMOSPHERE: Glowing Orbs, Gradient Mesh, Grid      */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Giant Pulsing Electric Emerald Orb */}
        <div className="absolute -top-32 left-1/4 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-[#00F59B]/15 via-[#05DF72]/10 to-transparent blur-[120px] animate-pulse-emerald pointer-events-none" />
        
        {/* Deep Cyan Supporting Glow */}
        <div className="absolute top-[35%] -right-40 w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-[#38BDF8]/10 via-[#00F59B]/5 to-transparent blur-[140px] pointer-events-none" />

        {/* Ambient Bottom Glow */}
        <div className="absolute -bottom-40 left-1/3 w-[700px] h-[500px] rounded-full bg-gradient-to-t from-[#00F59B]/10 via-transparent to-transparent blur-[150px] pointer-events-none" />

        {/* Subtle Tech Grid Texture */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090C]/80 border-b border-white/[0.07] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12141A] to-[#1E232F] border border-[#00F59B]/40 flex items-center justify-center shadow-lg shadow-[#00F59B]/10 group-hover:border-[#00F59B] transition-all">
              <span className="font-display font-black text-xl text-[#00F59B] tracking-tight">CP</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg text-white tracking-tight">
                  CashPulse
                </span>
                <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-pulse shadow-sm shadow-[#00F59B]" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block">
                Autonomous FinOps
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-[#00F59B] transition-colors">How It Works</a>
            <a href="#demo-preview" className="hover:text-[#00F59B] transition-colors">Live Preview</a>
            <a href="#calculator" className="hover:text-[#00F59B] transition-colors">Calculator</a>
            <a href="#case-study" className="hover:text-[#00F59B] transition-colors">Case Study</a>
            <Link href="/scenarios" className="hover:text-[#00F59B] transition-colors flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#00F59B]" /> What-If Simulator
            </Link>
          </nav>

          {/* Right Action CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-white bg-[#13161F] hover:bg-[#1A1F2B] border border-white/10 hover:border-[#00F59B]/40 px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F59B] animate-pulse" />
              <span>{activeBusiness ? `Open ${activeBusiness.name}` : "Open द्वीSakhi"}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              href="/onboarding"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden rounded-xl font-semibold text-xs transition-all group shadow-lg shadow-[#00F59B]/20"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#00F59B] via-[#34D399] to-[#38BDF8] group-hover:opacity-90 transition-opacity" />
              <span className="relative px-4 py-2.5 bg-[#0A0D12] text-[#00F59B] rounded-[10px] flex items-center gap-2 group-hover:bg-transparent group-hover:text-black font-bold transition-all">
                Launch Free <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 space-y-24 sm:space-y-36 pb-28">

        {/* ------------------------------------------------------------- */}
        {/* 1. HERO SECTION WITH PEEKING ARTWORK & 3D TILT CARD           */}
        {/* ------------------------------------------------------------- */}
        <section className="relative pt-12 sm:pt-20 lg:pt-24 overflow-hidden">
          
          {/* Peeking Background Artwork Visual */}
          <div className="absolute top-0 right-[-10%] lg:right-[-5%] w-[680px] lg:w-[920px] h-[640px] pointer-events-none opacity-45 select-none z-0 mix-blend-screen">
            <div className="relative w-full h-full">
              <Image
                src="/hero-liquidity-flow.jpg"
                alt="Glowing Liquidity Waveform Stream"
                fill
                priority
                className="object-cover object-center"
                style={{
                  maskImage: "radial-gradient(ellipse at 70% 40%, black 30%, rgba(0,0,0,0.5) 60%, transparent 85%)",
                  WebkitMaskImage: "radial-gradient(ellipse at 70% 40%, black 30%, rgba(0,0,0,0.5) 60%, transparent 85%)"
                }}
              />
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Bold Value Proposition (7 cols) */}
              <div className="lg:col-span-7 space-y-7 text-left">
                
                {/* Eyebrow Beacon */}
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#11161B] border border-[#00F59B]/30 shadow-sm shadow-[#00F59B]/10">
                  <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-ping" />
                  <span className="text-[11px] font-bold tracking-wider text-[#00F59B] uppercase font-mono">
                    Autonomous Cash OS for Indian Brands & SMBs
                  </span>
                </div>

                {/* Hero Headline */}
                <h1 className="font-display text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-white leading-[1.08]">
                  Stop chasing money.{" "}
                  <span className="text-gradient-emerald block mt-2">
                    Let stuck cash recover itself.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-xl">
                  CashPulse silently connects to your bank, Shopify, and Razorpay. It revives dropped UPI checkouts, collects overdue college fest and client bills via one-tap WhatsApp links, and guarantees you never hit a payroll panic.
                </p>

                {/* Dual CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/dashboard"
                    className="px-7 py-4 rounded-xl bg-gradient-to-r from-[#00F59B] to-[#05DF72] text-[#08090C] font-bold text-sm hover:shadow-xl hover:shadow-[#00F59B]/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-[#00F59B]/20"
                  >
                    {activeBusiness ? `Open ${activeBusiness.name} Workspace` : "Open द्वीSakhi Workspace"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/scenarios"
                    className="px-6 py-4 rounded-xl dark-glass text-slate-200 text-sm font-semibold hover:text-white dark-glass-hover flex items-center gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4 text-[#00F59B]" />
                    Test What-If Stress Simulator
                  </Link>
                </div>

                {/* Reassurance Trust Pills */}
                <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00F59B]" />
                    <span>No awkward debt calls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#00F59B]" />
                    <span>Razorpay & Bank webhook verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00F59B]" />
                    <span>Pauses & asks OK for &gt;₹50k</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Floating 3D Tilt Card (5 cols) */}
              <div 
                className="lg:col-span-5 relative"
                style={{ perspective: "1000px" }}
              >
                <div
                  ref={heroCardRef}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setCardHover(true)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    transform: cardHover
                      ? `rotateX(${cardRotate.x}deg) rotateY(${cardRotate.y}deg) scale3d(1.02, 1.02, 1.02)`
                      : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
                    transition: cardHover ? "transform 0.1s ease-out" : "transform 0.5s ease-out"
                  }}
                  className="relative dark-glass-emerald rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 select-none"
                >
                  {/* Glowing Rim Corner */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F59B]/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#00F59B]/15 border border-[#00F59B]/40 flex items-center justify-center text-[#00F59B]">
                        <Activity className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          Autonomous Risk Engine
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          Live Pulse • 184 Accounts Monitored
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#00F59B]/10 text-[#00F59B] text-[10px] font-bold border border-[#00F59B]/30 font-mono">
                      TEST ENVIRONMENT
                    </span>
                  </div>

                  {/* Live Transaction Snapshot */}
                  <div className="p-4 rounded-2xl bg-[#0D1016]/90 border border-white/[0.06] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          Stuck Bulk Merchandise Invoice
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          Mood Indigo IIT Bombay (150x Caps & Stickers)
                        </h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Invoice #INV-2026-MOODI-01 • Due 8 days ago
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
                        demoRecovered 
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {demoRecovered ? "SETTLED ✓" : "APPROVAL PAUSED"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs text-slate-400">Locked Working Capital:</span>
                      <span className="font-display text-2xl font-black text-white">
                        ₹54,000
                      </span>
                    </div>
                  </div>

                  {/* Agent Action Feed */}
                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#00F59B]/20 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-pulse" />
                      {demoRecovered 
                        ? "Payment Settled into Bank Account!"
                        : "Smart Escalation: WhatsApp Link Ready"}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                      {demoRecovered 
                        ? "Mood Indigo finance committee tapped the Razorpay UPI link. ₹54,000 credited to your HDFC Current account in 4m 12s."
                        : "Order exceeds your ₹50,000 safety threshold. Paused for Neha & Khushi's manual sign-off before dispatching polite collection reminder."}
                    </p>
                  </div>

                  {/* Interactive Button */}
                  <button
                    onClick={handleSimulateHeroRecovery}
                    disabled={demoLoading}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      demoRecovered
                        ? "bg-white/10 text-white hover:bg-white/15 border border-white/20"
                        : "bg-gradient-to-r from-[#00F59B] to-[#05DF72] text-[#08090C] hover:shadow-lg hover:shadow-[#00F59B]/25 hover:scale-[1.01]"
                    }`}
                  >
                    {demoLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Verifying Bank Webhook...
                      </>
                    ) : demoRecovered ? (
                      <>
                        Reset Simulation
                      </>
                    ) : (
                      <>
                        Simulate Approval & Settlement ➔
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-400">
                      💡 <em>Click to witness how CashPulse recovers cash without conflict</em>
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 2. LIVE TICKER STREAM: Real-Time Cash Rescues Across India    */}
        {/* ------------------------------------------------------------- */}
        <section className="border-y border-white/[0.08] bg-[#0A0D12] py-4 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 mb-2 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2 font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F59B] animate-ping" />
              Live Autonomous Stream
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Avg Recovery Time: 3m 42s
            </span>
          </div>

          <div className="relative overflow-hidden w-full">
            <div className="animate-marquee flex items-center gap-6">
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#12151D] border border-white/[0.06] text-xs shrink-0 hover:border-[#00F59B]/40 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-[#00F59B]/15 text-[#00F59B] flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </div>
                  <span className="font-semibold text-slate-200">{item.text}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400 text-[10px] font-mono">
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 3. AGITATE THE PAIN: The 3 Silent Cash Leaks                  */}
        {/* ------------------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-mono uppercase tracking-wider">
              The Reality of Indian Commerce
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              You’re making sales. <br />
              <span className="text-slate-400 font-normal">
                So why does your bank account feel dry?
              </span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Every month, Indian D2C brands, creators, and creative agencies bleed working capital through three invisible cracks that traditional accounting software ignores.
            </p>
          </div>

          {/* Asymmetrical 3-Card Pain Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pain 1 */}
            <div className="p-7 rounded-3xl dark-glass border border-white/[0.08] hover:border-red-500/40 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-red-400 font-mono tracking-wider uppercase">
                  Leak 01 • Silent Dropoffs
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  14% of UPI checkouts silently disappear
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Bank gateways timeout. Students get distracted before entering their UPI PIN. Without instant automated recovery within 15 minutes, 90% of those orders are lost forever.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-red-400/90 font-semibold">
                Avg. Loss: ₹42,000 / month
              </div>
            </div>

            {/* Pain 2 */}
            <div className="p-7 rounded-3xl dark-glass border border-white/[0.08] hover:border-amber-500/40 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-400 font-mono tracking-wider uppercase">
                  Leak 02 • Credit Term Lag
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  B2B fest & client invoices sit for 45+ days
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  You delivered the custom merchandise or completed the agency project. But student councils and corporate accounts delay payment, forcing you to fund fabric and rent out of pocket.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-amber-400/90 font-semibold">
                Avg. Trapped: ₹1,80,000+ per drop
              </div>
            </div>

            {/* Pain 3 */}
            <div className="p-7 rounded-3xl dark-glass border border-white/[0.08] hover:border-[#00F59B]/40 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-[#00F59B]/10 border border-[#00F59B]/25 flex items-center justify-center text-[#00F59B] group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#00F59B] font-mono tracking-wider uppercase">
                  Leak 03 • The Month-End Surprise
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Sudden studio rent & GST crunches
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  You look at your bank balance and feel fine — until courier invoices, GST liabilities, and packaging bills hit simultaneously on the 1st of the month, wiping out your cash cushion.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-[#00F59B] font-semibold">
                Result: Unnecessary emergency loans
              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 4. HOW IT WORKS: The 4-Step Autonomous Recovery Engine       */}
        {/* ------------------------------------------------------------- */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-[#00F59B]/10 border border-[#00F59B]/30 text-[#00F59B] text-xs font-bold font-mono uppercase tracking-wider">
              Zero Manual Chasing
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              How CashPulse recovers your money on autopilot
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Set it up once. CashPulse continuously monitors your liquidity, resolves payment failures, and keeps your bank balance protected.
            </p>
          </div>

          {/* 4 Connected Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-3xl dark-glass border border-white/[0.08] hover:border-[#00F59B]/30 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#13161F] text-[#00F59B] font-display font-black text-lg flex items-center justify-center border border-[#00F59B]/30">
                01
              </div>
              <h4 className="text-lg font-bold text-white">
                Live Liquidity Radar
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects to Razorpay, Shopify, and your bank. Instantly scans dropped checkouts, unpaid invoices, and customer reliability scores.
              </p>
              <div className="text-[11px] font-mono text-[#00F59B]">
                ⚡ 60-second setup
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl dark-glass border border-white/[0.08] hover:border-[#00F59B]/30 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#13161F] text-[#00F59B] font-display font-black text-lg flex items-center justify-center border border-[#00F59B]/30">
                02
              </div>
              <h4 className="text-lg font-bold text-white">
                Zero-Awkwardness Recovery
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatches polite 1-tap WhatsApp payment links to customers within minutes. Over 78% of dropped carts settle immediately without friction.
              </p>
              <div className="text-[11px] font-mono text-[#00F59B]">
                💬 Preserves relationship
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl dark-glass border border-white/[0.08] hover:border-[#00F59B]/30 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#13161F] text-[#00F59B] font-display font-black text-lg flex items-center justify-center border border-[#00F59B]/30">
                03
              </div>
              <h4 className="text-lg font-bold text-white">
                90-Day Liquidity Forecast
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Regression algorithms project your cash position 90 days ahead, calculating upcoming vendor bills and giving 3 weeks early warning.
              </p>
              <div className="text-[11px] font-mono text-[#00F59B]">
                📈 Zero surprises
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl dark-glass border border-white/[0.08] hover:border-[#00F59B]/30 transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#13161F] text-[#00F59B] font-display font-black text-lg flex items-center justify-center border border-[#00F59B]/30">
                04
              </div>
              <h4 className="text-lg font-bold text-white">
                Human Safety Guardrails
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You stay in total control. Any bulk transaction over ₹50,000 or sensitive VIP account is automatically paused for your 1-click OK.
              </p>
              <div className="text-[11px] font-mono text-[#00F59B]">
                🛡️ You hold the keys
              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 5. SHOW-DON'T-TELL: Interactive Tabbed Product Showcase      */}
        {/* ------------------------------------------------------------- */}
        <section id="demo-preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#00F59B] font-mono uppercase tracking-wider">
                Interactive Product Tour
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Designed like a premier financial cockpit
              </h2>
            </div>

            {/* Tab Pill Buttons */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#11141A] border border-white/[0.08]">
              <button
                onClick={() => setActiveTab("radar")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "radar"
                    ? "bg-[#00F59B] text-[#08090C] shadow-md shadow-[#00F59B]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1. Leak Radar
              </button>
              <button
                onClick={() => setActiveTab("recovery")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "recovery"
                    ? "bg-[#00F59B] text-[#08090C] shadow-md shadow-[#00F59B]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2. Recovery Pipeline
              </button>
              <button
                onClick={() => setActiveTab("forecast")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "forecast"
                    ? "bg-[#00F59B] text-[#08090C] shadow-md shadow-[#00F59B]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3. 90-Day Runway
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="dark-glass rounded-3xl border border-white/[0.08] p-6 sm:p-10 shadow-2xl overflow-hidden relative">
            
            {activeTab === "radar" && (
              <div className="space-y-6 animate-fade-slide">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      Live Customer Invoices & Dropped Checkouts
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ranked by payment likelihood and overdue days
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#00F59B]/10 text-[#00F59B] text-xs font-mono font-bold">
                    ₹2,02,580 Currently at Risk
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#11141D] text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-white/[0.06]">
                      <tr>
                        <th className="px-4 py-3">Account / College Fest</th>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">AI Likelihood</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      <tr className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5 font-bold text-white">Mood Indigo IIT Bombay (150x Caps)</td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">INV-2026-MOODI-01</td>
                        <td className="px-4 py-3.5 font-bold text-white">₹54,000</td>
                        <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Overdue 8d</span></td>
                        <td className="px-4 py-3.5 text-emerald-400 font-bold">85%</td>
                        <td className="px-4 py-3.5"><span className="text-[#00F59B] hover:underline font-semibold cursor-pointer">Review Approval &rarr;</span></td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5 font-bold text-white">Malhar Fest St. Xavier's (120x Totes)</td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">INV-2026-MALHAR-02</td>
                        <td className="px-4 py-3.5 font-bold text-white">₹36,000</td>
                        <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Overdue 4d</span></td>
                        <td className="px-4 py-3.5 text-emerald-400 font-bold">90%</td>
                        <td className="px-4 py-3.5"><span className="text-slate-400 font-mono">Link Dispatched</span></td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5 font-bold text-white">Tanvi Kulkarni (Bucket Hat)</td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">order_tanvi_102</td>
                        <td className="px-4 py-3.5 font-bold text-white">₹520</td>
                        <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">UPI Dropped</span></td>
                        <td className="px-4 py-3.5 text-emerald-400 font-bold">88%</td>
                        <td className="px-4 py-3.5"><span className="text-slate-400 font-mono">Auto-Retry Sent</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "recovery" && (
              <div className="space-y-6 animate-fade-slide">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      Automated Recovery Dossier
                    </h3>
                    <p className="text-xs text-slate-400">
                      Zero friction WhatsApp interaction with one-tap Razorpay intent
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                    Case #RC-8492
                  </span>
                </div>

                {/* WhatsApp Chat Simulation */}
                <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#0B0E14] border border-white/[0.08] space-y-3 font-sans">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
                    <div className="w-8 h-8 rounded-full bg-[#00F59B]/20 text-[#00F59B] flex items-center justify-center font-bold text-xs">
                      CP
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">CashPulse for द्वीSakhi</div>
                      <div className="text-[10px] text-slate-400">Verified WhatsApp Business Bot</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#171B24] border border-white/[0.06] text-xs text-slate-200 space-y-2">
                    <p>
                      Hey Tanvi! ✨ We noticed your checkout for the <strong>Vintage Washed Bucket Hat</strong> didn't go through due to a quick bank gateway drop.
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Your item is still reserved for you! Tap below to complete your order in one second via UPI:
                    </p>
                    <div className="pt-2">
                      <div className="w-full py-2.5 rounded-xl bg-[#00F59B] text-[#08090C] font-bold text-center text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                        Pay ₹520 via UPI ➔
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "forecast" && (
              <div className="space-y-6 animate-fade-slide">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      90-Day Liquidity Outlook
                    </h3>
                    <p className="text-xs text-slate-400">
                      Machine learning regression factoring upcoming rent, fabric, and shipping bills
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#00F59B]/10 text-[#00F59B] text-xs font-mono font-bold">
                    Runway: 70 Days Safe
                  </span>
                </div>

                <div className="h-44 rounded-2xl bg-[#0E1118] border border-white/[0.06] p-4 flex items-end justify-between gap-2">
                  {[316, 328, 340, 290, 310, 335, 360, 345, 375, 390, 420, 445].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div 
                        className="w-full bg-gradient-to-t from-[#00F59B]/20 to-[#00F59B] rounded-t-md transition-all hover:brightness-125"
                        style={{ height: `${(val / 500) * 100}%` }}
                      />
                      <span className="text-[9px] font-mono text-slate-400">W{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 6. INTERACTIVE RECOVERY CALCULATOR: Drag Sliders in Real Time */}
        {/* ------------------------------------------------------------- */}
        <section id="calculator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="dark-glass-emerald rounded-3xl p-8 sm:p-12 relative overflow-hidden space-y-8">
            
            <div className="max-w-2xl space-y-3">
              <span className="px-3.5 py-1.5 rounded-full bg-[#00F59B]/10 border border-[#00F59B]/30 text-[#00F59B] text-xs font-bold font-mono uppercase tracking-wider">
                Live ROI Simulator
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Calculate how much cash you're leaving on the table
              </h2>
              <p className="text-slate-300 text-sm">
                Drag the sliders to match your monthly revenue and see the exact working capital CashPulse can unlock for you.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
              
              {/* Sliders (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Slider 1: Revenue */}
                <div className="space-y-3 p-5 rounded-2xl bg-[#090C11] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Your Monthly Revenue</span>
                    <span className="font-display text-xl font-bold text-[#00F59B]">
                      ₹{calcRevenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="150000"
                    max="3000000"
                    step="50000"
                    value={calcRevenue}
                    onChange={(e) => setCalcRevenue(Number(e.target.value))}
                    className="w-full accent-[#00F59B] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>₹1.5 Lakhs</span>
                    <span>₹15 Lakhs</span>
                    <span>₹30 Lakhs</span>
                  </div>
                </div>

                {/* Slider 2: Leak Rate */}
                <div className="space-y-3 p-5 rounded-2xl bg-[#090C11] border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Unpaid Invoices & Dropped Checkout Rate</span>
                    <span className="font-display text-xl font-bold text-amber-400">
                      {calcLeakRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="28"
                    step="1"
                    value={calcLeakRate}
                    onChange={(e) => setCalcLeakRate(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>6% (Low Lag)</span>
                    <span>14% (Average Indian Brand)</span>
                    <span>28% (Heavy B2B/COD)</span>
                  </div>
                </div>

              </div>

              {/* Real-Time Computed Card (5 cols) */}
              <div className="lg:col-span-5 p-7 rounded-3xl bg-[#0A0D14] border border-[#00F59B]/30 shadow-2xl space-y-6">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Estimated Cash Pulse Impact
                </span>

                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Recovered Directly Into Your Bank:</div>
                  <div className="font-display text-4xl sm:text-5xl font-black text-gradient-emerald">
                    ₹{estimatedRecovered.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-emerald-400/80 font-mono">
                    / every single month
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
                  <div>
                    <div className="font-display text-2xl font-bold text-white">
                      +{extraRunwayDays} Days
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Extra Cash Runway
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold text-white">
                      {hoursSaved} Hours
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Chasing Time Saved
                    </div>
                  </div>
                </div>

                <Link
                  href="/onboarding"
                  className="w-full py-4 rounded-xl bg-[#00F59B] text-[#08090C] font-bold text-xs flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#00F59B]/20 hover:scale-[1.01] transition-all"
                >
                  Claim This ₹{estimatedRecovered.toLocaleString("en-IN")} Back Now ➔
                </Link>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 7. REAL CUSTOMER SPOTLIGHT: द्वीSakhi (Neha & Khushi)          */}
        {/* ------------------------------------------------------------- */}
        <section id="case-study" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl dark-glass border border-white/[0.08] relative overflow-hidden space-y-6">
            
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F59B] uppercase tracking-wider">
              <MessageSquareQuote className="w-4 h-4" /> Founder Spotlight
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                <blockquote className="font-display text-xl sm:text-2xl lg:text-3xl text-white font-normal leading-relaxed">
                  “Before CashPulse, we were spending Sunday nights awkwardly following up with college fest heads and losing dozens of tote bag checkouts to UPI bank drops. In our first month, <span className="text-[#00F59B] font-bold">CashPulse recovered ₹86,000 automatically</span> without a single awkward phone call.”
                </blockquote>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-[#1A222F] border border-[#00F59B]/40 flex items-center justify-center font-bold text-[#00F59B] text-sm">
                    NK
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Neha & Khushi</div>
                    <div className="text-xs text-slate-400">Founders, <strong>द्वीSakhi</strong> (Gen-Z D2C Merch Brand)</div>
                  </div>
                </div>
              </div>

              {/* DwiSakhi Proof Capsule */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0D1017] border border-white/[0.08] space-y-4 font-mono text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Verified 30-Day Metrics
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.06]">
                  <span className="text-slate-400">Total Recovered:</span>
                  <span className="font-bold text-[#00F59B]">₹86,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.06]">
                  <span className="text-slate-400">Failed UPI Revived:</span>
                  <span className="font-bold text-white">42 orders</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Cash Runway Added:</span>
                  <span className="font-bold text-white">+28 days</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 8. PROOF / STATS BAND: Animated High-Impact Counters          */}
        {/* ------------------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-6 rounded-2xl dark-glass border border-white/[0.06] space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-black text-white">
                ₹4.8 Cr+
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Cash Recovered for SMBs
              </div>
            </div>

            <div className="p-6 rounded-2xl dark-glass border border-white/[0.06] space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-black text-[#00F59B]">
                18,400+
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Failed Checkouts Rescued
              </div>
            </div>

            <div className="p-6 rounded-2xl dark-glass border border-white/[0.06] space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-black text-white">
                99.4%
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Zero-Awkwardness Rate
              </div>
            </div>

            <div className="p-6 rounded-2xl dark-glass border border-white/[0.06] space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-black text-amber-400">
                &lt; 4 mins
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Average UPI Settlement
              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 9. FINAL MAGNETIC CTA SECTION                                */}
        {/* ------------------------------------------------------------- */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-10 sm:p-16 text-center overflow-hidden border border-[#00F59B]/30 bg-gradient-to-b from-[#0F131C] via-[#090C12] to-[#07090D] shadow-2xl space-y-8">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00F59B]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight">
                Your cash shouldn’t be stuck in customer limbo.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Connect your business in 60 seconds. Let CashPulse catch failed checkouts and unpaid invoices today before they become next month's headache.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
              <Link
                href="/onboarding"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00F59B] to-[#05DF72] text-[#08090C] font-bold text-sm hover:shadow-xl hover:shadow-[#00F59B]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                Launch Free Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="px-7 py-4 rounded-xl dark-glass text-slate-200 text-sm font-semibold hover:text-white dark-glass-hover transition-all"
              >
                View Live Demo Dashboard
              </Link>
            </div>

            <div className="text-xs text-slate-400 font-medium relative z-10 pt-2">
              Free 14-day test mode • Instant Razorpay & Shopify sync • Cancel anytime
            </div>
          </div>
        </section>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* 10. HIGH-CRAFT FINTECH FOOTER                                 */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-white/[0.08] bg-[#06070A] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-base text-white">CashPulse AI</span>
            <span>•</span>
            <span>Autonomous Cash Flow & AR Recovery OS</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/receivables" className="hover:text-white transition-colors">Receivables</Link>
            <Link href="/recovery" className="hover:text-white transition-colors">Recovery</Link>
            <Link href="/scenarios" className="hover:text-white transition-colors">What-If Simulator</Link>
            <Link href="/approvals" className="hover:text-white transition-colors">Approvals</Link>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00F59B]" /> 256-Bit Encrypted
          </div>
        </div>
      </footer>

    </div>
  );
}
