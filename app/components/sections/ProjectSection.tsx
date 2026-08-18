"use client";
// app/components/sections/ProjectSection.tsx
// The Three.js particle backdrop was archived alongside Spline — see PRD v2 §6.

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { NotionProject } from "@/app/lib/notion";
import { ProjectModal } from "@/app/components/Projectmodal";

interface Props { projects: NotionProject[]; }

export function ProjectSection({ projects }: Props) {
    const [selectedProject, setSelectedProject] = useState<NotionProject | null>(null);

    return (
        <section className="w-full py-24 border-t border-border">
        <div id="project" className="container mx-auto px-6 max-w-[1120px]">
            <div className="flex items-end justify-between mb-10">
            <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em]">
                Selected work
                </h2>
                <p className="text-sm text-fg-secondary mt-1">
                Things I have built and shipped.
                </p>
            </div>
            <span className="text-sm text-fg-muted hidden md:block">
                {projects.length} projects
            </span>
            </div>

            {projects.length === 0 ? (
            <p className="text-fg-muted text-center py-16 text-sm">
                No projects found.
            </p>
            ) : (
            <>
                <Swiper
                modules={[Navigation, Pagination]}
                navigation={{ nextEl: ".swiper-next", prevEl: ".swiper-prev" }}
                pagination={{ clickable: true }}
                spaceBetween={24}
                slidesPerView={1}
                breakpoints={{ 768: { slidesPerView: 2 } }}
                className="!pb-12"
                >
                {projects.map((project) => (
                    <SwiperSlide key={project.id}>
                    <div
                        className="group block cursor-pointer"
                        onClick={() => setSelectedProject(project)}
                    >
                        <div className="relative overflow-hidden rounded-lg border border-border aspect-video bg-bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={project.image}
                            alt={project.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        </div>
                        <div className="mt-4">
                        <h3 className="text-base font-medium tracking-tight">
                            {project.title}
                        </h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {project.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-0.5 border border-border rounded-full text-fg-secondary"
                            >
                                {tag}
                            </span>
                            ))}
                        </div>
                        </div>
                    </div>
                    </SwiperSlide>
                ))}
                </Swiper>
                <div className="flex gap-3 justify-end mt-2">
                <button className="swiper-prev text-sm border border-border rounded-lg text-fg-secondary px-4 py-2 hover:border-border-strong hover:text-fg transition-colors duration-300">
                    ← Prev
                </button>
                <button className="swiper-next text-sm border border-border rounded-lg text-fg-secondary px-4 py-2 hover:border-border-strong hover:text-fg transition-colors duration-300">
                    Next →
                </button>
                </div>
            </>
            )}
        </div>

        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
        </section>
    );
}
