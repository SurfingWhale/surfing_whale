import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Oswald, Instrument_Serif } from "next/font/google";
import "./globals.css";
// The one place the host is written; see app/lib/site.ts.
import { SITE } from "./lib/site";
import { THEME_INIT_SCRIPT } from "./components/ThemeToggle";
import { REVEAL_INIT_SCRIPT } from "./components/Reveal";
import { Intro, INTRO_INIT_SCRIPT, INTRO_CRITICAL_CSS } from "./components/Intro";

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

// Display only, for the index stage. Bebas Neue was here first and could not
// go bolder: it ships one weight and no lowercase at all. Oswald is the same
// condensed shape with a real 700 behind it, and it has a lowercase — so the
// names can be set the way they are written instead of shouted. Self-hosted at
// build time like the other two, so no request leaves for a font CDN.
const oswald = Oswald({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "700"],
});

// For the card headings, and nothing else.
//
// The reference sets its card in a serif, and that is most of why its two
// lines read as a printed note rather than as UI. Oswald is a condensed
// grotesque — right for a wordmark the width of the page, wrong at 26px in
// the middle of a small white card, where it reads as a label.
//
// One weight, one subset, self-hosted at build time like the other three, so
// this costs one small file and no request to a font CDN.
const serif = Instrument_Serif({
  variable: "--font-serif-face",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

// The status bar colour follows the theme, so a dark-mode home screen does
// not get a pale bar sitting on a dark page.
export const viewport: Viewport = {
  // Lets the studio's pinned action bar sit under the iPhone home indicator
  // and pad itself with env(safe-area-inset-bottom) instead of floating above
  // a strip of nothing.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

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
        // A new name, not new bytes under the old one: WhatsApp keeps the
        // preview it fetched for a URL, so /og.png would have kept showing
        // the old card in every chat that had already seen it.
        url: "/og-surfing-whale.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "A whale's tail in blue ink over the words Surfing Whale — I like building things that tell a story rather than report a number.",
      },
    ],
    locale: "en_GB",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-surfing-whale.jpg"],
  },

  // Relative image URLs above resolve against this.
  metadataBase: new URL(SITE),
  // Nothing on this site carried a canonical. Without one, every variant of a
  // URL — trailing slash, query string, http — is a separate page competing
  // with itself. Self-referencing at the root; each page's own metadata may
  // override it.
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The two scripts below add classes to <html> before React hydrates, on
    // purpose; this tells React the difference is expected. It covers this
    // element's own attributes only, not anything inside it.
    // `lang` was "id" on a site written in English. A screen reader reads
    // English prose with Indonesian pronunciation rules, and search reads the
    // page as Indonesian — both from one attribute nobody looks at.
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${jakarta.variable} ${geistMono.variable} ${oswald.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        {/* Both run before first paint: one applies a stored theme choice,
            the other arms the scroll reveal so sections do not flash in and
            straight back out on load. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: REVEAL_INIT_SCRIPT }} />
        {/* The opening's ink, inline. It has to be in the HTML rather than in
            the stylesheet: the page is render-blocked on that file, so on a
            slow connection putting it there showed white until the CSS landed
            and only then the counter. */}
        <style dangerouslySetInnerHTML={{ __html: INTRO_CRITICAL_CSS }} />
        {/* Decides, before anything is painted, whether this visit gets the
            opening — once a session, and never for anyone who has asked for
            less motion. Also carries the backstop that clears the ink if the
            JavaScript never arrives. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Intro />
        {children}
      </body>
    </html>
  );
}