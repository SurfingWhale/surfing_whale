// app/components/sections/SkillsSection.tsx
// No percentage bars. A self-scored "Python 90%" is unverifiable and nobody
// reading a portfolio believes it — the honest version of that claim is the
// project underneath it. So this is a list of what I reach for, and the work
// argues for the level.
import { SectionLabel } from "@/app/components/SectionLabel";
import { RowList, Row } from "@/app/components/RowList";

const SKILLS = [
  { group: "Analysis", items: ["Python", "SQL", "pandas", "NumPy", "scikit-learn"] },
  { group: "Visualisation", items: ["Tableau", "Power BI", "Matplotlib", "Seaborn"] },
  { group: "Building", items: ["React", "Next.js", "Firebase", "PostgreSQL", "Git"] },
  { group: "Accounting", items: ["Double-entry", "Financial statements", "Reconciliation", "PPh 21"] },
];

export function SkillsSection() {
  return (
    <section data-spot id="skills" className="w-full py-24 border-t border-border">
      <div className="container mx-auto px-6 max-w-[720px]">
        <SectionLabel note="What I reach for most.">Skills</SectionLabel>

        <RowList>
          {SKILLS.map(({ group, items }) => (
            <Row key={group} label={group}>
              {items.join(" · ")}
            </Row>
          ))}
        </RowList>
      </div>
    </section>
  );
}
