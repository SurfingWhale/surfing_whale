// app/components/sections/CVSection.tsx
// The Spline 3D background was archived here — see PRD v2 §6.
"use client";

import { useAccess } from "@/app/components/AccessGate";
import { SectionLabel } from "@/app/components/SectionLabel";

const CV_LINK = "https://drive.google.com/file/d/123vUTdVxQ9LwOFwezuILq5FezI2nUvFR/view";

    export function CVSection() {
    const { requireAccess } = useAccess();

    // The open happens after the gate's async POST, so it is no longer inside
    // the original click gesture and a popup blocker may refuse the new tab.
    // Fall back to navigating in place when that happens, rather than leaving
    // the visitor staring at a closed dialog and no CV.
    // (`noopener` in the feature string would force a null return, hiding the
    // blocked case, so the opener is severed afterwards instead.)
    const openCV = () =>
        requireAccess("CV", () => {
        const win = window.open(CV_LINK, "_blank");
        if (win) win.opener = null;
        else window.location.href = CV_LINK;
        });

    return (
        <section data-spot id="CV" className="w-full py-16 sm:py-24 border-t border-border">
        <div data-reveal className="container mx-auto px-6 max-w-[720px]">
            <SectionLabel>About</SectionLabel>

            <p className="text-[13px] leading-[2] text-fg-body max-w-[560px]">
            Accounting first, then data. That order matters: I learned to care
            whether a number reconciles before I learned to plot one. Most of
            what is here started because something looked off and I wanted to
            know why.
            </p>

            <div className="flex gap-5 mt-8 text-[13px]">
            <button
                onClick={openCV}
                className="font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
                View my CV
            </button>
            </div>
        </div>
        </section>
    );
}
