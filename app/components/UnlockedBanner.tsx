// app/components/UnlockedBanner.tsx
// The last step of the approval loop. Clicking the link in the email sets a
// cookie and lands on the homepage — which, without this, looks exactly like
// the homepage did before, leaving the person to guess whether it worked.
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function Banner() {
  const params = useSearchParams();
  const state = params.get("unlocked");
  const [dismissed, setDismissed] = useState(false);
  if (!state || dismissed) return null;

  const ok = state === "1";

  return (
    <div
      role="status"
      className="border-b border-border bg-bg-subtle"
    >
      <div className="container mx-auto px-6 max-w-[720px] py-3 flex items-start justify-between gap-6">
        <p className="text-[13px] leading-[2] text-fg-body">
          {ok
            ? "You're in. Every project reads in full from here, on this browser, for the next six months."
            : "That link has run out, or it was never opened for this address. Ask again on any project and I'll send a new one."}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-[11px] text-fg-muted hover:text-fg transition-colors duration-300 flex-shrink-0 mt-1"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function UnlockedBanner() {
  // useSearchParams needs a boundary, and the banner is the only part of the
  // page that depends on the URL — so the rest still renders statically.
  return (
    <Suspense fallback={null}>
      <Banner />
    </Suspense>
  );
}
