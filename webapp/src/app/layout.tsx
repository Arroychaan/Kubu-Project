import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import { Suspense } from "react";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kubu — Suara Kamu, Pilihanmu",
  description: "Platform jajak pendapat sosial tempat opini didiskusikan secara terbuka, cerdas, dan transparan. Tentukan pilihanmu, dukung argumen terbaik, dan pantau dinamika opini secara real-time.",
  keywords: ["polling", "voting", "debat", "sosial", "opini publik", "diskusi"],
  openGraph: {
    title: "Kubu — Suara Kamu, Pilihanmu",
    description: "Platform diskusi opini dan jajak pendapat sosial paling transparan dan real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AuthProvider>
          <NextTopLoader color="#1d9bf0" showSpinner={false} />
          <ConditionalNavbar>
            <Suspense fallback={<div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-brand-border" />}>
              <Navbar />
            </Suspense>
          </ConditionalNavbar>
          <ConditionalNavbar paddingOnly>
            {children}
          </ConditionalNavbar>
        </AuthProvider>
      </body>
    </html>
  );
}
