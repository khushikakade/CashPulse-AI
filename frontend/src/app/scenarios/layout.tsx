import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What If Money Gets Tight?",
  description: "Interactive what-if cash stress simulator testing client payment delays and liquidity impact."
};

export default function ScenariosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
