// app/components/sections/CVSection.tsx
// The Spline 3D background was archived here — see PRD v2 §6.
"use client";

import { useAccess } from "@/app/components/AccessGate";
import { SectionLabel } from "@/app/components/SectionLabel";

const CV_LINK = "https://drive.google.com/file/d/123vUTdVxQ9LwOFwezuILq5FezI2nUvFR/view";

const STATS = [
    { value: "8+", label: "Projects" },
    { value: "3+", label: "Years experience" },
    { value: "99.9%", label: "Curiosity" },
    ];

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
        <section id="CV" className="w-full py-24 border-t border-border">
        <div className="container mx-auto px-6 max-w-[680px]">
            <SectionLabel>About</SectionLabel>

            <p className="text-fg-secondary leading-relaxed">
            Numbers tell stories. From raw figures to insights people can act
            on — data analyst by day, creative thinker always.
            </p>

            <div className="flex gap-12 py-8 my-8 border-y border-border">
            {STATS.map((stat) => (
                <div key={stat.label}>
                <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                <div className="text-xs text-fg-muted mt-1">{stat.label}</div>
                </div>
            ))}
            </div>

            <div className="flex gap-3 flex-wrap">
            <button
                onClick={openCV}
                className="px-6 py-3 rounded-lg bg-fg text-bg text-sm font-medium hover:opacity-85 transition-opacity duration-300"
            >
                View my CV
            </button>
            <a
                href="https://github.com/Untamed98x"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg border border-border text-fg text-sm font-medium hover:border-border-strong transition-colors duration-300"
            >
                GitHub
            </a>
            </div>
        </div>
        </section>
    );
}
