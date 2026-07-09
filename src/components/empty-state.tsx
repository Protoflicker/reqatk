export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-bg p-10 text-center">
      <p className="text-sm font-bold text-text">{title}</p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-text-muted">{hint}</p>}
    </div>
  );
}
