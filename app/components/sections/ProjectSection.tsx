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

// The three resting/opening offsets every folder uses, so a folder made from
// two sheets fans the same way as one made from three.
const FAN = [
    { closed: { x: "-11%", r: "-4deg" }, open: { x: "-50%", r: "-9deg" } },
    { closed: { x: "11%", r: "4deg" }, open: { x: "50%", r: "9deg" } },
    { closed: { x: "0%", r: "0deg" }, open: { x: "0%", r: "0deg" } },
];

/** Build a folder's sheets from image paths, in paint order — last is on top. */
const sheetsFrom = (srcs: string[], alt: string) =>
    srcs.slice(0, 3).map((src, i) => ({ src, alt, ...FAN[i] }));

// Work with a page of its own on this site. Order is strongest first, not
// chronological — this is the list a stranger reads top-down.
const WRITTEN_UP = [
    {
        href: "/work/coffee-access",
        title: "15 minutes to coffee",
        subtitle: "Isochrone · Tomoro against the housing around Bintaro",
        sheets: sheetsFrom(
            ["/work/sheets/coffee-1.jpg", "/work/sheets/coffee-3.jpg", "/work/sheets/coffee-2.jpg"],
            "The Tomoro isochrone map: drive-time bands over Jabodetabek."
        ),
    },
    {
        href: "/work/crime-la",
        title: "Reading Los Angeles by its crime reports",
        subtitle: "Early work · pandas, folium, a public dataset, 2023",
        sheets: sheetsFrom(
            ["/work/sheets/crime-1.jpg", "/work/sheets/crime-3.jpg", "/work/sheets/crime-2.jpg"],
            "Charts from the Los Angeles crime analysis."
        ),
    },
    {
        href: "/work/tracker-doc",
        title: "TrackerDoc",
        subtitle: "Internal tool · Sheets as the store, an approval queue",
        sheets: sheetsFrom(
            ["/work/tracker/approval-flow.svg"],
            "The document approval flow, as a diagram."
        ),
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

            {/* Folders, not a list. The small square thumbnails read as a
                different species from the two featured folders above; these
                are the same component at the same scale. */}
            <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
                {WRITTEN_UP.map((w) => (
                <CaseFolder
                    key={w.href}
                    href={w.href}
                    title={w.title}
                    subtitle={w.subtitle}
                    sheets={w.sheets}
                />
                ))}

                {projects.map((project) => (
                <CaseFolder
                    key={project.id}
                    onActivate={() => openProject(project)}
                    title={project.title}
                    subtitle={project.subGroup || project.tags.filter((x) => !x.startsWith("#")).join(" · ")}
                    sheets={sheetsFrom([project.image], "")}
                />
                ))}
            </div>
            </div>
        </div>

        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </section>
    );
}
