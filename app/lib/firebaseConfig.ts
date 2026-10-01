// app/lib/firebaseConfig.ts
// The Firebase web app the studio signs in with — project `surfing-whale`.
//
// These are identifiers, not secrets. A Firebase web config is shipped to
// every browser that loads the sign-in, by design; what protects the studio
// is the server checking each token's project and verified email
// (adminAuth.ts), not anyone failing to find these values. Same reasoning as
// notionIds.ts: kept in code so only true secrets need setting by hand, and the
// environment still wins when set, so pointing at another project is a
// one-variable change.

const pick = (fromEnv: string | undefined, fallback: string) => (fromEnv ?? "").trim() || fallback;

export const FIREBASE = {
  apiKey: pick(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "AIzaSyAkRUK4txK01fGygMzdf6f_I23dkyJ12O8"),
  projectId: pick(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "surfing-whale"),
  appId: pick(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "1:751278619218:web:70c77b755b3c9f7cac3d8b"),
};

/**
 * The one host where Firebase's sign-in handler is served from this site's own
 * origin (next.config.ts proxies /__/auth). Its redirect URI is registered with
 * Google; a preview's is not, so previews keep firebaseapp.com.
 */
export const SIGN_IN_HOST = pick(process.env.NEXT_PUBLIC_SIGN_IN_HOST, "surfing-whale.vercel.app");

/**
 * Whether the home-screen app offers Google at all. The app signs in through
 * this site's own /__/auth/handler, which Google accepts only once that exact
 * redirect URI is on the project's OAuth web client — and until it is,
 * Google's error page is a dead end inside an app that has no back button.
 * Email and password work there regardless.
 *
 * Flip to true once https://surfing-whale.vercel.app/__/auth/handler stops
 * coming back as redirect_uri_mismatch. A browser tab is unaffected: it signs
 * in through firebaseapp.com, whose URI Google registered by itself.
 */
export const GOOGLE_IN_APP = false;
