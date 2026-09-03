import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Stuck Money Back",
  description: "Autonomous recovery pipelines for abandoned UPI checkouts and overdue bulk merchandise orders."
};

export default function RecoveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
