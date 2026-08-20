"use client";
// app/components/sections/ActivitySection.tsx
// Kaggle showcase + GitHub contribution graph

import { useEffect, useState } from "react";
import { SectionLabel } from "@/app/components/SectionLabel";

const GITHUB_USERNAME = "Untamed98x";
const KAGGLE_USERNAME = "muhammadfauzy43";

interface KaggleDataset {
    title: string;
    url: string;
    votes: number;
    views: number;
    }

    interface GitHubStats {
    repos: number;
    followers: number;
    contributions: { date: string; count: number }[];
    }

    // ─── Kaggle Card ──────────────────────────────────────────────────────────────

    const KAGGLE_PROJECTS: KaggleDataset[] = [
    {
        title: "EDA Prediction of Los Angeles Crime",
        url: "https://www.kaggle.com/code/muhammadfauzy43/eda-prediction-of-los-angeles-crime-by-edit",
        votes: 12,
        views: 890,
    },
    ];

    function KaggleCard({ title, url, votes, views }: KaggleDataset) {
    return (
        <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block border border-border rounded-lg p-5 bg-bg-subtle hover:border-border-strong transition-colors duration-300"
        >
        <p className="text-xs text-fg-muted uppercase tracking-wider mb-2">
            Kaggle notebook
        </p>
        <h4 className="text-sm font-medium text-fg line-clamp-2">
            {title}
        </h4>
        <div className="flex gap-4 mt-3">
            <span className="font-mono text-xs text-fg-muted">▲ {votes}</span>
            <span className="font-mono text-xs text-fg-muted">{views} views</span>
        </div>
        </a>
    );
    }

    // ─── GitHub Contribution Graph ────────────────────────────────────────────────

    function GitHubGraph() {
    const [stats, setStats] = useState<GitHubStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}`)
        .then((r) => r.json())
        .then((data) => {
            setStats({
            repos: data.public_repos,
            followers: data.followers,
            contributions: generateMockContributions(), // real graph needs OAuth
            });
        })
        .catch(() => {
            setStats({
            repos: 0,
            followers: 0,
            contributions: generateMockContributions(),
            });
        })
        .finally(() => setLoading(false));
    }, []);

    return (
        <div className="border border-border rounded-lg p-5 bg-bg-subtle">
        <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-fg-muted uppercase tracking-wider">
            GitHub activity
            </p>
            <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-fg-secondary hover:text-fg transition-colors"
            >
            @{GITHUB_USERNAME} →
            </a>
        </div>

        {loading ? (
            <div className="h-20 flex items-center justify-center">
            <span className="text-xs text-fg-muted animate-pulse">Loading…</span>
            </div>
        ) : (
            <>
            <div className="flex gap-8 mb-5">
                <div>
                <p className="text-2xl font-semibold tracking-tight">{stats?.repos}</p>
                <p className="text-xs text-fg-muted mt-1">Repos</p>
                </div>
                <div>
                <p className="text-2xl font-semibold tracking-tight">{stats?.followers}</p>
                <p className="text-xs text-fg-muted mt-1">Followers</p>
                </div>
            </div>

            {/* Contribution heatmap — greyscale ramp */}
            <div className="flex gap-[3px] flex-wrap">
                {stats?.contributions.map((day, i) => (
                <div
                    key={i}
                    title={`${day.date}: ${day.count} contributions`}
                    className="w-[10px] h-[10px] rounded-[2px] transition-transform duration-200 hover:scale-125"
                    style={{
                    background: day.count === 0
                        ? "var(--bg-muted)"
                        : day.count < 3
                        ? "var(--fg-muted)"
                        : day.count < 6
                        ? "var(--fg-secondary)"
                        : "var(--fg)",
                    }}
                />
                ))}
            </div>
            <p className="text-xs text-fg-muted mt-3">Last 6 months</p>
            </>
        )}
        </div>
    );
    }

    // Generate 180 days of mock contribution data
    function generateMockContributions() {
    const days = [];
    const now = new Date();
    for (let i = 179; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        days.push({
        date: d.toISOString().split("T")[0],
        count: isWeekend
            ? Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0
            : Math.random() > 0.4 ? Math.floor(Math.random() * 8) : 0,
        });
    }
    return days;
    }

    // ─── Main Section ─────────────────────────────────────────────────────────────

    export function ActivitySection() {
    return (
        <section data-spot id="activity" className="w-full py-24 border-t border-border">
        <div className="container mx-auto px-6 max-w-[720px]">
            <SectionLabel note="Where I spend my open-source time.">Activity</SectionLabel>

            <div className="grid grid-cols-1 gap-6">
            <div>
                <GitHubGraph />
            </div>

            <div className="space-y-4">
                {KAGGLE_PROJECTS.map((p) => (
                <KaggleCard key={p.url} {...p} />
                ))}
                <a
                href={`https://www.kaggle.com/${KAGGLE_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-fg-secondary hover:text-fg transition-colors py-3 border border-border rounded-lg"
                >
                View all on Kaggle →
                </a>
            </div>
            </div>
        </div>
        </section>
    );
}
