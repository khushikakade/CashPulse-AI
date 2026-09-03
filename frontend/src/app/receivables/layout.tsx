import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Who Owes You Money",
  description: "Track all unpaid customer invoices and college fest bills ranked by payment likelihood and overdue aging."
};

export default function ReceivablesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
