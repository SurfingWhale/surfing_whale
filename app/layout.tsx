import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "./components/ThemeToggle";
import { REVEAL_INIT_SCRIPT } from "./components/Reveal";

// Matches the reference site, which loads Plus Jakarta Sans at 400/500/600 —
// confirmed from its stylesheet link and from the font names embedded in a
// print of the page.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display only, for the index stage. Bebas Neue ships one weight and one case
// — there is no bold and there are no lowercase letters, the caps just get
// smaller. So weight is not a dial here: presence comes from size, tracking
// and the condensed width, and asking for 700 would only get a synthesised
// smear. Self-hosted at build time like the other two, so no request leaves
// for a font CDN at runtime.
const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

// The status bar colour follows the theme, so a dark-mode home screen does
// not get a pale bar sitting on a dark page.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

const SITE = "https://surfing-whale.vercel.app";
const TITLE = "Muhammad Fauzy — Surfing Whale";
const DESCRIPTION =
  "I like building things that tell a story rather than report a number. Ledgers, forecasts, photographs, and the questions underneath them.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Surfing Whale",
  authors: [{ name: "Muhammad Fauzy", url: SITE }],
  creator: "Muhammad Fauzy",

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },

  // Lets iOS run it full-screen from the home screen.
  appleWebApp: {
    capable: true,
    title: "Surfing Whale",
    statusBarStyle: "default",
  },

  // What WhatsApp, LinkedIn and the rest unfurl.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE,
    siteName: "Surfing Whale",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Surfing Whale — I like building things that tell a story rather than report a number.",
      },
    ],
    locale: "en_GB",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },

  // Relative image URLs above resolve against this.
  metadataBase: new URL(SITE),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${geistMono.variable} ${bebas.variable} h-full antialiased`}
    >
      <head>
        {/* Both run before first paint: one applies a stored theme choice,
            the other arms the scroll reveal so sections do not flash in and
            straight back out on load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: REVEAL_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}