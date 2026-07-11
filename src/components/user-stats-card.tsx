import { Icon, type IconName } from "./icon";

interface StatsCardProps {
  icon: IconName;
  label: string;
  value: number;
  subtitle?: string;
  color?: "primary" | "success" | "warning" | "danger";
}

const COLOR_MAP: Record<
  NonNullable<StatsCardProps["color"]>,
  { bg: string; gradient: string }
> = {
  primary: {
    bg: "bg-[#2563eb]",
    gradient: "from-[#2563eb] to-[#1e40af]",
  },
  success: {
    bg: "bg-[#16a34a]",
    gradient: "from-[#16a34a] to-[#15803d]",
  },
  warning: {
    bg: "bg-[#ea580c]",
    gradient: "from-[#ea580c] to-[#c2410c]",
  },
  danger: {
    bg: "bg-[#dc2626]",
    gradient: "from-[#dc2626] to-[#b91c1c]",
  },
};

export function UserStatsCard({
  icon,
  label,
  value,
  subtitle,
  color = "primary",
}: StatsCardProps) {
  const tone = COLOR_MAP[color];

  return (
    <div className="flex overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:shadow-md">
      {/* Colored icon panel */}
      <div
        className={`flex w-14 shrink-0 items-center justify-center bg-gradient-to-b ${tone.gradient}`}
      >
        <Icon name={icon} className="text-xl text-white" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center px-4 py-3">
        <p className="text-[0.65rem] font-extrabold uppercase tracking-widest text-text-muted">
          {label}
        </p>
        <p className="text-2xl font-extrabold leading-tight tracking-tight text-text tnum">
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-[0.7rem] text-text-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
