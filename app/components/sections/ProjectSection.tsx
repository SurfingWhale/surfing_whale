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
import { SectionLabel } from "@/app/components/SectionLabel";
import { CaseFolder } from "@/app/components/CaseFolder";
import { MarkSheet } from "@/app/components/FinanceSheets";

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

// The recap on the left, the mark on the right, Beranda in the middle. Order
// here is paint order, not layout — Beranda is listed last so it is the sheet
// on top of the pile while the folder is shut.
const FINANCE_SHEETS = [
    {
        src: "/work/finance/sheet-recap.jpg",
        alt: "The monthly recap card: a looping MONTHLY RECAP ribbon over the month's persona.",
        closed: { x: "-11%", r: "-4deg" }, open: { x: "-50%", r: "-9deg" },
    },
    { art: <MarkSheet />, closed: { x: "11%", r: "4deg" }, open: { x: "50%", r: "9deg" } },
    {
        src: "/work/finance/sheet-beranda.jpg",
        alt: "The app's home screen: liquid funds with the balance hidden, income and spending, and the section shortcuts.",
        closed: { x: "0%", r: "0deg" }, open: { x: "0%", r: "0deg" },
    },
];

export function ProjectSection({ projects }: Props) {
    const [selectedProject, setSelectedProject] = useState<NotionProject | null>(null);

    // Opening is free; the gate now sits partway through the story itself,
    // so a visitor can read the opening before being asked for anything.
    const openProject = (project: NotionProject) => setSelectedProject(project);

    return (
        <section className="w-full py-16 sm:py-24 border-t border-border">
        <div id="project" data-reveal className="container mx-auto px-6 max-w-[720px]">

            {/* ── Tier one: the featured case study ─────────────────────── */}
            <div data-spot>
            <SectionLabel note="The longer story behind how I think about data.">
            Selected case study
            </SectionLabel>
            </div>

            <div data-spot>
            <CaseFolder
                href="/work/finance-dashboard"
                title="A ledger that behaves like a product"
                subtitle="Finance dashboard · double-entry GL, prorate, self-audit"
                sheets={FINANCE_SHEETS}
            />
            </div>

            {/* ── Tier two: everything else, as a list ──────────────────── */}
            <div data-reveal style={{ ["--reveal-delay" as string]: "90ms" }} className="mt-20">
            <div data-spot>
            <SectionLabel note={`${projects.length} projects.`}>
                Other work
            </SectionLabel>
            </div>

            {projects.length === 0 ? (
                <p className="text-fg-muted text-[13px] py-10">No projects found.</p>
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
