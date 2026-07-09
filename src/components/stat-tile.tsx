export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-px border-2 border-ink bg-ink lg:grid-cols-4">
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="bg-paper p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
        {label}
      </p>
      <p className={`display-num mt-3 ${accent ? "text-red" : ""}`}>{value}</p>
    </div>
  );
}
