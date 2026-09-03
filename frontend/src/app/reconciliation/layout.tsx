import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match My Payments",
  description: "End-to-end payment audit tracking money from Razorpay gateway checkout to verified bank deposit."
};

export default function ReconciliationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
