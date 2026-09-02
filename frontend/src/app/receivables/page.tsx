"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import CountUp from "../components/CountUp";
import { Receipt, Clock } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
  probability_of_payment: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

export default function Receivables() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/receivables/queue");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setInvoices(data);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load invoice queue", e);
      }

      // Exact DwiSakhi seeded invoices fallback
      setInvoices([
        {
          id: "inv_moodi",
          invoice_number: "INV-2026-MOODI-01",
          amount: 54000,
          due_date: new Date(Date.now() - 8 * 86400000).toISOString(),
          status: "overdue",
          probability_of_payment: 0.85,
          customer: { name: "Mood Indigo IIT Bombay - Merch Committee", email: "merch@moodi.org" }
        },
        {
          id: "inv_malhar",
          invoice_number: "INV-2026-MALHAR-02",
          amount: 36000,
          due_date: new Date(Date.now() - 4 * 86400000).toISOString(),
          status: "overdue",
          probability_of_payment: 0.90,
          customer: { name: "Malhar Fest Organizers - St. Xavier's College", email: "logistics@malharfest.org" }
        },
        {
          id: "inv_sympulse",
          invoice_number: "INV-2026-SYMPULSE-03",
          amount: 64000,
          due_date: new Date(Date.now() + 12 * 86400000).toISOString(),
          status: "unpaid",
          probability_of_payment: 0.88,
          customer: { name: "Sympulse Fest Merch Cell - Symbiosis Pune", email: "finance@sympulse.in" }
        },
        {
          id: "inv_waves",
          invoice_number: "INV-2026-WAVES-04",
          amount: 28000,
          due_date: new Date(Date.now() - 14 * 86400000).toISOString(),
          status: "overdue",
          probability_of_payment: 0.72,
          customer: { name: "Waves Festival Core - BITS Pilani Goa", email: "waves.merch@goa.bits-pilani.ac.in" }
        },
        {
          id: "inv_rotaract",
          invoice_number: "INV-2026-ROTARACT-05",
          amount: 18000,
          due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
          status: "unpaid",
          probability_of_payment: 0.92,
          customer: { name: "Rotaract Club Youth Conclave - Bengaluru", email: "president@rotaractbangalore.org" }
        },
        {
          id: "inv_campus",
          invoice_number: "INV-2026-CAMPUS-06",
          amount: 2580,
          due_date: new Date(Date.now() - 2 * 86400000).toISOString(),
          status: "overdue",
          probability_of_payment: 0.85,
          customer: { name: "Aarav Deshmukh (College Dance Society)", email: "aarav.deshmukh24@gmail.com" }
        }
      ]);
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="flex bg-[#FAF9F6] text-[#141312] min-h-screen font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="pb-4 border-b border-[#E5E1D8]">
          <span className="badge-sage text-xs mb-1.5">
            <Receipt className="w-3.5 h-3.5" /> Customer Invoices & Fest Orders
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141312] tracking-tight mt-1">
            Who Owes You Money
          </h1>
          <p className="text-xs text-[#54504A] mt-1 font-normal">
            Track unpaid college fest bulk merchandise bills and pending D2C student deliveries.
          </p>
        </header>

        {/* Storytelling Strip */}
        <section className="warm-card p-6 bg-gradient-to-r from-white to-[#FAF9F6] space-y-2">
          <div className="text-xs font-bold text-[#706B63] uppercase tracking-wide">
            द्वीSakhi Receivables Summary
          </div>
          <p className="font-display text-lg sm:text-xl font-normal text-[#141312] leading-relaxed">
            You currently have{" "}
            <strong className="font-bold text-[#141312]">
              <CountUp value={invoices.length} /> pending accounts
            </strong>{" "}
            totaling{" "}
            <strong className="font-bold text-[#194F34]">
              ₹<CountUp value={totalOutstanding} />
            </strong>
            . {overdueCount > 0 ? (
              <span>
                There are <strong className="text-[#8E3015] font-bold">{overdueCount} overdue fest orders</strong> that CashPulse is following up with via automated WhatsApp payment links.
              </span>
            ) : (
              <span>All customer accounts are currently on schedule.</span>
            )}
          </p>
        </section>

        {/* Invoices Table in Warm Floating Card */}
        <section className="warm-card overflow-hidden">
          <div className="p-5 border-b border-[#E5E1D8] flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-[#141312]">
                Customer Bill List
              </h2>
              <p className="text-xs text-[#54504A]">
                Ranked by payment likelihood and overdue date
              </p>
            </div>
            <span className="badge-neutral text-xs font-semibold">
              {invoices.length} accounts • ₹{totalOutstanding.toLocaleString("en-IN")} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#54504A]">
              <thead className="bg-[#F4F1EA] text-[11px] font-bold text-[#706B63] border-b border-[#E5E1D8]">
                <tr>
                  <th className="px-6 py-3.5">Customer / College Fest</th>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Bill Amount</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Chance They'll Pay</th>
                  <th className="px-6 py-3.5">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {invoices.map((inv) => {
                  const prob = Math.round(inv.probability_of_payment * 100);
                  const isHigh = prob >= 80;
                  const isMed = prob >= 60 && prob < 80;
                  const isPaid = inv.status === "paid";
                  const isOverdue = inv.status === "overdue";

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#FAF9F6] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#EAF3ED] text-[#194F34] font-bold flex items-center justify-center text-xs shrink-0">
                            {inv.customer?.name ? inv.customer.name.charAt(0) : "D"}
                          </div>
                          <div>
                            <div className="font-bold text-[#141312]">
                              {inv.customer?.name}
                            </div>
                            <div className="text-[11px] text-[#706B63]">
                              {inv.customer?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-[#141312]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 font-display font-bold text-sm text-[#141312]">
                        ₹{inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 text-[#383531]">
                        {new Date(inv.due_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            isHigh
                              ? "badge-sage text-[11px]"
                              : isMed
                              ? "badge-honey text-[11px]"
                              : "badge-peach text-[11px]"
                          }
                        >
                          {prob}% chance
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            isPaid
                              ? "badge-sage text-[11px]"
                              : isOverdue
                              ? "badge-peach text-[11px]"
                              : "badge-neutral text-[11px]"
                          }
                        >
                          {isPaid ? "Paid & Settled" : isOverdue ? "Overdue" : "Due Soon"}
                        </span>
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
