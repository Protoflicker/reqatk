import type { StatusPeminjaman } from "@/lib/definitions";

/* Warna chip status per docs/style.md §30 */
const STYLE: Record<StatusPeminjaman, string> = {
  MENUNGGU: "badge-warning",
  DISETUJUI: "badge-primary",
  DITOLAK: "badge-danger",
};

const LABEL: Record<StatusPeminjaman, string> = {
  MENUNGGU: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

const DOT: Record<StatusPeminjaman, string> = {
  MENUNGGU: "bg-warning",
  DISETUJUI: "bg-primary",
  DITOLAK: "bg-danger",
};

export function StatusBadge({ status }: { status: StatusPeminjaman }) {
  return (
    <span className={`badge ${STYLE[status]} whitespace-nowrap`}>
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[status]}`}
      ></span>
      {LABEL[status]}
    </span>
  );
}
