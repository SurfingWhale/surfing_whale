// app/lib/notion.ts
/**
 * Anything that marks a row as not-for-publication. The site reads a Notion
 * database a person edits by hand, so "is this publishable?" cannot rest on
 * one tag being right — a row marked restricted in any of the ways a person
 * would naturally mark it must never reach the site.
 *
 * Checked against the title, the icon, every tag, and the Citation field.
 */
const RESTRICTED =
    /🔒|🚫|\brestricted\b|\bconfidential\b|\binternal[\s-]*(only|use)?\b|\bprivate\b|\brahasia\b|\binternal\b|\bnda\b|jangan\s+di[\s-]*publish|do\s+not\s+publish|not\s+for\s+publication/i;

/**
 * True if the row carries any not-for-publication marker. Fails closed: an
 * unreadable page counts as restricted, because the cost of hiding one
 * publishable project is nothing next to the cost of showing one that is not.
 */
export function isRestricted(page: any): boolean {
    try {
    // Optional chaining never throws, so an unreadable page would otherwise
    // slip through as "no markers found". A row the code cannot read is a row
    // whose markers the code cannot read.
    const props = page?.properties;
    if (!props || typeof props !== "object") return true;

    const title = props.Name?.title?.[0]?.plain_text ?? "";
    const citation = (props.Citation?.rich_text ?? [])
        .map((t: any) => t.plain_text)
        .join(" ");
    const tags: string[] = props.Tags?.multi_select?.map((t: any) => t.name) ?? [];
    const icon =
        page?.icon?.emoji ?? page?.icon?.external?.url ?? page?.icon?.file?.url ?? "";
    const subGroup = props["Sub Group"]?.status?.name ?? "";

    return [title, citation, icon, subGroup, ...tags].some(
        (v) => typeof v === "string" && RESTRICTED.test(v)
    );
    } catch {
    return true;
    }
    }

    /**
     * Citation holds a link on most rows, but it is a free-text field, so it
     * also holds notes. Rendering a note as an href produced a live anchor whose
     * address was the words "INTERNAL / RESTRICTED".
     */
    function publicLink(raw: string): string {
    const v = raw.trim();
    return /^https?:\/\//i.test(v) ? v : "";
    }

    /**
     * Image is a free-text URL field too, and whatever it holds becomes an
     * <img src> — a request the visitor's browser makes, to whatever host is
     * named. One row points at a personal GitHub Pages domain, which would put
     * that hostname in the network tab of everyone who loaded the page.
     *
     * So: an allowlist of hosts the site is willing to make a visitor call.
     * Everything else falls back to the placeholder. Naming the hosts we trust
     * needs no list of the hosts we do not, which keeps the private domain out
     * of this file and out of the source map built from it.
     */
    const IMAGE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

    function publicImage(raw: string): string {
    const v = (raw ?? "").trim();
    if (!v) return PLACEHOLDER;
    if (v.startsWith("/")) return v; // served by this site
    try {
        const { protocol, hostname } = new URL(v);
        if (protocol !== "https:") return PLACEHOLDER;
        return IMAGE_HOSTS.includes(hostname) ? v : PLACEHOLDER;
    } catch {
        return PLACEHOLDER;
    }
    }

    const PLACEHOLDER = "/images/placeholder.png";

/**
 * The one property that decides publication. Visibility must say Public — a
 * blank stays off the site, so a row nobody has classified yet is hidden by
 * default rather than published by default. That is the whole point: the
 * previous design published anything tagged #Finished and left "should this be
 * public?" to be inferred from prose the code never read.
 */
const PUBLIC = "Public";

