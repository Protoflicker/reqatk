import { Icon, type IconName } from "./icon";

interface StatsCardProps {
  icon: IconName;
  label: string;
  value: number;
  color?: "primary" | "success" | "warning" | "danger";
}

const TONE: Record<NonNullable<StatsCardProps["color"]>, string> = {
  primary: "",
  success: "is-success",
  warning: "is-warning",
  danger: "is-danger",
};

export function UserStatsCard({
  icon,
  label,
  value,
  color = "primary",
}: StatsCardProps) {
  return (
    <div className={`sesd-stat ${TONE[color]}`}>
      <div className="flex items-center justify-between">
        <p className="sesd-stat-num">{value}</p>
        <Icon name={icon} className="text-lg text-text-muted" />
      </div>
      <p className="sesd-stat-label">{label}</p>
    </div>
  );
}
