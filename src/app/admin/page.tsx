import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { AnalyticsChart } from "@/components/analytics-chart";
import { LowStockAlert } from "@/components/low-stock-alert";
import { formatTanggal, type PermintaanDetail } from "@/lib/definitions";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const sql = db();

  const [statRows, antrean, monthlyData, topItems, statusDist] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*) FROM barang)                                 AS total_barang,
        (SELECT COUNT(*) FROM barang WHERE stok = 0)                  AS stok_habis,
        (SELECT COUNT(*) FROM permintaan WHERE status = 'MENUNGGU')   AS menunggu,
        (SELECT COUNT(*) FROM permintaan
         WHERE status = 'DISETUJUI'
           AND to_char(tanggal_pinjam, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
        )                                                             AS disetujui_bulan_ini,
        (SELECT COUNT(*) FROM pengguna)                               AS total_pengguna
    `,
    sql`
      SELECT p.id, p.jumlah, p.keperluan, p.tanggal_pinjam,
             u.nip, u.nama AS nama_pengguna,
             b.kode AS kode_barang, b.nama AS nama_barang, b.satuan, b.stok
      FROM permintaan p
      JOIN pengguna u ON u.id = p.pengguna_id
      JOIN barang b   ON b.id = p.barang_id
      WHERE p.status = 'MENUNGGU'
      ORDER BY p.created_at ASC
      LIMIT 5
    `,
    // Monthly trend for last 6 months
    sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', tanggal_pinjam), 'Mon YYYY') as month,
        COUNT(*) FILTER (WHERE status = 'DISETUJUI') as approved,
        COUNT(*) FILTER (WHERE status = 'MENUNGGU') as pending,
        COUNT(*) FILTER (WHERE status = 'DITOLAK') as rejected
      FROM permintaan
      WHERE tanggal_pinjam >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', tanggal_pinjam)
      ORDER BY DATE_TRUNC('month', tanggal_pinjam) ASC
    `,
    // Top 10 most requested items
    sql`
      SELECT b.nama, COUNT(*) as total
      FROM permintaan p
      JOIN barang b ON b.id = p.barang_id
      WHERE p.created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY b.id, b.nama
      ORDER BY total DESC
      LIMIT 10
    `,
    // Status distribution
    sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'DISETUJUI') as approved,
        COUNT(*) FILTER (WHERE status = 'MENUNGGU') as pending,
        COUNT(*) FILTER (WHERE status = 'DITOLAK') as rejected
      FROM permintaan
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    `,
  ]);

  const stat = statRows[0] as Record<string, string>;
  const rows = antrean as unknown as (Pick<
    PermintaanDetail,
    | "id"
    | "jumlah"
    | "keperluan"
    | "tanggal_pinjam"
    | "nip"
    | "nama_pengguna"
    | "kode_barang"
    | "nama_barang"
    | "satuan"
  > & { stok: number })[];

  const chartData = {
    monthlyData: monthlyData as { month: string; approved: number; pending: number; rejected: number }[],
    topItems: topItems as { nama: string; total: number }[],
    statusDistribution: statusDist[0] as { approved: number; pending: number; rejected: number },
  };

  return (
    <>
      <header className="sesd-greet animate-fade-up mb-8">
        <p className="sesd-greet-eyebrow">Panel Admin · PINJAM/ATK</p>
        <h1 className="sesd-greet-title">
          Halo, {session.nama.split(" ")[0]}
        </h1>
        <p className="sesd-greet-sub">
          Kondisi inventaris dan antrean permintaan saat ini. Permintaan
          berstatus Menunggu perlu ditindaklanjuti lewat menu Persetujuan.
        </p>
        <span className="sesd-greet-role">Admin — pengelola sistem</span>
      </header>

      {/* Stats Grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="sesd-stat">
          <p className="sesd-stat-num">{Number(stat.menunggu)}</p>
          <p className="sesd-stat-label">Antrean Menunggu</p>
        </div>
        <div className="sesd-stat is-success">
          <p className="sesd-stat-num">{Number(stat.disetujui_bulan_ini)}</p>
          <p className="sesd-stat-label">Disetujui Bulan Ini</p>
        </div>
        <div className="sesd-stat is-neutral">
          <p className="sesd-stat-num">{Number(stat.total_barang)}</p>
          <p className="sesd-stat-label">Jenis Barang</p>
        </div>
        <div
          className={`sesd-stat ${Number(stat.stok_habis) > 0 ? "is-danger" : "is-neutral"}`}
        >
          <p className="sesd-stat-num">{Number(stat.stok_habis)}</p>
          <p className="sesd-stat-label">Stok Habis</p>
        </div>
        <div className="sesd-stat is-neutral">
          <p className="sesd-stat-num">{Number(stat.total_pengguna)}</p>
          <p className="sesd-stat-label">Pengguna Terdaftar</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="mb-10">
        <AnalyticsChart
          monthlyData={chartData.monthlyData}
          topItems={chartData.topItems}
          statusDistribution={chartData.statusDistribution}
        />
      </div>
      
      {/* Low Stock Alert */}
      <div className="mb-10">
        <LowStockAlert />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-text">
            Antrean Persetujuan
          </h2>
          <Link href="/admin/permintaan" className="neu-btn-primary px-6 py-2 text-sm font-bold">
            Proses Antrean
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Antrean kosong"
            hint="Semua permintaan sudah diproses."
          />
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pemohon</th>
                  <th>Barang</th>
                  <th>Jumlah</th>
                  <th>Stok Kini</th>
                  <th>Keperluan</th>
                  <th>Tgl. Pinjam</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-text-muted">
                      #{String(r.id).padStart(4, "0")}
                    </td>
                    <td>
                      <span className="font-semibold">{r.nama_pengguna}</span>
                      <br />
                      <span className="font-mono text-xs text-text-muted">{r.nip}</span>
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
                    <td
                      className={`tnum ${r.stok < r.jumlah ? "font-bold text-danger" : ""}`}
                    >
                      {r.stok}
                    </td>
                    <td className="max-w-[28ch]">{r.keperluan}</td>
                    <td className="whitespace-nowrap font-mono text-xs">
                      {formatTanggal(r.tanggal_pinjam)}
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
