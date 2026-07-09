export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="border-2 border-dashed border-ink/40 p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/70">
        // {title}
      </p>
      {hint && <p className="mt-2 text-xs text-ink/60">{hint}</p>}
    </div>
  );
}
