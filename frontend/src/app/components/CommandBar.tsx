"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Listen for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const suggestions = [
    { text: "What can I recover?", href: "/recovery" },
    { text: "Which customers owe me the most?", href: "/receivables" },
    { text: "Will I have enough money next month?", href: "/cashflow" },
    { text: "Try a What-If modeling", href: "/scenarios" },
    { text: "See Safety Rules", href: "/settings" }
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 font-sans">
      <div className="bg-[#0e1012] border border-[#1e2023] w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Input area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e2023]">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Ask CashPulse... (e.g. 'What can I recover?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder-slate-650"
            autoFocus
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-mono font-bold text-slate-500 border border-[#1e2023] px-2 py-0.5"
          >
            ESC
          </button>
        </div>

        {/* Suggestions */}
        <div className="p-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
            SUGGESTIONS
          </span>
          <div className="space-y-1">
            {suggestions
              .filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
              .map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSelect(s.href)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#16181b] text-sm text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                >
                  <span>{s.text}</span>
                  <span className="text-[10px] text-[#0e9f6e] font-mono font-bold uppercase">Go &rarr;</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
