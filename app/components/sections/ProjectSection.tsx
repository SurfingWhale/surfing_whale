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
import { MapSheet, IsoSheet } from "@/app/components/PadelSheets";

interface Props { projects: NotionProject[]; }

/** A thumbnail, then the name. The preview used to be `hidden xl:block` and
    hover-only, parked in the gutter beside the list — so on a phone, which is
    where this gets read, every row was text on an empty page. */
function Thumb({ src, alt }: { src?: string; alt: string }) {
    const real = Boolean(src) && !src!.includes("placeholder");
    return (
        <span className="flex-none w-[76px] h-[76px] sm:w-[92px] sm:h-[92px] rounded-lg overflow-hidden bg-bg-muted border border-border block">
        {real ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={alt}
                loading="lazy"
                className="w-full h-full object-cover block transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]"
            />
        ) : (
            <span aria-hidden="true" className="grid place-items-center w-full h-full">
            <span className="block w-6 h-px bg-border-strong" />
            </span>
        )}
        </span>
    );
}

function ProjectRow({ project, onOpen }: {
    project: NotionProject;
    onOpen: () => void;
}) {
    return (
        <li data-spot-row className="group relative border-b border-border last:border-b-0">
        <button onClick={onOpen} className="w-full text-left py-5 flex items-center gap-4 sm:gap-5">
            <Thumb src={project.image} alt="" />
            <span className="min-w-0">
            <span className="block text-[15px] leading-[24px] tracking-[-0.02em]">
                <span className="font-medium text-fg group-hover:underline underline-offset-4 decoration-1">
                {project.title}
                </span>
            </span>
            {project.subGroup && (
                <span className="block text-[13px] leading-[1.8] text-fg-body mt-1">
                {project.subGroup}
                </span>
            )}
            </span>
        </button>
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

// The Bintaro gap map on the outer sheets, the saturated core of the Pondok
// Labu isochrone map on top. Only the sheet's top fifth clears the flap when
// the folder is shut, and a slab of overlapping isochrone lines survives that
// crop where the previous artwork — grey bars — just read as a skeleton.
const PADEL_SHEETS = [
    { art: <MapSheet />, closed: { x: "-11%", r: "-4deg" }, open: { x: "-50%", r: "-9deg" } },
    { art: <MapSheet />, closed: { x: "11%", r: "4deg" }, open: { x: "50%", r: "9deg" } },
    { art: <IsoSheet />, closed: { x: "0%", r: "0deg" }, open: { x: "0%", r: "0deg" } },
];

// Work with a page of its own on this site. Order is strongest first, not
// chronological — this is the list a stranger reads top-down.
const WRITTEN_UP = [
    {
        href: "/work/coffee-access",
        title: "15 minutes to coffee",
        kind: "Field note",
        note: "Isochrone · spatial analysis · Bintaro",
        thumb: "/work/coffee/isochrone-tomoro.jpg",
        alt: "The Tomoro isochrone map: drive-time bands over Jabodetabek.",
    },
    {
        href: "/work/crime-la",
        title: "Reading Los Angeles by its crime reports",
        kind: "Early work",
        note: "pandas · folium · a public dataset, 2023",
        thumb: "/work/crime/thumb.jpg",
        alt: "Bar chart of reported crime counts by Los Angeles police area.",
    },
    {
        href: "/work/tracker-doc",
        title: "TrackerDoc",
        kind: "Internal tool",
        note: "Next.js · Google Sheets as the store · approval queue",
        thumb: "/work/tracker/approval-flow.svg",
        alt: "The document approval flow, as a diagram.",
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
            Selected case studies
            </SectionLabel>
            </div>

            {/* Two, not one. A single featured folder said the finance
                dashboard was the work and everything else was a footnote,
                which was never true. */}
            <div data-spot className="grid gap-10 sm:grid-cols-2 sm:gap-8">
            <CaseFolder
                href="/work/finance-dashboard"
                title="A ledger that behaves like a product"
                subtitle="Finance dashboard · double-entry GL, prorate, self-audit"
                sheets={FINANCE_SHEETS}
            />
            <CaseFolder
                href="/work/padel"
                title="Padel, and the moat nobody has dug"
                subtitle="140 courts, 22 kelurahan, and two with none at all"
                sheets={PADEL_SHEETS}
            />
            </div>

            {/* ── Tier two: everything else, as a list ──────────────────── */}
            <div data-reveal style={{ ["--reveal-delay" as string]: "90ms" }} className="mt-20">
            <div data-spot>
            <SectionLabel note={`${projects.length + WRITTEN_UP.length} projects.`}>
                Other work
            </SectionLabel>
            </div>

            <ul className="border-t border-border">
                {/* Written up on this site rather than left as a Notion row.
                    ProjectSectionWrapper filters the matching rows out of the
                    Notion list so each of these appears exactly once. */}
                {WRITTEN_UP.map((w) => (
                <li key={w.href} data-spot-row className="group relative border-b border-border last:border-b-0">
                    <Link href={w.href} className="w-full text-left py-5 flex items-center gap-4 sm:gap-5 no-underline text-fg">
                    <Thumb src={w.thumb} alt={w.alt} />
                    <span className="min-w-0">
                        <span className="block text-[15px] leading-[24px] tracking-[-0.02em]">
                        <span className="font-medium text-fg group-hover:underline underline-offset-4 decoration-1">
                            {w.title}
                        </span>
                        <span className="text-fg-secondary"> — {w.kind}</span>
                        </span>
                        <span className="block text-[13px] leading-[1.8] text-fg-body mt-1">
                        {w.note}
                        </span>
                    </span>
                    </Link>
                </li>
                ))}

                {projects.map((project) => (
                <ProjectRow
                    key={project.id}
                    project={project}
                    onOpen={() => openProject(project)}
                />
                ))}
            </ul>
            </div>
        </div>

        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </section>
    );
}
