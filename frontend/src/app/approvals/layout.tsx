import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Waiting For Your Approval",
  description: "Human-in-the-loop safety queue for high-value collections and sensitive customer concessions."
};

export default function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
