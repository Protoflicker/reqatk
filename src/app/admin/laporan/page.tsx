import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  formatTanggal,
  STATUS_LIST,
  type PeminjamanDetail,
  type StatusPeminjaman,
} from "@/lib/definitions";

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
        description="Rekapitulasi seluruh transaksi peminjaman ATK dari semua pegawai. Saring berdasarkan status atau bulan, lalu unduh sebagai PDF atau CSV."
      />

      <form
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-3 border-2 border-ink p-4"
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
            <option value="">SEMUA STATUS</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
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
            className="input w-48"
          />
        </div>
        <button type="submit" className="btn">
          Terapkan
        </button>
        <div className="ml-auto flex gap-2">
          <a
            href={`/admin/laporan/export-excel?${exportQuery.toString()}`}
            className="btn btn-solid"
          >
            📊 Unduh Excel
          </a>
          <a
            href={`/admin/laporan/export-pdf?${exportQuery.toString()}`}
            className="btn btn-solid"
          >
            Unduh PDF
          </a>
          <a
            href={`/admin/laporan/export?${exportQuery.toString()}`}
            className="btn"
          >
            Unduh CSV
          </a>
        </div>
      </form>

      <div className="mb-6 grid grid-cols-3 gap-px border-2 border-ink bg-ink">
        {STATUS_LIST.map((s) => (
          <div key={s} className="bg-paper p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink/70">
              {s}
            </p>
            <p className="mt-1 font-display text-2xl">{ringkas[s]}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada data"
          hint="Tidak ada transaksi yang cocok dengan saringan saat ini."
        />
      ) : (
        <div className="overflow-x-auto border-2 border-ink">
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
                  <td className="text-ink/60">#{String(r.id).padStart(4, "0")}</td>
                  <td className="font-bold">{r.nama_pengguna}</td>
                  <td className="whitespace-nowrap text-[11px]">{r.nip}</td>
                  <td>
                    <span className="font-bold">{r.kode_barang}</span>{" "}
                    {r.nama_barang}
                  </td>
                  <td className="whitespace-nowrap">
                    {r.jumlah} {r.satuan}
                  </td>
                  <td className="max-w-[24ch]">{r.keperluan}</td>
                  <td className="whitespace-nowrap">
                    {formatTanggal(r.tanggal_pinjam)}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[20ch] text-ink/80">
                    {r.catatan_admin ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-ink/60">
        Total {rows.length} transaksi ditampilkan
        {bulanFilter ? ` /// periode ${bulanFilter}` : ""}
        {statusFilter ? ` /// status ${statusFilter}` : ""}
      </p>
    </>
  );
}
