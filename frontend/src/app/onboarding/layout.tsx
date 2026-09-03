import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect Your Business",
  description: "Link your business bank account, Shopify store, and Razorpay gateway in under 60 seconds."
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
