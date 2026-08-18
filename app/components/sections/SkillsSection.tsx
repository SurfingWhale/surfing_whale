"use client";
// app/components/sections/SkillsSection.tsx

import { useEffect, useRef, useState } from "react";

const SKILLS = [
    { category: "Data Analysis", items: [
        { name: "Python", level: 90 },
        { name: "SQL", level: 88 },
        { name: "Pandas / NumPy", level: 85 },
        { name: "Scikit-learn", level: 75 },
    ]},
    { category: "Visualization", items: [
        { name: "Tableau", level: 85 },
        { name: "Matplotlib / Seaborn", level: 80 },
        { name: "Power BI", level: 70 },
    ]},
    { category: "Engineering", items: [
        { name: "Next.js / React", level: 72 },
        { name: "PostgreSQL", level: 78 },
        { name: "Git / GitHub", level: 82 },
    ]},
    ];

    function SkillBar({ name, level, animate }: {
    name: string; level: number; animate: boolean;
    }) {
    return (
        <div className="mb-5">
        <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-fg">{name}</span>
            <span className="font-mono text-xs text-fg-muted">{level}%</span>
        </div>
        <div className="h-[3px] bg-bg-muted rounded-full overflow-hidden">
            <div
            className="h-full bg-fg rounded-full transition-all duration-1000 ease-out"
            style={{ width: animate ? `${level}%` : "0%" }}
            />
        </div>
        </div>
    );
    }

    export function SkillsSection() {
    const ref = useRef<HTMLDivElement>(null);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setAnimate(true); },
        { threshold: 0.2 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={ref} id="skills" className="w-full py-24 border-t border-border">
        <div className="container mx-auto px-6 max-w-[1120px]">
            <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
                Skills
            </h2>
            <p className="text-sm text-fg-secondary mt-1">
                Tools I reach for most.
            </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SKILLS.map((group) => (
                <div key={group.category}
                className="border border-border rounded-lg p-6 bg-bg-subtle">
                <p className="text-xs text-fg-muted uppercase tracking-wider mb-6">
                    {group.category}
                </p>
                {group.items.map((skill) => (
                    <SkillBar key={skill.name} {...skill} animate={animate} />
                ))}
                </div>
            ))}
            </div>
        </div>
        </section>
    );
    }
