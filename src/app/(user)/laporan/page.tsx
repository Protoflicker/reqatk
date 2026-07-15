import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import {
  formatTanggal,
  STATUS_LIST,
  type PermintaanDetail,
  type StatusPermintaan,
} from "@/lib/definitions";

export default async function LaporanUserPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ok?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const statusFilter = STATUS_LIST.includes(params.status as StatusPermintaan)
    ? (params.status as StatusPermintaan)
    : null;

  const sql = db();
  const rows = (await sql`
    SELECT p.id, p.jumlah, p.keperluan, p.status, p.tanggal_pinjam,
           p.catatan_admin,
           b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
    FROM permintaan p
    JOIN barang b ON b.id = p.barang_id
    WHERE p.pengguna_id = ${session.id}
      AND (${statusFilter}::text IS NULL OR p.status = ${statusFilter})
    ORDER BY p.created_at DESC
  `) as unknown as PermintaanDetail[];

  const exportQuery = new URLSearchParams();
  if (statusFilter) exportQuery.set("status", statusFilter);

  return (
    <>
      <PageHeader
        title="Laporan Permintaan"
        description="Riwayat seluruh permintaan alat tulis kantor Anda beserta statusnya."
      />

      {params.ok === "diajukan" && (
        <Alert variant="success">
          Permintaan berhasil diajukan. Statusnya Menunggu sampai diverifikasi
          admin.
        </Alert>
      )}

      <form
        method="GET"
        className="neu-card mb-6 flex flex-wrap items-end gap-3 hover:transform-none"
      >
        <div>
          <label htmlFor="status" className="label">
            Saring Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="input w-52"
          >
            <option value="">Semua status</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn">
          Terapkan
        </button>
        <div className="ml-auto flex gap-2">
          <a
            href={`/laporan/export-excel?${exportQuery.toString()}`}
            className="btn"
          >
            <Icon name="download" />
            Unduh Excel
          </a>
          <a
            href={`/laporan/export-pdf?${exportQuery.toString()}`}
            className="btn"
          >
            <Icon name="file" />
            Unduh PDF
          </a>
        </div>
      </form>

      <p className="mb-4 text-xs font-semibold text-text-muted">
        {rows.length} catatan
        {statusFilter
          ? ` · status ${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()}`
          : ""}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada catatan"
          hint={
            statusFilter
              ? `Tidak ada permintaan berstatus ${statusFilter.toLowerCase()}.`
              : "Anda belum pernah mengajukan permintaan."
          }
        />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Barang</th>
                <th>Jumlah</th>
                <th>Keperluan</th>
                <th>Tgl. Pinjam</th>
                <th>Status</th>
                <th>Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs text-text-muted">
                    #{String(r.id).padStart(4, "0")}
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
                  <td className="max-w-[28ch]">{r.keperluan}</td>
                  <td className="whitespace-nowrap font-mono text-xs">
                    {formatTanggal(r.tanggal_pinjam)}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[24ch] text-text-muted">
                    {r.catatan_admin ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
