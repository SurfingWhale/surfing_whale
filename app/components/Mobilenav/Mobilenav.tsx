"use client";
// app/components/Mobilenav/Mobilenav.tsx

import { useState } from "react";

const LINKS = [
    { label: "Home", href: "#" },
    { label: "Projects", href: "#project" },
    { label: "Skills", href: "#skills" },
    { label: "Activity", href: "#activity" },
    { label: "About", href: "#CV" },
    { label: "Notes", href: "#guest-notes" },
    { label: "Contact", href: "#contact" },
    ];

    export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden">
        <button
            onClick={() => setOpen(!open)}
            className="flex flex-col gap-[5px] p-2"
            aria-label="Toggle menu"
            aria-expanded={open}
        >
            <span className={`block w-5 h-[1.5px] bg-fg transition-all duration-300 ${open ? "rotate-45 translate-y-[6.5px]" : ""}`} />
            <span className={`block w-5 h-[1.5px] bg-fg transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-[1.5px] bg-fg transition-all duration-300 ${open ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
        </button>

        {open && (
            <div className="absolute top-14 left-0 w-full bg-bg border-b border-border py-5 px-6 flex flex-col gap-4">
            {LINKS.map((link) => (
                <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-fg-secondary hover:text-fg transition-colors duration-300"
                >
                {link.label}
                </a>
            ))}
            </div>
        )}
        </div>
    );
}
