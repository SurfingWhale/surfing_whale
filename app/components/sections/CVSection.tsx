// app/components/sections/CVSection.tsx
// The Spline 3D background was archived here — see PRD v2 §6.

const CV_LINK = "https://drive.google.com/file/d/123vUTdVxQ9LwOFwezuILq5FezI2nUvFR/view";

const STATS = [
    { value: "8+", label: "Projects" },
    { value: "3+", label: "Years experience" },
    { value: "99.9%", label: "Curiosity" },
    ];

    export function CVSection() {
    return (
        <section id="CV" className="w-full py-24 border-t border-border">
        <div className="container mx-auto px-6 max-w-[680px] text-center">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.02em] leading-[1.15]">
            Numbers tell stories
            </h2>

            <p className="text-fg-secondary leading-relaxed mt-4">
            From raw numbers to insights people can act on — data analyst by day,
            creative thinker always. Here is what I have built.
            </p>

            <div className="flex justify-center gap-12 py-8 my-8 border-y border-border">
            {STATS.map((stat) => (
                <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-semibold tracking-tight">{stat.value}</div>
                <div className="text-xs text-fg-muted mt-1">{stat.label}</div>
                </div>
            ))}
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
            <a
                href={CV_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-lg bg-fg text-bg text-sm font-medium hover:opacity-85 transition-opacity duration-300"
            >
                View my CV
            </a>
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