export interface NotionProject {
    id: string;
    /** Derived from the title, not stored in Notion — the shareable URL. */
    slug: string;
    title: string;
    link: string;
    tags: string[];
    image: string;
    date: string;
    subGroup: string;
    }

    /**
     * The page id is a UUID, which makes an ugly link and leaks the Notion
     * page. Titles are short and unique enough in one portfolio, so the slug
     * comes from there; a title that slugs to nothing falls back to the id.
     */
    export function slugify(title: string): string {
    const slug = title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    return slug || "";
    }

    export interface NotionBlock {
    type: string;
    text?: string;
    language?: string; // for code blocks
    url?: string;      // for images
    caption?: string;
    }

    export async function getProjects(): Promise<NotionProject[]> {
    const res = await fetch(
        `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
        {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            filter: {
            property: "Tags",
            multi_select: { contains: "#Finished" },
            },
        }),
        next: { revalidate: 3600 },
        }
    );
    if (!res.ok) {
        console.error("Notion API error:", await res.text());
        return [];
    }
    const data = await res.json();
    const rows: any[] = data.results ?? [];

    // The tag says "this is finished". It does not say "this may be published",
    // and a row can be both finished and confidential.
    const publishable = rows.filter((page) => {
        const name = page?.properties?.Name?.title?.[0]?.plain_text ?? page?.id;
        const visibility = page?.properties?.Visibility?.select?.name ?? "";

        if (visibility !== PUBLIC) {
        console.warn(
            `Withheld "${name}": Visibility is ${visibility || "unset"}, not ${PUBLIC}`
        );
        return false;
        }
        // Belt and braces. Visibility is the gate; the text markers stay as a
        // second net, because a row can be marked Public by mistake and the
        // padlock in its title is then the last thing standing.
        if (isRestricted(page)) {
        console.warn(`Withheld "${name}": marked Public but carries a restriction marker`);
        return false;
        }
        return true;
    });

    return publishable.map((page: any) => ({
        id: page.id,
        slug:
        slugify(page.properties.Name?.title?.[0]?.plain_text ?? "") ||
        String(page.id).replace(/-/g, ""),
        title: page.properties.Name?.title?.[0]?.plain_text ?? "Untitled",
        link: publicLink(page.properties.Citation?.rich_text?.[0]?.plain_text ?? ""),
        tags: page.properties.Tags?.multi_select?.map((t: any) => t.name) ?? [],
        image: publicImage(page.properties.Image?.url ?? ""),
        date: page.properties.Date?.date?.start ?? "",
        subGroup: page.properties["Sub Group"]?.status?.name ?? "",
    }));
    }

    export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    const res = await fetch(
        `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
        {
        headers: {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
        },
        next: { revalidate: 3600 },
        }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return data.results.map((block: any): NotionBlock => {
        const type = block.type;

        // Extract plain text from rich_text array
        const extractText = (richText: any[]) =>
        richText?.map((t: any) => t.plain_text).join("") ?? "";

        switch (type) {
        case "paragraph":
            return { type: "paragraph", text: extractText(block.paragraph?.rich_text) };
        case "heading_1":
            return { type: "heading_1", text: extractText(block.heading_1?.rich_text) };
        case "heading_2":
            return { type: "heading_2", text: extractText(block.heading_2?.rich_text) };
        case "heading_3":
            return { type: "heading_3", text: extractText(block.heading_3?.rich_text) };
        case "bulleted_list_item":
            return { type: "bulleted_list_item", text: extractText(block.bulleted_list_item?.rich_text) };
        case "numbered_list_item":
            return { type: "numbered_list_item", text: extractText(block.numbered_list_item?.rich_text) };
        case "code":
            return {
            type: "code",
            text: extractText(block.code?.rich_text),
            language: block.code?.language ?? "plaintext",
            };
        case "image":
            return {
            type: "image",
            url: block.image?.file?.url ?? block.image?.external?.url ?? "",
            caption: extractText(block.image?.caption),
            };
        case "divider":
            return { type: "divider" };
        case "quote":
            return { type: "quote", text: extractText(block.quote?.rich_text) };
        default:
            return { type: "unsupported" };
        }
    }).filter((b: NotionBlock) => b.type !== "unsupported");
    }
/** Resolves a shareable slug back to the project it names. */
export async function getProjectBySlug(
  slug: string
): Promise<NotionProject | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

/**
 * The page ids the site is allowed to render. Anything asking for blocks has to
 * name an id on this list — without it, the blocks route was an open proxy to
 * every page the integration could read, restricted rows included.
 */
export async function isPublishableId(pageId: string): Promise<boolean> {
  const id = pageId.replace(/-/g, "");
  const projects = await getProjects();
  return projects.some((p) => p.id.replace(/-/g, "") === id);
}
