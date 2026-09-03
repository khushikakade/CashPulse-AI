import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What CashPulse Can Do",
  description: "Configure collection thresholds, maximum reminder limits, and autonomy guardrails for your business."
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
