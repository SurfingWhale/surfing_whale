// app/components/TopNav.tsx
// The fixed header, and one fact about the page under it: whether it is
// scrolled to the very top.
//
// At the top, the header's frosted bar would blur away the dither field that
// starts behind it (DitherField in the hero), so the bar goes clear and loses
// its hairline — the dots run crisp through the header and fade out below it.
// The moment the page moves, the frosted bar comes back, because from then on
// it sits over text that the links have to stay readable against.
"use client";

import { useEffect, useState } from "react";

export function TopNav({ children }: { children: React.ReactNode }) {
  const [top, setTop] = useState(true);

  useEffect(() => {
    const check = () => setTop(window.scrollY < 8);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <nav
      data-spot
      data-top={top ? "" : undefined}
      className="top-nav fixed top-0 left-0 w-full z-50 border-b border-border bg-bg/80 backdrop-blur-md transition-[background-color,border-color,backdrop-filter] duration-300"
    >
      {children}
    </nav>
  );
}
