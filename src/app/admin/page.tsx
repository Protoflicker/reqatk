import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { StatGrid, StatTile } from "@/components/stat-tile";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal, type PeminjamanDetail } from "@/lib/definitions";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const sql = db();

  const [statRows, antrean] = await Promise.all([
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

  return (
    <>
      <header className="mb-8 border-b-4 border-ink pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red">
          /// Panel Admin
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[0.95] tracking-tight md:text-5xl">
          Halo, {session.nama.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-[65ch] text-sm text-ink/80">
          Kondisi inventaris dan antrean permintaan saat ini. Permintaan
          MENUNGGU perlu ditindaklanjuti lewat menu Persetujuan.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-px border-2 border-ink bg-ink md:grid-cols-5">
        <div className="bg-paper p-4 md:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
            Antrean Menunggu
          </p>
          <p className="display-num mt-3 text-red">{Number(stat.menunggu)}</p>
        </div>
        <div className="bg-paper p-4 md:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
            Disetujui Bulan Ini
          </p>
          <p className="display-num mt-3">{Number(stat.disetujui_bulan_ini)}</p>
        </div>
        <div className="bg-paper p-4 md:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
            Jenis Barang
          </p>
          <p className="display-num mt-3">{Number(stat.total_barang)}</p>
        </div>
        <div className="bg-paper p-4 md:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
            Stok Habis
          </p>
          <p className={`display-num mt-3 ${Number(stat.stok_habis) > 0 ? "text-red" : ""}`}>
            {Number(stat.stok_habis)}
          </p>
        </div>
        <div className="bg-paper p-4 md:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
            Pengguna Terdaftar
          </p>
          <p className="display-num mt-3">{Number(stat.total_pengguna)}</p>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl uppercase tracking-tight">
            Antrean Persetujuan
          </h2>
          <Link href="/admin/peminjaman" className="btn btn-solid">
            Proses Antrean &gt;&gt;&gt;
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Antrean kosong"
            hint="Semua permintaan sudah diproses."
          />
        ) : (
          <div className="overflow-x-auto border-2 border-ink">
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
                    <td className="text-ink/60">#{String(r.id).padStart(4, "0")}</td>
                    <td>
                      <span className="font-bold">{r.nama_pengguna}</span>
                      <br />
                      <span className="text-[11px] text-ink/60">NIP {r.nip}</span>
                    </td>
                    <td>
                      <span className="font-bold">{r.kode_barang}</span>{" "}
                      {r.nama_barang}
                    </td>
                    <td className="whitespace-nowrap">
                      {r.jumlah} {r.satuan}
                    </td>
                    <td className={r.stok < r.jumlah ? "font-bold text-red" : ""}>
                      {r.stok}
                    </td>
                    <td className="max-w-[28ch]">{r.keperluan}</td>
                    <td className="whitespace-nowrap">
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
