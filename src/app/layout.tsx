import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PharmacyProvider } from "@/context/PharmacyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Metro Pharmacy | All Medicines Store, POS & Online Prescription System",
  description:
    "Next-generation real-time Pharmacy Management SaaS with Smart POS, Batch-Level Inventory Control, and Public Online Prescription Ordering Portal.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <PharmacyProvider>{children}</PharmacyProvider>
      </body>
    </html>
  );
}
