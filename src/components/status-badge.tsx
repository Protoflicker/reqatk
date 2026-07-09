import type { StatusPeminjaman } from "@/lib/definitions";

const STYLE: Record<StatusPeminjaman, string> = {
  MENUNGGU: "border-2 border-ink text-ink",
  DISETUJUI: "border-2 border-ink bg-ink text-paper",
  DITOLAK: "border-2 border-red bg-red text-paper",
};

export function StatusBadge({ status }: { status: StatusPeminjaman }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap ${STYLE[status]}`}
    >
      {status}
    </span>
  );
}
