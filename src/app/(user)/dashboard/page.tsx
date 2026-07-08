import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { UserStatsCard } from "@/components/user-stats-card";
import { ActivityTimeline } from "@/components/activity-timeline";
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

  const [statRows, terbaru, recentActivity, frequentItems] = await Promise.all([
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
    // Recent activity for timeline
    sql`
      SELECT p.id, p.status, p.created_at,
             b.nama AS nama_barang, p.jumlah, b.satuan
      FROM peminjaman p
      JOIN barang b ON b.id = p.barang_id
      WHERE p.pengguna_id = ${session.id}
      ORDER BY p.created_at DESC
      LIMIT 8
    `,
    // Frequently requested items
    sql`
      SELECT b.nama, COUNT(*) as total
      FROM peminjaman p
      JOIN barang b ON b.id = p.barang_id
      WHERE p.pengguna_id = ${session.id}
      GROUP BY b.id, b.nama
      ORDER BY total DESC
      LIMIT 5
    `,
  ]);

  const stat = statRows[0] as Record<string, string>;
  const rows = terbaru as unknown as Pick<
    PeminjamanDetail,
    "id" | "jumlah" | "status" | "tanggal_pinjam" | "kode_barang" | "nama_barang" | "satuan"
  >[];
  
  const activities = recentActivity as unknown as any[];
  const frequent = frequentItems as unknown as { nama: string; total: number }[];

  const namaDepan = session.nama.split(" ")[0];

  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          /// Dasbor Pegawai
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-tight text-dark md:text-5xl">
          Halo, {namaDepan}
        </h1>
        <p className="mt-3 max-w-[65ch] text-sm text-dark-light">
          Ringkasan permintaan alat tulis kantor Anda. Ajukan permintaan baru
          lewat menu Form Peminjaman.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <UserStatsCard icon="⏱" label="Menunggu" value={Number(stat.menunggu)} color="orange" />
        <UserStatsCard icon="✓" label="Disetujui" value={Number(stat.disetujui)} color="green" />
        <UserStatsCard icon="✕" label="Ditolak" value={Number(stat.ditolak)} color="red" />
        <UserStatsCard icon="📊" label="Total" value={Number(stat.total)} color="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Timeline */}
        <div className="neu-card">
          <h2 className="mb-4 font-display text-lg font-bold text-dark">
            📋 Aktivitas Terbaru
          </h2>
          <ActivityTimeline activities={activities} />
        </div>

        {/* Frequently Requested Items */}
        <div className="neu-card">
          <h2 className="mb-4 font-display text-lg font-bold text-dark">
            ⭐ Item Favorit Anda
          </h2>
          {frequent.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">
              Belum ada data
            </p>
          ) : (
            <div className="space-y-3">
              {frequent.map((item, index) => (
                <div key={index} className="neu-raised-sm p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-dark">{item.nama}</p>
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                      {item.total}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl uppercase tracking-tight text-dark">
            Permintaan Terakhir
          </h2>
          <Link href="/peminjaman" className="neu-btn-primary px-6 py-2 text-sm font-bold">
            + Ajukan Permintaan
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Belum ada permintaan"
            hint="Buka menu Form Peminjaman untuk mengajukan permintaan pertama Anda."
          />
        ) : (
          <div className="neu-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-bg text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3">No.</th>
                  <th className="pb-3">Barang</th>
                  <th className="pb-3">Jumlah</th>
                  <th className="pb-3">Tgl. Pinjam</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-bg last:border-0">
                    <td className="py-3 text-text-muted">{String(i + 1).padStart(2, "0")}</td>
                    <td className="py-3">
                      <span className="font-bold text-primary">{r.kode_barang}</span>{" "}
                      <span className="text-dark-light">{r.nama_barang}</span>
                    </td>
                    <td className="py-3">
                      {r.jumlah} {r.satuan}
                    </td>
                    <td className="py-3">{formatTanggal(r.tanggal_pinjam)}</td>
                    <td className="py-3">
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
