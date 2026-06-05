import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KUBU - Viral Social Voting",
  description: "Pick a side. Watch the war ensue. The ultimate binary voting battleground.",
  keywords: ["voting", "polls", "social", "viral", "debate"],
  openGraph: {
    title: "KUBU - Viral Social Voting",
    description: "Pick a side. Watch the war ensue.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neon-dark min-h-screen`}
      >
        <AuthProvider>
          <Suspense fallback={<div className="fixed top-0 left-0 right-0 h-16 bg-neon-dark/80 backdrop-blur-xl border-b border-white/5" />}>
            <Navbar />
          </Suspense>
          <div className="pt-16">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
