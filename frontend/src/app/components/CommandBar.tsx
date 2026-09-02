"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const suggestions = [
    { text: "Who owes me money right now?", href: "/receivables", category: "Money Owed" },
    { text: "Which customer payments are stuck?", href: "/recovery", category: "Collect Money" },
    { text: "Will I have enough cash next month?", href: "/cashflow", category: "Look Ahead" },
    { text: "What happens if customers pay late?", href: "/scenarios", category: "What-If" },
    { text: "Check actions waiting for my OK", href: "/approvals", category: "Approvals" },
    { text: "Change what CashPulse can do automatically", href: "/settings", category: "Rules" }
  ];

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!query.trim()) return;

      try {
        const res = await fetch("http://localhost:8000/api/v1/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        if (data.route) {
          setIsOpen(false);
          setQuery("");
          router.push(data.route);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4 font-sans animate-fade-slide">
      <div 
        className="glass-panel rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative border border-white/70"
        style={{
          boxShadow: "0 24px 60px -12px rgba(20, 19, 18, 0.25)"
        }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E1D8]/80 bg-white/70">
          <div className="w-8 h-8 rounded-full bg-[#EAF3ED] text-[#194F34] flex items-center justify-center shrink-0 shadow-xs">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Ask anything in plain words... (e.g. 'Who owes me money?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="bg-transparent border-none text-[#141312] text-sm focus:outline-none w-full placeholder-[#706B63] font-medium"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-[11px] font-semibold text-[#706B63] hover:text-[#141312] bg-[#FAF9F6] border border-[#E5E1D8] rounded-lg transition-colors flex items-center gap-1"
          >
            <span>Esc</span>
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto bg-white/50">
          <div className="flex items-center justify-between px-2 mb-1 text-[11px] font-bold text-[#706B63]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2E7A52]" /> Common Questions
            </span>
            <span className="text-[10px] text-[#A8A59E] font-normal">Press Enter to run</span>
          </div>

          <div className="space-y-1">
            {suggestions
              .filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
              .map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSelect(s.href)}
                  className="w-full text-left px-3.5 py-3 hover:bg-white rounded-xl text-sm text-[#141312] transition-all flex items-center justify-between group border border-transparent hover:border-[#E5E1D8] shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="badge-sage text-[10px] px-2 py-0.5">
                      {s.category}
                    </span>
                    <span className="font-semibold text-xs text-[#141312] group-hover:text-[#194F34] transition-colors">
                      {s.text}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A8A59E] group-hover:text-[#194F34] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF9F6]/90 px-5 py-3 border-t border-[#E5E1D8] flex items-center justify-between text-xs text-[#706B63]">
          <span>CashPulse searches your bills, bank deposits, and client records</span>
          <span className="text-[11px] font-semibold text-[#141312]">Instant Assistant</span>
        </div>
      </div>
    </div>
  );
}
