// app/components/sections/ActivitySection.tsx
// This section used to draw a six-month GitHub contribution heatmap. Every
// square in it came out of Math.random(), with a tooltip stating a date and a
// commit count that had never happened — a real graph needs an OAuth token,
// and the placeholder was never replaced. Fabricated numbers do not belong on
// a portfolio, so the graph is gone rather than restyled.
//
// The GitHub row is gone too, at Fauzy's request — that handle is his
// creative account and he does not want it linked from here. Note that the
// removed row also carried a client-side fetch to api.github.com/users/<handle>,
// which put the handle in the network tab of anyone who opened devtools;
// hiding the link without removing the fetch would have hidden nothing.
"use client";

import { SectionLabel } from "@/app/components/SectionLabel";
import { RowList, Row } from "@/app/components/RowList";

const KAGGLE_USERNAME = "muhammadfauzy43";

const KAGGLE_NOTEBOOKS = [
  {
    title: "EDA & Prediction of Los Angeles Crime",
    url: "https://www.kaggle.com/code/muhammadfauzy43/eda-prediction-of-los-angeles-crime-by-edit",
  },
];

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200";

export function ActivitySection() {
  return (
    <section data-spot id="activity" className="w-full py-16 sm:py-24 border-t border-border">
      <div data-reveal className="container mx-auto px-6 max-w-[720px]">
        <SectionLabel note="Published notebooks.">Activity</SectionLabel>

        <RowList>
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
