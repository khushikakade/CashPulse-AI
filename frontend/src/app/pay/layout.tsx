import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Razorpay Checkout Sandbox",
  description: "Simulated 1-tap customer checkout and recovery portal for CashPulse AI."
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
