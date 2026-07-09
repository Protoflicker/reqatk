import { type PeminjamanDetail } from "@/lib/definitions";
import { Icon, type IconName } from "./icon";

type Activity = Pick<
  PeminjamanDetail,
  "id" | "status" | "nama_barang" | "jumlah" | "satuan" | "created_at"
>;

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getStatusIcon = (
    status: string
  ): { icon: IconName; color: string } => {
    switch (status) {
      case "DISETUJUI":
        return { icon: "check", color: "text-success bg-[rgba(26,174,57,0.13)]" };
      case "DITOLAK":
        return { icon: "x", color: "text-danger bg-[rgba(224,62,62,0.12)]" };
      case "MENUNGGU":
        return { icon: "clock", color: "text-warning bg-[rgba(221,91,0,0.12)]" };
      default:
        return { icon: "file", color: "text-text-muted bg-bg-mid" };
    }
  };

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        Belum ada aktivitas
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const statusInfo = getStatusIcon(activity.status);
        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${statusInfo.color}`}
              >
                <Icon name={statusInfo.icon} />
              </div>
              {index < activities.length - 1 && (
                <div className="mt-2 h-full w-px bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="neu-raised-sm flex-1 p-3">
              <p className="text-sm font-bold text-text">
                {activity.status === "DISETUJUI" && "Permintaan Disetujui"}
                {activity.status === "DITOLAK" && "Permintaan Ditolak"}
                {activity.status === "MENUNGGU" && "Mengajukan Permintaan"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {activity.jumlah}x {activity.nama_barang}
              </p>
              <p className="mt-1 font-mono text-[11px] text-text-muted">
                {new Date(activity.created_at).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
