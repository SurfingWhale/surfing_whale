"use client";
// app/components/Projectmodal.tsx

import { useEffect, useState } from "react";
import type { NotionBlock, NotionProject } from "@/app/lib/notion";
import { useAccess } from "@/app/components/AccessGate";
import { ReadMoreGate } from "@/app/components/ReadMoreGate";
import { BlockRenderer, FREE_BLOCKS } from "@/app/components/ProjectBlocks";

interface Props {
    project: NotionProject | null;
    onClose: () => void;
    }

    export function ProjectModal({ project, onClose }: Props) {
    const [blocks, setBlocks] = useState<NotionBlock[]>([]);
    // The server cuts the page short when the gate is on, so whether there is
    // more to read is its answer to give, not something to infer from a count.
    const [truncated, setTruncated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const { unlocked } = useAccess();

    useEffect(() => {
        if (!project) return;
        setBlocks([]);
        setTruncated(false);
        setCopied(false);
        setLoading(true);
        fetch(`/api/notion/${project.id}`)
        .then((r) => r.json())
        .then((data) => {
            setBlocks(data.blocks ?? []);
            setTruncated(Boolean(data.truncated));
        })
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
                <h2 className="text-[13px] font-medium tracking-[-0.02em] truncate">
                {project.title}
                </h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                {project.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 border border-border rounded-full text-fg-secondary">
                    {tag}
                    </span>
                ))}
                </div>
            </div>
            <button
                onClick={onClose}
                aria-label="Close"
                className="text-[13px] text-fg-secondary hover:text-fg transition-colors flex-shrink-0 mt-1"
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

            <div className="px-6 py-4 border-b border-border flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200"
            >
                Open project →
            </a>
            {/* A panel has no URL of its own, so sharing one meant sharing the
                homepage and saying "scroll, then click the third folder". */}
            <a
                href={`/work/p/${project.slug}`}
                className="text-[13px] text-fg-body hover:text-fg transition-colors duration-300"
            >
                Its own page ↗
            </a>
            <button
                type="button"
                onClick={() => {
                navigator.clipboard
                    ?.writeText(`${window.location.origin}/work/p/${project.slug}`)
                    .then(() => setCopied(true))
                    .catch(() => setCopied(false));
                }}
                className="text-[13px] text-fg-body hover:text-fg transition-colors duration-300"
            >
                {copied ? "Link copied" : "Copy link"}
            </button>
            </div>

            <div className="px-6 py-6 flex-1">
            {loading ? (
                <p className="text-[13px] text-fg-muted py-8 text-center animate-pulse">
                Loading…
                </p>
            ) : blocks.length === 0 ? (
                <p className="text-[13px] text-fg-muted py-8 text-center">
                No content available.
                </p>
            ) : (
                <div>
                {(unlocked ? blocks : blocks.slice(0, FREE_BLOCKS)).map((block, i) => (
                    <BlockRenderer key={i} block={block} />
                ))}
                {!unlocked && (truncated || blocks.length > FREE_BLOCKS) && (
                    <ReadMoreGate reason="Project" />
                )}
                </div>
            )}
            </div>
        </div>
        </>
    );
}
