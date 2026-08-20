"use client";
// app/components/sections/ProjectSection.tsx
//
// Two tiers, following the reference site's structure rather than a carousel
// of thumbnails: one featured case study given room, then the rest as a
// typographic list. In the list the name and the sentence carry the work and
// the screenshot only surfaces on hover — image second, text first.
//
// The Three.js particle backdrop was archived alongside Spline — PRD v2 §6.

import { useState } from "react";
import Link from "next/link";
import type { NotionProject } from "@/app/lib/notion";
import { ProjectModal } from "@/app/components/Projectmodal";
import { useAccess } from "@/app/components/AccessGate";
import { SectionLabel } from "@/app/components/SectionLabel";

interface Props { projects: NotionProject[]; }

function ProjectRow({ project, onOpen }: {
    project: NotionProject;
    onOpen: () => void;
}) {
    const hasPreview = Boolean(project.image) && !project.image.includes("placeholder");

    return (
        <li data-spot-row className="group relative border-b border-border last:border-b-0">
        <button
            onClick={onOpen}
            className="w-full text-left py-6 block"
        >
            <span className="text-[15px] leading-[24px] tracking-[-0.02em]">
            <span className="font-medium text-fg group-hover:underline underline-offset-4 decoration-1">
                {project.title}
            </span>
            {project.subGroup && (
                <span className="text-fg-secondary"> — {project.subGroup}</span>
            )}
            </span>

            {project.tags.length > 0 && (
            <span className="block text-[13px] leading-[1.8] text-fg-body mt-2.5">
                {project.tags.filter((t) => !t.startsWith("#")).join(" · ")}
            </span>
            )}
        </button>

        {/* Desktop-only hover preview, parked in the gutter the button leaves. */}
        {hasPreview && (
            <figure
            aria-hidden="true"
            className="pointer-events-none hidden xl:block absolute left-full ml-10 top-1/2 -translate-y-1/2 w-60 aspect-[16/10] rounded-lg overflow-hidden border border-border bg-bg-muted opacity-0 scale-[0.96] group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out"
            >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={project.image}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
            />
            </figure>
        )}
        </li>
    );
}

export function ProjectSection({ projects }: Props) {
    const [selectedProject, setSelectedProject] = useState<NotionProject | null>(null);
    const { requireAccess } = useAccess();

    // The list stays browsable; the gate sits in front of opening a detail.
    const openProject = (project: NotionProject) =>
        requireAccess("Project", () => setSelectedProject(project));

    return (
        <section className="w-full py-24 border-t border-border">
        <div id="project" className="container mx-auto px-6 max-w-[720px]">

            {/* ── Tier one: the featured case study ─────────────────────── */}
            <div data-spot>
            <SectionLabel note="The longer story behind how I think about data.">
            Selected case study
            </SectionLabel>
            </div>

            <Link
            data-spot
            href="/work/finance-dashboard"
            className="group block border border-border rounded-xl overflow-hidden bg-bg-subtle hover:border-border-strong transition-colors duration-300"
            >
            <div className="p-7">
                <h3 className="text-[15px] font-medium tracking-[-0.02em] leading-[1.4]">
                A ledger that behaves like a product
                </h3>
                <p className="text-[13px] leading-[1.8] text-fg-body mt-2.5 max-w-prose">
                A personal finance dashboard built on general-ledger accounts —
                prorate budgeting against working days, end-of-month
                forecasting, and bank reconciliation.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.07em] uppercase text-fg mt-5">
                Read the case study
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </span>
            </div>
            </Link>

            {/* ── Tier two: everything else, as a list ──────────────────── */}
            <div className="mt-20">
            <div data-spot>
            <SectionLabel note={`${projects.length} projects.`}>
                Other work
            </SectionLabel>
            </div>

            {projects.length === 0 ? (
                <p className="text-fg-muted text-sm py-10">No projects found.</p>
            ) : (
                <ul className="border-t border-border">
                {projects.map((project) => (
                    <ProjectRow
                    key={project.id}
                    project={project}
                    onOpen={() => openProject(project)}
                    />
                ))}
                </ul>
            )}
            </div>
        </div>

        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </section>
    );
}
