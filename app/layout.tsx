import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CXGRD | AI Architectural Guardrail for Your Codebase",
  description: "Automated architectural guardrail that maps dependencies and calculates blast radius before AI makes changes. Move fast without breaking your architecture.",
  icons: {
    icon: "/cxgrdlogo.png",
  },
  openGraph: {
    title: "CXGRD | AI Architectural Guardrail for Your Codebase",
    description: "Automated architectural guardrail that maps dependencies and calculates blast radius before AI makes changes. Move fast without breaking your architecture.",
    url: "https://cxgrd.netlify.app",
    siteName: "CXGRD",
    images: [
      {
        url: "/Homepage.png",
        width: 1200,
        height: 630,
        alt: "CXGRD Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CXGRD | AI Architectural Guardrail for Your Codebase",
    description: "Automated architectural guardrail that maps dependencies and calculates blast radius before AI makes changes. Move fast without breaking your architecture.",
    images: ["/Homepage.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
