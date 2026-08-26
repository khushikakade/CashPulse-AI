import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-[#08090a] text-[#f4f5f6] min-h-screen flex flex-col font-sans selection:bg-[#0e9f6e] selection:text-black">
      {/* Top Border Indicator */}
      <div className="h-1 bg-[#0e9f6e]" />
      
      {/* Editorial Header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-8 flex justify-between items-baseline border-b border-[#1e2023]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black tracking-wider uppercase text-[#f4f5f6]">CASHPULSE</span>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">/ B2B OPERATIONAL CORE</span>
        </div>
        <Link 
          href="/dashboard" 
          className="text-sm font-mono font-bold text-[#0e9f6e] hover:text-[#f4f5f6] transition-colors uppercase tracking-wider"
        >
          Access Console &rarr;
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-20 flex flex-col">
        {/* Editorial Title */}
        <div className="mb-16 text-left max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-normal tracking-tight text-[#f4f5f6] font-serif leading-[1.15] mb-8 uppercase">
            Cash is not the problem.<br/>
            <span className="text-[#0e9f6e]">Stuck cash is.</span>
          </h1>
          <p className="text-slate-350 text-base md:text-lg leading-relaxed max-w-2xl mb-8">
            An autonomous financial operations layer for Indian MSMEs. CashPulse actively audits receivables, isolates transactional errors, and triggers bounded recovery routines through Razorpay Test Mode.
          </p>
          <div className="mt-4">
            <Link 
              href="/dashboard"
              className="bg-[#0e9f6e] text-black font-mono text-sm font-extrabold px-8 py-4 hover:bg-emerald-400 transition-colors uppercase tracking-wider"
            >
              Access Dashboard
            </Link>
          </div>
        </div>

        {/* Live Interface Preview (Above the Fold) */}
        <section className="border border-[#1e2023] bg-[#0e1012] font-mono p-8 text-sm text-slate-300 space-y-8">
          <div className="flex justify-between border-b border-[#1e2023] pb-4 text-xs text-slate-500">
            <span>CONSOLE PREVIEW: CURRENT EXPOSURE ACTIVE STATE</span>
            <span>AARAV_HOMETECH_LATEST_AUDIT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <span className="text-xs text-slate-500 block uppercase mb-2">Revenue at Risk</span>
              <span className="text-2xl font-extrabold text-[#f4f5f6]">₹18,42,890.00</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block uppercase mb-2">Recoverable Value (Est)</span>
              <span className="text-2xl font-extrabold text-[#0e9f6e]">₹7,84,300.00</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block uppercase mb-2">Recovery Success Rate</span>
              <span className="text-2xl font-extrabold text-[#f4f5f6]">38.74%</span>
            </div>
          </div>

          <div className="border-t border-[#1e2023] pt-6">
            <span className="text-xs text-slate-500 block uppercase mb-4 font-semibold">Priority Operations Required</span>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3.5 px-4 bg-[#08090a] border border-[#1e2023] text-sm">
                <span>Overdue Invoices (Venkatesh Enterprises)</span>
                <span className="text-rose-500 font-bold">₹2,40,000.00</span>
              </div>
              <div className="flex justify-between items-center py-3.5 px-4 bg-[#08090a] border border-[#1e2023] text-sm">
                <span>Failed Payments (Eligible for gateway retry)</span>
                <span className="text-amber-500 font-bold">₹84,200.00</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-8 border-t border-[#1e2023] flex justify-between items-baseline text-xs text-slate-500 font-mono">
        <div>&copy; 2026 CASHPULSE FinOps.</div>
        <div>RAZORPAY BUILDATHON CORE TRACK 3/4</div>
      </footer>
    </div>
  );
}
