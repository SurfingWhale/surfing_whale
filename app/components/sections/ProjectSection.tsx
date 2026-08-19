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

interface Props { projects: NotionProject[]; }

function ProjectRow({ project, onOpen }: {
    project: NotionProject;
    onOpen: () => void;
}) {
    const hasPreview = Boolean(project.image) && !project.image.includes("placeholder");

    return (
        <li className="group relative border-b border-border last:border-b-0">
        <button
            onClick={onOpen}
            className="w-full text-left py-6 pr-0 lg:pr-72 block"
        >
            <span className="text-lg tracking-tight">
            <span className="font-medium text-fg group-hover:underline underline-offset-4 decoration-1">
                {project.title}
            </span>
            {project.subGroup && (
                <span className="text-fg-secondary"> — {project.subGroup}</span>
            )}
            </span>

            {project.tags.length > 0 && (
            <span className="block text-sm text-fg-muted mt-1.5">
                {project.tags.filter((t) => !t.startsWith("#")).join(" · ")}
            </span>
            )}
        </button>

        {/* Desktop-only hover preview, parked in the gutter the button leaves. */}
        {hasPreview && (
            <figure
            aria-hidden="true"
            className="pointer-events-none hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-64 aspect-[16/10] rounded-lg overflow-hidden border border-border bg-bg-muted opacity-0 scale-[0.96] group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out"
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
        <div id="project" className="container mx-auto px-6 max-w-[880px]">

            {/* ── Tier one: the featured case study ─────────────────────── */}
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
            Selected case study
            </h2>
            <p className="text-sm text-fg-secondary mt-1 mb-8">
            The longer story behind how I think about data.
            </p>

            <Link
            href="/work/finance-dashboard"
            className="group block border border-border rounded-xl overflow-hidden bg-bg-subtle hover:border-border-strong transition-colors duration-300"
            >
            <div className="p-7">
                <h3 className="text-xl font-medium tracking-tight">
                A ledger that behaves like a product
                </h3>
                <p className="text-fg-secondary leading-relaxed mt-2 max-w-prose">
                A personal finance dashboard built on general-ledger accounts —
                prorate budgeting against working days, end-of-month
                forecasting, and bank reconciliation.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm text-fg mt-5">
                Read the case study
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </span>
            </div>
            </Link>

            {/* ── Tier two: everything else, as a list ──────────────────── */}
            <div className="mt-20">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
                Other work
            </h2>
            <p className="text-sm text-fg-secondary mt-1 mb-4">
                {projects.length} projects · hover to preview.
            </p>

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
