// app/components/sections/ActivitySection.tsx
// This section used to draw a six-month GitHub contribution heatmap. Every
// square in it came out of Math.random(), with a tooltip stating a date and a
// commit count that had never happened — a real graph needs an OAuth token,
// and the placeholder was never replaced. Fabricated numbers do not belong on
// a portfolio, so the graph is gone rather than restyled. The repository count
// below is read live from the public GitHub API, which needs no token.
"use client";

import { useEffect, useState } from "react";
import { SectionLabel } from "@/app/components/SectionLabel";
import { RowList, Row } from "@/app/components/RowList";

const GITHUB_USERNAME = "Untamed98x";
const KAGGLE_USERNAME = "muhammadfauzy43";

const KAGGLE_NOTEBOOKS = [
  {
    title: "EDA & Prediction of Los Angeles Crime",
    url: "https://www.kaggle.com/code/muhammadfauzy43/eda-prediction-of-los-angeles-crime-by-edit",
  },
];

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200";

function useRepoCount() {
  const [repos, setRepos] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // Rate limiting and outages are normal here; the row simply omits the
        // count rather than showing a zero that would read as a real figure.
        if (live && typeof d?.public_repos === "number") setRepos(d.public_repos);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return repos;
}

export function ActivitySection() {
  const repos = useRepoCount();

  return (
    <section data-spot id="activity" className="w-full py-24 border-t border-border">
      <div className="container mx-auto px-6 max-w-[720px]">
        <SectionLabel note="Where I work in the open.">Activity</SectionLabel>

        <RowList>
          <Row label="GitHub">
            <a
              href={`https://github.com/${GITHUB_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              @{GITHUB_USERNAME}
            </a>
            {repos !== null && (
              <span className="text-fg-body">
                {" "}
                — {repos} public repositories
              </span>
            )}
          </Row>

          <Row label="Kaggle">
            {KAGGLE_NOTEBOOKS.map((n) => (
              <a
                key={n.url}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link} block`}
              >
                {n.title}
              </a>
            ))}
            <a
              href={`https://www.kaggle.com/${KAGGLE_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-fg-body hover:text-fg transition-colors duration-300"
            >
              All notebooks →
            </a>
          </Row>
        </RowList>
      </div>
    </section>
  );
}
