import type { NextConfig } from "next";
import { FIREBASE } from "./app/lib/firebaseConfig";

const firebaseProject = FIREBASE.projectId;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Photographs uploaded before the move to Supabase.
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  // Firebase's sign-in handler, served from this site's own origin. The
  // home-screen app on an iPhone keeps its storage apart from Safari's, and a
  // redirect that comes back through firebaseapp.com lands in the wrong one.
  // See app/studio/firebase.ts and creative-hub standards/auth.md.
  // The public archive was folded into the studio's photo library, which is
  // private. Anything bookmarked lands on the front page, not a 404.
  async redirects() {
    return [{ source: "/archive", destination: "/", permanent: false }];
  },
  async rewrites() {
    if (!firebaseProject) return [];
    const origin = `https://${firebaseProject}.firebaseapp.com`;
    return [
      { source: "/__/auth/:path*", destination: `${origin}/__/auth/:path*` },
      { source: "/__/firebase/:path*", destination: `${origin}/__/firebase/:path*` },
    ];
  },
};

export default nextConfig;
