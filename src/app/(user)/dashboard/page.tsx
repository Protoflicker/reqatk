import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { UserStatsCard } from "@/components/user-stats-card";
import { ActivityTimeline } from "@/components/activity-timeline";
import { Icon } from "@/components/icon";
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
      <header className="sesd-greet animate-fade-up mb-8">
        <p className="sesd-greet-eyebrow">Dasbor Pegawai · PINJAM/ATK</p>
        <h1 className="sesd-greet-title">Halo, {namaDepan}</h1>
        <p className="sesd-greet-sub">
          Ringkasan permintaan alat tulis kantor Anda. Ajukan permintaan baru
          lewat menu Form Peminjaman.
        </p>
        <span className="sesd-greet-role">User — pegawai terdaftar</span>
      </header>

      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <UserStatsCard icon="clock" label="Menunggu" value={Number(stat.menunggu)} subtitle="Menunggu approve" color="warning" />
        <UserStatsCard icon="check" label="Disetujui" value={Number(stat.disetujui)} subtitle="Sudah disetujui" color="success" />
        <UserStatsCard icon="x" label="Ditolak" value={Number(stat.ditolak)} subtitle="Permintaan ditolak" color="danger" />
        <UserStatsCard icon="chart" label="Total" value={Number(stat.total)} subtitle="Semua permintaan" color="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Timeline */}
        <div className="neu-card hover:transform-none">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-text">
            <Icon name="clock" className="text-primary" />
            Aktivitas Terbaru
          </h2>
          <ActivityTimeline activities={activities} />
        </div>

        {/* Frequently Requested Items */}
        <div className="neu-card hover:transform-none">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-text">
            <Icon name="star" className="text-primary" />
            Item Favorit Anda
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
                    <p className="font-semibold text-text">{item.nama}</p>
                    <span className="badge badge-primary tnum">
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
          <h2 className="font-display text-xl font-extrabold tracking-tight text-text">
            Permintaan Terakhir
          </h2>
          <Link href="/peminjaman" className="neu-btn-primary px-6 py-2 text-sm font-bold">
            <Icon name="plus" />
            Ajukan Permintaan
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Belum ada permintaan"
            hint="Buka menu Form Peminjaman untuk mengajukan permintaan pertama Anda."
          />
        ) : (
          <div className="tbl-wrap">
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
                    <td className="font-mono text-xs text-text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td>
                      <span className="font-mono text-[13px] font-semibold">
                        {r.kode_barang}
                      </span>{" "}
                      {r.nama_barang}
                    </td>
                    <td className="tnum">
                      {r.jumlah} {r.satuan}
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs">
                      {formatTanggal(r.tanggal_pinjam)}
                    </td>
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
