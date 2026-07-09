import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { StatGrid, StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  formatTanggal,
  type PeminjamanDetail,
  type StatusPeminjaman,
} from "@/lib/definitions";

export default async function DashboardPage() {
  const session = await requireSession();
  const sql = db();

  const [statRows, terbaru] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'MENUNGGU')  AS menunggu,
        COUNT(*) FILTER (WHERE status = 'DISETUJUI') AS disetujui,
        COUNT(*) FILTER (WHERE status = 'DITOLAK')   AS ditolak,
        COUNT(*)                                     AS total
      FROM peminjaman
      WHERE pengguna_id = ${session.id}
    `,
    sql`
      SELECT p.id, p.jumlah, p.status, p.tanggal_pinjam,
             b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
      FROM peminjaman p
      JOIN barang b ON b.id = p.barang_id
      WHERE p.pengguna_id = ${session.id}
      ORDER BY p.created_at DESC
      LIMIT 5
    `,
  ]);

  const stat = statRows[0] as Record<string, string>;
  const rows = terbaru as unknown as Pick<
    PeminjamanDetail,
    "id" | "jumlah" | "status" | "tanggal_pinjam" | "kode_barang" | "nama_barang" | "satuan"
  >[];

  const namaDepan = session.nama.split(" ")[0];

  return (
    <>
      <header className="mb-8 border-b-4 border-ink pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red">
          /// Dasbor Pegawai
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[0.95] tracking-tight md:text-5xl">
          Halo, {namaDepan}
        </h1>
        <p className="mt-3 max-w-[65ch] text-sm text-ink/80">
          Ringkasan permintaan alat tulis kantor Anda. Ajukan permintaan baru
          lewat menu Form Peminjaman.
        </p>
      </header>

      <StatGrid>
        <StatTile label="Menunggu Persetujuan" value={Number(stat.menunggu)} accent />
        <StatTile label="Disetujui" value={Number(stat.disetujui)} />
        <StatTile label="Ditolak" value={Number(stat.ditolak)} />
        <StatTile label="Total Permintaan" value={Number(stat.total)} />
      </StatGrid>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl uppercase tracking-tight">
            Permintaan Terakhir
          </h2>
          <Link href="/peminjaman" className="btn btn-solid">
            + Ajukan Permintaan
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Belum ada permintaan"
            hint="Buka menu Form Peminjaman untuk mengajukan permintaan pertama Anda."
          />
        ) : (
          <div className="overflow-x-auto border-2 border-ink">
            <table className="tbl">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Barang</th>
                  <th>Jumlah</th>
                  <th>Tgl. Pinjam</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="text-ink/60">{String(i + 1).padStart(2, "0")}</td>
                    <td>
                      <span className="font-bold">{r.kode_barang}</span>{" "}
                      {r.nama_barang}
                    </td>
                    <td>
                      {r.jumlah} {r.satuan}
                    </td>
                    <td>{formatTanggal(r.tanggal_pinjam)}</td>
                    <td>
                      <StatusBadge status={r.status as StatusPeminjaman} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
