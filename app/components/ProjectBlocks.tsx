// app/components/ProjectBlocks.tsx
// One renderer for a Notion page's blocks, used by the slide-over modal and by
// the project's own page. They were the same markup twice; a link people share
// must not drift from the panel it was copied out of.
import type { NotionBlock } from "@/app/lib/notion";

// Enough of the story to judge whether it is worth asking for — the opening
// heading and the paragraphs under it, not a teaser line.
export const FREE_BLOCKS = 4;

export function BlockRenderer({ block }: { block: NotionBlock }) {
    switch (block.type) {
        case "heading_1":
        return <h3 className="text-[15px] font-medium tracking-[-0.02em] mt-8 mb-2">{block.text}</h3>;
        case "heading_2":
        return <h4 className="text-[13px] font-medium tracking-[-0.02em] mt-6 mb-2">{block.text}</h4>;
        case "heading_3":
        return <h5 className="text-[13px] font-medium mt-5 mb-1">{block.text}</h5>;
        case "paragraph":
        return block.text
            ? <p className="text-fg-secondary text-[13px] leading-[2] mb-4">{block.text}</p>
            : <div className="mb-3" />;
        case "bulleted_list_item":
        return (
            <div className="flex gap-3 mb-2">
            <span className="text-fg-muted mt-0.5 flex-shrink-0">•</span>
            <p className="text-fg-secondary text-[13px] leading-[2]">{block.text}</p>
            </div>
        );
        case "numbered_list_item":
        return (
            <div className="flex gap-3 mb-2">
            <span className="text-fg-muted text-[13px] flex-shrink-0">–</span>
            <p className="text-fg-secondary text-[13px] leading-[2]">{block.text}</p>
            </div>
        );
        case "code":
        return (
            <div className="my-4 rounded-lg overflow-hidden border border-border">
            <div className="bg-bg-muted px-3 py-1.5">
                <span className="font-mono text-[11px] text-fg-muted">{block.language}</span>
            </div>
            <pre className="p-4 overflow-x-auto bg-bg-subtle">
                <code className="font-mono text-[11px] text-fg leading-[1.7] whitespace-pre">
                {block.text}
                </code>
            </pre>
            </div>
        );
        case "quote":
        return (
            <blockquote className="border-l-2 border-border-strong pl-4 my-4">
            <p className="text-fg-secondary text-[13px] italic leading-[2]">{block.text}</p>
            </blockquote>
        );
        case "image":
        return (
            <div className="my-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={block.url}
                alt={block.caption ?? ""}
                className="w-full rounded-lg border border-border object-cover"
            />
            {block.caption && (
                <p className="text-fg-muted text-[11px] text-center mt-2">{block.caption}</p>
            )}
            </div>
        );
        case "divider":
        return <hr className="border-border my-6" />;
        default:
        return null;
    }
    }
