// app/components/sections/ProjectSectionWrapper.tsx
// Server Component — the Notion fetch happens here.

import { getProjects } from "@/app/lib/notion";
import { visualFor } from "@/app/lib/projectVisuals";
import { ProjectSection } from "./ProjectSection";

// The de-duplication used to live here, as two regular expressions on the
// title. It has moved into SUPERSEDED in app/lib/notion.ts, keyed by slug,
// because a pattern only covers the rows somebody remembered: "SalesPAL"
// matched neither expression, and the coffee study is filed under "Kopi,
// Komuter, dan Komunitas", which shares no word with "coffee-access". Both
// were publishing twice. It also belongs there rather than here, so that a
// superseded row loses its /work/p/<slug> page as well as its card.

export default async function ProjectSectionWrapper() {
    const projects = (await getProjects())
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
