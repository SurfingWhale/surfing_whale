// app/manifest.ts
// Enough of a PWA to be installed and to look like itself on a home screen.
// No service worker: this site is server-rendered and there is nothing here
// worth serving stale from a cache.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Surfing Whale — Muhammad Fauzy",
    short_name: "Surfing Whale",
    description:
      "Building things that tell a story rather than report a number. Data, ledgers and photographs.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    // Matches the page background so the status bar does not sit on a
    // different colour from the content under it.
    theme_color: "#fafafa",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops this one to whatever shape the launcher uses, so it
      // carries a much wider margin around the mark.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
