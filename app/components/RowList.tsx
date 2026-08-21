// app/components/RowList.tsx
// The page already lists projects as ruled rows rather than cards. Skills and
// activity are lists too, so they use the same object instead of inventing a
// third container.
export function RowList({ children }: { children: React.ReactNode }) {
  return <ul className="border-t border-border">{children}</ul>;
}

export function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b border-border py-5 grid gap-1.5 sm:grid-cols-[132px_1fr] sm:gap-6">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label sm:pt-[5px]">
        {label}
      </span>
      <span className="text-[13px] leading-[2] text-fg">{children}</span>
    </li>
  );
}
