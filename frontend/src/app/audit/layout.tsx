import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History of Everything Done",
  description: "Verified immutable ledger of all automated recoveries, approvals, and reminders dispatched by CashPulse."
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
