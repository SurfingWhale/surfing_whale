// app/components/sections/ProjectSectionWrapper.tsx
// Server Component — the Notion fetch happens here.

import { getProjects } from "@/app/lib/notion";
import { ProjectSection } from "./ProjectSection";

// The finance dashboard is the featured case study above the list. It is also
// a row in the Notion database, so without this it appeared twice on one
// screen under two different names for the same thing.
const FEATURED = /finance dashboard|personal dashboard/i;

export default async function ProjectSectionWrapper() {
    const projects = (await getProjects()).filter(
        (p) => !FEATURED.test(p.title) && !FEATURED.test(p.link)
    );
    return <ProjectSection projects={projects} />;
}
