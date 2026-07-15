import type { StatusPermintaan } from "@/lib/definitions";

/* Warna chip status per docs/style.md §30 */
const STYLE: Record<StatusPermintaan, string> = {
  MENUNGGU: "badge-warning",
  DISETUJUI: "badge-primary",
  DITOLAK: "badge-danger",
};

const LABEL: Record<StatusPermintaan, string> = {
  MENUNGGU: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

const DOT: Record<StatusPermintaan, string> = {
  MENUNGGU: "bg-warning",
  DISETUJUI: "bg-primary",
  DITOLAK: "bg-danger",
};

export function StatusBadge({ status }: { status: StatusPermintaan }) {
  return (
    <span className={`badge ${STYLE[status]} whitespace-nowrap`}>
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[status]}`}
      ></span>
      {LABEL[status]}
    </span>
  );
}
