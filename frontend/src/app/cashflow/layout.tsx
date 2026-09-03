import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Long Will My Money Last?",
  description: "90-day predictive cash runway forecast with best-case and delayed-payment trajectory bands."
};

export default function CashflowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
