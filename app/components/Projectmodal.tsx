"use client";
// app/components/Projectmodal.tsx

import { useEffect, useState } from "react";
import type { NotionBlock, NotionProject } from "@/app/lib/notion";

interface Props {
    project: NotionProject | null;
    onClose: () => void;
    }

    function BlockRenderer({ block }: { block: NotionBlock }) {
    switch (block.type) {
        case "heading_1":
        return <h3 className="text-xl font-semibold tracking-[-0.02em] mt-8 mb-2">{block.text}</h3>;
        case "heading_2":
        return <h4 className="text-lg font-semibold tracking-[-0.02em] mt-6 mb-2">{block.text}</h4>;
        case "heading_3":
        return <h5 className="text-base font-medium mt-5 mb-1">{block.text}</h5>;
        case "paragraph":
        return block.text
            ? <p className="text-fg-secondary text-sm leading-relaxed mb-4">{block.text}</p>
            : <div className="mb-3" />;
        case "bulleted_list_item":
        return (
            <div className="flex gap-3 mb-2">
            <span className="text-fg-muted mt-0.5 flex-shrink-0">•</span>
            <p className="text-fg-secondary text-sm leading-relaxed">{block.text}</p>
            </div>
        );
        case "numbered_list_item":
        return (
            <div className="flex gap-3 mb-2">
            <span className="text-fg-muted text-sm flex-shrink-0">–</span>
            <p className="text-fg-secondary text-sm leading-relaxed">{block.text}</p>
            </div>
        );
        case "code":
        return (
            <div className="my-4 rounded-lg overflow-hidden border border-border">
            <div className="bg-bg-muted px-3 py-1.5">
                <span className="font-mono text-xs text-fg-muted">{block.language}</span>
            </div>
            <pre className="p-4 overflow-x-auto bg-bg-subtle">
                <code className="font-mono text-xs text-fg leading-relaxed whitespace-pre">
                {block.text}
                </code>
            </pre>
            </div>
        );
        case "quote":
        return (
            <blockquote className="border-l-2 border-border-strong pl-4 my-4">
            <p className="text-fg-secondary text-sm italic leading-relaxed">{block.text}</p>
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
                <p className="text-fg-muted text-xs text-center mt-2">{block.caption}</p>
            )}
            </div>
        );
        case "divider":
        return <hr className="border-border my-6" />;
        default:
        return null;
    }
    }

    export function ProjectModal({ project, onClose }: Props) {
    const [blocks, setBlocks] = useState<NotionBlock[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!project) return;
        setBlocks([]);
        setLoading(true);
        fetch(`/api/notion/${project.id}`)
        .then((r) => r.json())
        .then((data) => setBlocks(data.blocks ?? []))
        .catch(() => setBlocks([]))
        .finally(() => setLoading(false));
    }, [project]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Lock body scroll
    useEffect(() => {
        if (project) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [project]);

    if (!project) return null;

    return (
        <>
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        />

        <div className="fixed top-0 right-0 z-50 h-full w-full max-w-xl bg-bg border-l border-border overflow-y-auto flex flex-col">

            <div className="sticky top-0 bg-bg/95 backdrop-blur-md border-b border-border px-6 py-4 flex items-start justify-between gap-4 z-10">
            <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold tracking-[-0.02em] truncate">
                {project.title}
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                {project.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 border border-border rounded-full text-fg-secondary">
                    {tag}
                    </span>
                ))}
                </div>
            </div>
            <button
                onClick={onClose}
                aria-label="Close"
                className="text-sm text-fg-secondary hover:text-fg transition-colors flex-shrink-0 mt-1"
            >
                Close
            </button>
            </div>

            {project.image && !project.image.includes("placeholder") && (
            <div className="aspect-video w-full overflow-hidden bg-bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
                />
            </div>
            )}

            <div className="px-6 py-4 border-b border-border">
            <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center text-sm font-medium py-3 rounded-lg bg-fg text-bg hover:opacity-85 transition-opacity duration-300"
            >
                Open project
            </a>
            </div>

            <div className="px-6 py-6 flex-1">
            {loading ? (
                <p className="text-sm text-fg-muted py-8 text-center animate-pulse">
                Loading…
                </p>
            ) : blocks.length === 0 ? (
                <p className="text-sm text-fg-muted py-8 text-center">
                No content available.
                </p>
            ) : (
                <div>
                {blocks.map((block, i) => (
                    <BlockRenderer key={i} block={block} />
                ))}
                </div>
            )}
            </div>
        </div>
        </>
    );
}
