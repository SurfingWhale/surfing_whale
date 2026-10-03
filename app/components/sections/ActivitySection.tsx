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

// The one notebook this used to name (EDA & Prediction of Los Angeles Crime)
// was taken down on Kaggle, so its link went to a 404. The list of notebooks
// is the one address that stays true whatever is published there next.
const KAGGLE_NOTEBOOKS = "https://www.kaggle.com/muhammadfauzy43/code";

const link =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200";

export function ActivitySection() {
  return (
    <section data-spot data-weight="minor" id="activity" className="w-full py-24 border-t border-border section-rule">
      <div data-reveal className="frame frame-split">
        <SectionLabel note="Published notebooks.">Activity</SectionLabel>

        <RowList>
          <Row label="Kaggle">
            <a
              href={KAGGLE_NOTEBOOKS}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link} block`}
            >
              Notebooks on Kaggle →
            </a>
          </Row>
        </RowList>
      </div>
    </section>
  );
}
