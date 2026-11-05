// app/components/ProjectNotes.tsx
//
// The working notes behind a case study, read out of the Notion row that the
// written page replaced.
//
// A SERVER COMPONENT, and it has to stay one. PUBLISHING-RULES §6: the cut
// happens on the server, always. Sending the whole row and hiding half of it
// in CSS is not a gate — anyone who opens the network tab reads straight past
// it. getProjectNotes applies the same three-condition gate the published
// index applies and then runs storyOnly, so what reaches this component is
// already only the publishable half.
//
// It renders NOTHING when there is nothing cleared to show: no row, a row that
// fails the gate, no NOTION_API_KEY, Notion unreachable, or an empty result
// after the split. A page without notes has to look like a page that never had
// them, not like a page with a broken section in it.
import { getProjectNotes } from "@/app/lib/notion";
import { BlockRenderer } from "@/app/components/ProjectBlocks";
import { ReadSection } from "@/app/components/Read";

export async function ProjectNotes({
  path,
  number,
  title = "The notes behind it",
}: {
  /** This page's own path, e.g. "/work/padel". */
  path: string;
  /** The section number to continue the page's sequence with. */
  number: string;
  title?: string;
}) {
  const notes = await getProjectNotes(path);
  if (!notes) return null;

  return (
    <ReadSection number={number} title={title}>
      <p>
        The page above is the finished argument. This is the workbench behind
        it — the Notion row this study was written from, still open, read
        straight out of the workspace rather than copied here by hand.
      </p>
      <div className="mt-6">
        {notes.blocks.map((b, i) => (
          <BlockRenderer key={`${b.type}-${i}`} block={b} />
        ))}
      </div>
      {notes.withheld > 0 && (
        // Saying how much was held back rather than letting the section just
        // look short. The number is the one storyOnly already counts, for
        // exactly this.
        <p className="mt-6 text-[11px] leading-[1.7] text-fg-muted">
          {notes.withheld} {notes.withheld === 1 ? "block is" : "blocks are"}{" "}
          held back: everything under a Technical heading, and anything shaped
          like a credential wherever it was written.
        </p>
      )}
    </ReadSection>
  );
}
