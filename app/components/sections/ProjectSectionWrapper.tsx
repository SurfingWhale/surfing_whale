// app/components/sections/ProjectSectionWrapper.tsx
// Server Component — the Notion fetch happens here.

import { getProjects } from "@/app/lib/notion";
import { visualFor } from "@/app/lib/projectVisuals";
import { ProjectSection } from "./ProjectSection";

// The finance dashboard is the featured case study above the list. It is also
// a row in the Notion database, so without this it appeared twice on one
// screen under two different names for the same thing.
const FEATURED = /finance dashboard|personal dashboard/i;

// Rows that now have a written-up page of their own in WRITTEN_UP. Without
// this each would appear twice in one list: once as a link to the page, once
// as a Notion row opening the modal.
const WRITTEN_UP = /padel|tracker.?(doc|tsm)|crime|unveiling/i;

export default async function ProjectSectionWrapper() {
    const projects = (await getProjects())
        .filter(
            (p) =>
                !FEATURED.test(p.title) &&
                !FEATURED.test(p.link) &&
                !WRITTEN_UP.test(p.title)
        )
        // A card with no picture is a blank rectangle with a title under it.
        // Where the row has no Image, a screenshot committed to public/ stands
        // in — resolved here rather than in the card, so the client gets a
        // path and nothing else. His own Image always wins.
        .map((p) => {
            if (p.image && !p.image.includes("placeholder")) return p;
            const local = visualFor(p.slug);
            return local ? { ...p, image: local.image } : p;
        });
    return <ProjectSection projects={projects} />;
}
