import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Cash",
  description: "Live working capital telemetry, cash runway, and daily cash velocity for DwiSakhi."
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
