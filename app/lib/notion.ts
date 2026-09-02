// app/lib/notion.ts
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
    return data.results.map((page: any) => ({
        id: page.id,
        slug:
        slugify(page.properties.Name?.title?.[0]?.plain_text ?? "") ||
        String(page.id).replace(/-/g, ""),
        title: page.properties.Name?.title?.[0]?.plain_text ?? "Untitled",
        link: page.properties.Citation?.rich_text?.[0]?.plain_text ?? "#",
        tags: page.properties.Tags?.multi_select?.map((t: any) => t.name) ?? [],
        image: page.properties.Image?.url ?? "/images/placeholder.png",
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
