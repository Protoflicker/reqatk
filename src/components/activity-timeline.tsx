import { formatTanggal, type PeminjamanDetail } from "@/lib/definitions";

interface Activity extends Pick<PeminjamanDetail, "id" | "status" | "nama_barang" | "jumlah" | "satuan" | "created_at"> {}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DISETUJUI":
        return { icon: "✓", color: "text-green-600 bg-green-100" };
      case "DITOLAK":
        return { icon: "✕", color: "text-red-600 bg-red-100" };
      case "MENUNGGU":
        return { icon: "⏱", color: "text-orange-600 bg-orange-100" };
      default:
        return { icon: "•", color: "text-text-muted bg-bg" };
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
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${statusInfo.color} font-bold`}>
                {statusInfo.icon}
              </div>
              {index < activities.length - 1 && (
                <div className="h-full w-0.5 bg-bg mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="neu-raised-sm flex-1 p-3">
              <p className="text-sm font-bold text-dark">
                {activity.status === "DISETUJUI" && "Permintaan Disetujui"}
                {activity.status === "DITOLAK" && "Permintaan Ditolak"}
                {activity.status === "MENUNGGU" && "Mengajukan Permintaan"}
              </p>
              <p className="mt-1 text-xs text-dark-light">
                {activity.jumlah}x {activity.nama_barang}
              </p>
              <p className="mt-1 text-xs text-text-muted">
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
