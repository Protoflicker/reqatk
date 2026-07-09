import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color?: "primary" | "green" | "orange" | "red";
}

export function UserStatsCard({ icon, label, value, color = "primary" }: StatsCardProps) {
  const colorClasses = {
    primary: "text-primary",
    green: "text-green-600",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <div className="neu-card text-center">
      <div className={`inline-flex ${colorClasses[color]}`}>{icon}</div>
      <p className="mt-3 font-display text-3xl font-bold text-dark">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}
