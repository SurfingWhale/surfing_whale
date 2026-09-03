// app/lib/notion.ts
import { PROJECTS_DB } from "./notionIds";

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
    // The merged database added a Status column carrying its own Restricted
    // value. Two properties can now say restricted, and per the rules they are
    // checked independently: either one is enough, and neither outvotes the
    // other. See docs/PUBLISHING-RULES.md §2.
    const status = props.Status?.status?.name ?? "";
    const note = (props["Restriction Note"]?.rich_text ?? [])
        .map((t: any) => t.plain_text)
        .join(" ");

    // The note explains a decision already recorded in Visibility/Status, so
    // it is read for markers but must not be the thing that hides a row —
    // otherwise "cleared: was internal, now rewritten" would withhold forever.
    void note;

    return [title, citation, icon, subGroup, status, ...tags].some(
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

/**
 * The merge renamed the title column from Name to Nama. Reading only one of
 * them turns every project into "Untitled" the moment the database changes
 * shape, and an untitled row still publishes — so read either, and let the
 * rename be a non-event.
 */
function titleOf(page: any): string {
    const props = page?.properties ?? {};
    const t = props.Nama?.title ?? props.Name?.title ?? [];
    return t.map((x: any) => x.plain_text).join("");
}

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
        `https://api.notion.com/v1/databases/${PROJECTS_DB()}/query`,
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
        // One minute, not an hour. Visibility is a safety control, and a
        // safety control you cannot see take effect is one you cannot trust:
        // an hour of "I marked it Restricted, why is it still up?" is exactly
        // the wrong feeling to design in. A portfolio's read volume makes the
        // extra Notion calls free.
        next: { revalidate: 60 },
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
        const name = titleOf(page) || page?.id;
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
        slug: slugify(titleOf(page)) || String(page.id).replace(/-/g, ""),
        title: titleOf(page) || "Untitled",
        // The merged database has a proper URL column; Citation stays as the
        // fallback for rows written before it existed.
        link:
        publicLink(page.properties["URL"]?.url ?? "") ||
        publicLink(page.properties.Citation?.rich_text?.[0]?.plain_text ?? ""),
        tags: page.properties.Tags?.multi_select?.map((t: any) => t.name) ?? [],
        image: publicImage(page.properties.Image?.url ?? ""),
        date: page.properties.Date?.date?.start ?? "",
        subGroup: page.properties["Sub Group"]?.status?.name ?? "",
    }));
    }

    /**
     * A project page has two audiences. The story — what the problem was, what
     * was decided, what it looked like — is the part worth publishing. The
     * technical half is notes to self: schemas, config, setup steps, the
     * occasional credential typed in while thinking out loud. That half was
     * being published too, in full.
     *
     * So a heading splits them. Everything under a Technical heading stays in
     * Notion. The section ends at the next heading of the same or higher level,
     * so Story / Technical / Story works as you would expect.
     */
    const TECHNICAL =
    /^\s*[^\p{L}\p{N}]*\s*(technical|technicality|teknis|backend|implementation|implementasi|setup|environment\s*variabl|env\s*var|config|konfigurasi|credential)/iu;

    const HEADING_LEVEL: Record<string, number> = {
    heading_1: 1,
    heading_2: 2,
    heading_3: 3,
    };

    /**
     * Things that must never reach a public page even when someone put them on
     * the story side by accident — which is exactly how a tracker password
     * ended up live. The heading split is the rule; this is the net under it.
     *
     * Deliberately narrow: it matches names that say credential and prefixes
     * that only ever belong to real tokens, so ordinary prose and code (DAX
     * assignments like `KALENDER =`) pass straight through.
     */
    const SECRETS: RegExp[] = [
    // NOTION_API_KEY=..., DARKROOM_SECRET=..., NOTION_TOKEN=...
    /\b[A-Z][A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL|AUTH|PRIVATE|DSN|DATABASE_ID|API)[A-Z0-9_]*\s*[:=]/,
    // Vendor prefixes that are never anything but a live credential.
    /\b(ntn_|secret_|sk-|ghp_|gho_|github_pat_|AKIA|xox[baprs]-)[A-Za-z0-9_-]{6,}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    // Absolute paths off someone's own machine. A notebook written in place
    // keeps them — "/Users/<name>/Documents/..." — and the username is usually
    // the author's real name. Not a credential, but not the site's to publish,
    // and it tells a reader the layout of a private disk.
    /(?:^|[\s"'`(])(?:\/Users\/|\/home\/|[A-Za-z]:\\+Users\\+)[A-Za-z0-9._-]+[\/\\]/,
    /\bBearer\s+[A-Za-z0-9._-]{12,}/,
    // "input password 123" — Notion strips the backticks, so the value has to
    // be matched on its shape. A nearby token containing a digit, or anything
    // introduced by a colon or equals. Naming a password is not leaking one,
    // so "berbagi satu password" has to pass; "password 123" must not.
    /\b(password|passcode|passwd|sandi)\b[^.\n]{0,20}\b(?=[A-Za-z!@#$%^&*_-]*\d)[A-Za-z0-9!@#$%^&*_-]{3,40}\b/i,
    /\b(password|passcode|passwd|sandi)\b\s*[:=]\s*\S{3,}/i,
    ];

    /**
     * The handle rule applies to prose too, not just image URLs. A project page
     * links its own repo, and one of them writes the personal account into a
     * sentence — text no image allowlist would ever see.
     *
     * Same shape as IMAGE_HOSTS: name the account whose repos may be linked,
     * and every other owner is withheld. Allowlisting what is public means
     * never writing down what is private, so the handle stays out of this file
     * and out of the source map built from it. A third-party repo mentioned in
     * a story is caught too — widen this list rather than loosening the rule.
     */
    const REPO_OWNERS = ["SurfingWhale"];

    const FOREIGN_REPO = new RegExp(
    `(?:github\\.com/(?!(?:${REPO_OWNERS.join("|")})\\b)[A-Za-z0-9_.-]+` +
        `|\\b(?!(?:${REPO_OWNERS.join("|")})\\b)[A-Za-z0-9_-]+\\.github\\.io)`,
    "i"
    );

    const carriesSecret = (b: NotionBlock) => {
    const text = `${b.text ?? ""} ${b.caption ?? ""} ${b.url ?? ""}`;
    return FOREIGN_REPO.test(text) || SECRETS.some((re) => re.test(text));
    };

    export interface PageContent {
    blocks: NotionBlock[];
    /** How many blocks were held back, so the page can say so rather than
        just looking short. */
    withheld: number;
    }

    export function storyOnly(blocks: NotionBlock[]): PageContent {
    const out: NotionBlock[] = [];
    let holdingAt = 0;
    let withheld = 0;

    for (const b of blocks) {
        const level = HEADING_LEVEL[b.type] ?? 0;

        if (level) {
        // A heading at or above the held section's level ends it.
        if (holdingAt && level <= holdingAt) holdingAt = 0;
        if (!holdingAt && TECHNICAL.test(b.text ?? "")) {
            holdingAt = level;
            withheld++;
            continue;
        }
        }

        if (holdingAt || carriesSecret(b)) {
        withheld++;
        continue;
        }
        out.push(b);
    }

    return { blocks: out, withheld };
    }

    export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    const res = await fetch(
        `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
        {
        headers: {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
        },
        // One minute, not an hour. Visibility is a safety control, and a
        // safety control you cannot see take effect is one you cannot trust:
        // an hour of "I marked it Restricted, why is it still up?" is exactly
        // the wrong feeling to design in. A portfolio's read volume makes the
        // extra Notion calls free.
        next: { revalidate: 60 },
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
