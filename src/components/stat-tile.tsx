export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
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
    <div className={`sesd-stat ${accent ? "is-danger" : ""}`}>
      <p className="sesd-stat-num">{value}</p>
      <p className="sesd-stat-label">{label}</p>
    </div>
  );
}
