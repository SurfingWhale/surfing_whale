// app/components/sections/ProjectSectionWrapper.tsx
// Server Component — the Notion fetch happens here.

import { getProjects } from "@/app/lib/notion";
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
    const projects = (await getProjects()).filter(
        (p) =>
            !FEATURED.test(p.title) &&
            !FEATURED.test(p.link) &&
            !WRITTEN_UP.test(p.title)
    );
    return <ProjectSection projects={projects} />;
}
