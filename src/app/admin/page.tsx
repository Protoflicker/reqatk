import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { AnalyticsChart } from "@/components/analytics-chart";
import { LowStockAlert } from "@/components/low-stock-alert";
import { ArrowRight } from "lucide-react";
import { formatTanggal, type PeminjamanDetail } from "@/lib/definitions";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const sql = db();

  const [statRows, antrean, monthlyData, topItems, statusDist] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*) FROM barang)                                 AS total_barang,
        (SELECT COUNT(*) FROM barang WHERE stok = 0)                  AS stok_habis,
        (SELECT COUNT(*) FROM peminjaman WHERE status = 'MENUNGGU')   AS menunggu,
        (SELECT COUNT(*) FROM peminjaman
         WHERE status = 'DISETUJUI'
           AND to_char(tanggal_pinjam, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
        )                                                             AS disetujui_bulan_ini,
        (SELECT COUNT(*) FROM pengguna)                               AS total_pengguna
    `,
    sql`
      SELECT p.id, p.jumlah, p.keperluan, p.tanggal_pinjam,
             u.nip, u.nama AS nama_pengguna,
             b.kode AS kode_barang, b.nama AS nama_barang, b.satuan, b.stok
      FROM peminjaman p
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
      FROM peminjaman
      WHERE tanggal_pinjam >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', tanggal_pinjam)
      ORDER BY DATE_TRUNC('month', tanggal_pinjam) ASC
    `,
    // Top 10 most requested items
    sql`
      SELECT b.nama, COUNT(*) as total
      FROM peminjaman p
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
      FROM peminjaman
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    `,
  ]);

  const stat = statRows[0] as Record<string, string>;
  const rows = antrean as unknown as (Pick<
    PeminjamanDetail,
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
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          /// Panel Admin
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-tight text-dark md:text-5xl">
          Halo, {session.nama.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-[65ch] text-sm text-text-muted">
          Kondisi inventaris dan antrean permintaan saat ini. Permintaan
          MENUNGGU perlu ditindaklanjuti lewat menu Persetujuan.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="neu-card text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Antrean Menunggu
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-primary">{Number(stat.menunggu)}</p>
        </div>
        <div className="neu-card text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Disetujui Bulan Ini
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-dark">{Number(stat.disetujui_bulan_ini)}</p>
        </div>
        <div className="neu-card text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Jenis Barang
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-dark">{Number(stat.total_barang)}</p>
        </div>
        <div className="neu-card text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Stok Habis
          </p>
          <p className={`mt-3 font-display text-4xl font-bold ${Number(stat.stok_habis) > 0 ? "text-red-600" : "text-dark"}`}>
            {Number(stat.stok_habis)}
          </p>
        </div>
        <div className="neu-card text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Pengguna Terdaftar
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-dark">{Number(stat.total_pengguna)}</p>
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
          <h2 className="font-display text-xl uppercase tracking-tight text-dark">
            Antrean Persetujuan
          </h2>
          <Link href="/admin/peminjaman" className="neu-btn-primary px-6 py-2 text-sm font-bold">
            <ArrowRight className="w-4 h-4" /> Proses Antrean
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Antrean kosong"
            hint="Semua permintaan sudah diproses."
          />
        ) : (
          <div className="neu-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-bg text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Pemohon</th>
                  <th className="pb-3">Barang</th>
                  <th className="pb-3">Jumlah</th>
                  <th className="pb-3">Stok Kini</th>
                  <th className="pb-3">Keperluan</th>
                  <th className="pb-3">Tgl. Pinjam</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-bg last:border-0">
                    <td className="py-3 text-text-muted">#{String(r.id).padStart(4, "0")}</td>
                    <td className="py-3">
                      <span className="font-bold text-dark">{r.nama_pengguna}</span>
                      <br />
                      <span className="text-xs text-text-muted">NIP {r.nip}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-primary">{r.kode_barang}</span>{" "}
                      <span className="text-dark-light">{r.nama_barang}</span>
                    </td>
                    <td className="whitespace-nowrap py-3">
                      {r.jumlah} {r.satuan}
                    </td>
                    <td className={`py-3 ${r.stok < r.jumlah ? "font-bold text-red-600" : ""}`}>
                      {r.stok}
                    </td>
                    <td className="max-w-[28ch] py-3 text-dark-light">{r.keperluan}</td>
                    <td className="whitespace-nowrap py-3">
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
