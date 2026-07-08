import type { StatusPeminjaman } from "@/lib/definitions";

const STYLE: Record<StatusPeminjaman, string> = {
  MENUNGGU: "bg-[rgba(221,91,0,0.12)] text-warning border-transparent",
  DISETUJUI: "bg-primary-light text-primary border-transparent",
  DITOLAK: "bg-[rgba(224,62,62,0.12)] text-danger border-transparent",
};

export function StatusBadge({ status }: { status: StatusPeminjaman }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STYLE[status]}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
        status === "MENUNGGU" ? "bg-warning" :
        status === "DISETUJUI" ? "bg-primary" :
        "bg-danger"
      }`}></span>
      {status}
    </span>
  );
}
