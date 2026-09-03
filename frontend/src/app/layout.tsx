import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import CommandBar from "./components/CommandBar";
import ToastContainer from "./components/Toast";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#08090C" }
  ]
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cashpulse.ai"),
  title: {
    default: "CashPulse AI — Autonomous Cash Flow & AR Recovery",
    template: "%s | CashPulse AI"
  },
  description: "A warm, intelligent financial co-pilot protecting working capital and rescuing overdue receivables for MSMEs and D2C brands.",
  keywords: [
    "Cash Flow",
    "Accounts Receivable",
    "AR Recovery",
    "MSME Finance",
    "Working Capital",
    "Invoice Recovery",
    "DwiSakhi",
    "Razorpay",
    "Shopify",
    "FinOps"
  ],
  authors: [{ name: "CashPulse AI Team" }],
  creator: "CashPulse AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cashpulse.ai",
    title: "CashPulse AI — Autonomous Cash Flow & AR Recovery",
    description: "Connect your bank, Shopify, and Razorpay. Silently revive dropped UPI checkouts, recover overdue college fest invoices, and never hit a payroll panic.",
    siteName: "CashPulse AI",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "CashPulse AI Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CashPulse AI — Autonomous Cash Flow & AR Recovery",
    description: "Autonomous cash flow telemetry and AR recovery engine for Indian brands and modern MSMEs.",
    images: ["/icon-512.png"]
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakartaSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-[#1A1A1A] font-sans selection:bg-[#EAF3ED] selection:text-[#225C3E]">
        {children}
        <CommandBar />
        <ToastContainer />
      </body>
    </html>
  );
}
