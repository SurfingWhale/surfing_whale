import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muhammad Fauzy — Data Analyst & Visual Thinker",
  description:
    "Portfolio of Muhammad Fauzy — Data Analyst with a background in Accounting and a passion for photography. Turning raw numbers into meaningful stories.",
  keywords: ["Data Analyst", "Python", "SQL", "Tableau", "Portfolio", "Muhammad Fauzy"],
  authors: [{ name: "Muhammad Fauzy", url: "https://surfing-whale.vercel.app" }],
  creator: "Muhammad Fauzy",

  // Favicon
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png", // opsional, taruh di /public
  },

  // Open Graph — buat preview link di WA, IG, LinkedIn, dll
  openGraph: {
    title: "Muhammad Fauzy — Data Analyst & Visual Thinker",
    description:
      "Turning raw numbers into meaningful stories. Data analyst by day, creative thinker always.",
    url: "https://surfing-whale.vercel.app",
    siteName: "Surfing Whale",
    images: [
      {
        url: "https://surfing-whale.vercel.app/og-image.jpg", // taruh di /public/og-image.jpg
        width: 1200,
        height: 630,
        alt: "Muhammad Fauzy Portfolio",
      },
    ],
    locale: "id_ID",
    type: "website",
  },

  // Twitter/X card
  twitter: {
    card: "summary_large_image",
    title: "Muhammad Fauzy — Data Analyst",
    description: "Turning raw numbers into meaningful stories.",
    images: ["https://surfing-whale.vercel.app/og-image.jpg"],
  },

  // Vercel / browser tab
  metadataBase: new URL("https://surfing-whale.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}