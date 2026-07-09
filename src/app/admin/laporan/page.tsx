import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import {
  formatTanggal,
  STATUS_LIST,
  type PeminjamanDetail,
  type StatusPeminjaman,
} from "@/lib/definitions";

const STAT_TONE: Record<StatusPeminjaman, string> = {
  MENUNGGU: "is-warning",
  DISETUJUI: "",
  DITOLAK: "is-danger",
};

const STAT_LABEL: Record<StatusPeminjaman, string> = {
  MENUNGGU: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

export default async function AdminLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; bulan?: string }>;
}) {
  const params = await searchParams;

  const statusFilter = STATUS_LIST.includes(params.status as StatusPeminjaman)
    ? (params.status as StatusPeminjaman)
    : null;
  const bulanFilter = /^\d{4}-\d{2}$/.test(params.bulan ?? "")
    ? (params.bulan as string)
    : null;

  const sql = db();
  const rows = (await sql`
    SELECT p.id, p.jumlah, p.keperluan, p.status, p.tanggal_pinjam,
           p.catatan_admin,
           u.nip, u.nama AS nama_pengguna,
           b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
    FROM peminjaman p
    JOIN pengguna u ON u.id = p.pengguna_id
    JOIN barang b   ON b.id = p.barang_id
    WHERE (${statusFilter}::text IS NULL OR p.status = ${statusFilter})
      AND (${bulanFilter}::text IS NULL
           OR to_char(p.tanggal_pinjam, 'YYYY-MM') = ${bulanFilter})
    ORDER BY p.created_at DESC
  `) as unknown as PeminjamanDetail[];

  const ringkas = {
    MENUNGGU: 0,
    DISETUJUI: 0,
    DITOLAK: 0,
  } as Record<StatusPeminjaman, number>;
  for (const r of rows) ringkas[r.status] += 1;

  const exportQuery = new URLSearchParams();
  if (statusFilter) exportQuery.set("status", statusFilter);
  if (bulanFilter) exportQuery.set("bulan", bulanFilter);

  return (
    <>
      <PageHeader
        title="Laporan Peminjaman"
        description="Rekapitulasi seluruh transaksi peminjaman ATK dari semua pegawai. Saring berdasarkan status atau bulan, lalu unduh sebagai PDF, Excel, atau CSV."
      />

      <form
        method="GET"
        className="neu-card mb-6 flex flex-wrap items-end gap-3 hover:transform-none"
      >
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="input w-48"
          >
            <option value="">Semua status</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {STAT_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bulan" className="label">
            Bulan Pinjam
          </label>
          <input
            id="bulan"
            name="bulan"
            type="month"
            defaultValue={bulanFilter ?? ""}
            className="input w-48 font-mono"
          />
        </div>
        <button type="submit" className="btn">
          Terapkan
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <a
            href={`/admin/laporan/export-excel?${exportQuery.toString()}`}
            className="btn"
          >
            <Icon name="download" />
            Excel
          </a>
          <a
            href={`/admin/laporan/export-pdf?${exportQuery.toString()}`}
            className="btn"
          >
            <Icon name="file" />
            PDF
          </a>
          <a
            href={`/admin/laporan/export?${exportQuery.toString()}`}
            className="btn"
          >
            <Icon name="download" />
            CSV
          </a>
        </div>
      </form>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {STATUS_LIST.map((s) => (
          <div key={s} className={`sesd-stat ${STAT_TONE[s]}`}>
            <p className="sesd-stat-num">{ringkas[s]}</p>
            <p className="sesd-stat-label">{STAT_LABEL[s]}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada data"
          hint="Tidak ada transaksi yang cocok dengan saringan saat ini."
        />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pemohon</th>
                <th>NIP</th>
                <th>Barang</th>
                <th>Jumlah</th>
                <th>Keperluan</th>
                <th>Tgl. Pinjam</th>
                <th>Status</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs text-text-muted">
                    #{String(r.id).padStart(4, "0")}
                  </td>
                  <td className="font-semibold">{r.nama_pengguna}</td>
                  <td className="whitespace-nowrap font-mono text-xs">
                    {r.nip}
                  </td>
                  <td>
                    <span className="font-mono text-[13px] font-semibold">
                      {r.kode_barang}
                    </span>{" "}
                    {r.nama_barang}
                  </td>
                  <td className="whitespace-nowrap tnum">
                    {r.jumlah} {r.satuan}
                  </td>
                  <td className="max-w-[24ch]">{r.keperluan}</td>
                  <td className="whitespace-nowrap font-mono text-xs">
                    {formatTanggal(r.tanggal_pinjam)}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[20ch] text-text-muted">
                    {r.catatan_admin ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="helper mt-3">
        Total {rows.length} transaksi ditampilkan
        {bulanFilter ? ` · periode ${bulanFilter}` : ""}
        {statusFilter ? ` · status ${STAT_LABEL[statusFilter]}` : ""}
      </p>
    </>
  );
}
