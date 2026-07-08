import { db } from "@/lib/db";
import { setujuiPeminjaman, tolakPeminjaman } from "@/lib/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";
import { formatTanggal, type PeminjamanDetail } from "@/lib/definitions";

type BarisAntrean = Pick<
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
> & { stok: number };

type BarisRiwayat = Pick<
  PeminjamanDetail,
  | "id"
  | "jumlah"
  | "status"
  | "tanggal_pinjam"
  | "catatan_admin"
  | "nama_pengguna"
  | "kode_barang"
  | "nama_barang"
  | "satuan"
>;

export default async function AdminPeminjamanPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const params = await searchParams;
  const sql = db();

  const [menunggu, riwayat] = await Promise.all([
    sql`
      SELECT p.id, p.jumlah, p.keperluan, p.tanggal_pinjam,
             u.nip, u.nama AS nama_pengguna,
             b.kode AS kode_barang, b.nama AS nama_barang, b.satuan, b.stok
      FROM peminjaman p
      JOIN pengguna u ON u.id = p.pengguna_id
      JOIN barang b   ON b.id = p.barang_id
      WHERE p.status = 'MENUNGGU'
      ORDER BY p.created_at ASC
    `,
    sql`
      SELECT p.id, p.jumlah, p.status, p.tanggal_pinjam, p.catatan_admin,
             u.nama AS nama_pengguna,
             b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
      FROM peminjaman p
      JOIN pengguna u ON u.id = p.pengguna_id
      JOIN barang b   ON b.id = p.barang_id
      WHERE p.status IN ('DISETUJUI', 'DITOLAK')
      ORDER BY p.updated_at DESC
      LIMIT 10
    `,
  ]);

  const antrean = menunggu as unknown as BarisAntrean[];
  const keputusan = riwayat as unknown as BarisRiwayat[];

  return (
    <>
      <PageHeader
        title="Persetujuan"
        description="Proses permintaan masuk: setujui (stok langsung berkurang) atau tolak dengan catatan. Keputusan bersifat final — tidak ada alur pengembalian."
      />

      {params.err === "stok" && (
        <Alert variant="error">
          Permintaan tidak dapat disetujui — stok barang tidak mencukupi.
          Perbarui stok lewat tombol +/− di menu Daftar Barang.
        </Alert>
      )}

      {/* ===== Antrean menunggu ===== */}
      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl uppercase tracking-tight">
          Menunggu Persetujuan{" "}
          <span className={antrean.length > 0 ? "text-red" : "text-ink/50"}>
            ({antrean.length})
          </span>
        </h2>

        {antrean.length === 0 ? (
          <EmptyState
            title="Antrean kosong"
            hint="Tidak ada permintaan yang menunggu persetujuan."
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
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {antrean.map((r) => (
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
                      {r.stok < r.jumlah && (
                        <span className="block text-[10px] font-bold uppercase text-red">
                          Kurang
                        </span>
                      )}
                    </td>
                    <td className="max-w-[24ch]">{r.keperluan}</td>
                    <td className="whitespace-nowrap">
                      {formatTanggal(r.tanggal_pinjam)}
                    </td>
                    <td>
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <form action={setujuiPeminjaman.bind(null, r.id)}>
                          <button
                            type="submit"
                            className="btn btn-solid w-full justify-center px-2 py-1"
                          >
                            Setujui
                          </button>
                        </form>
                        <form
                          action={tolakPeminjaman.bind(null, r.id)}
                          className="flex gap-1"
                        >
                          <label htmlFor={`catatan-${r.id}`} className="sr-only">
                            Catatan penolakan
                          </label>
                          <input
                            id={`catatan-${r.id}`}
                            name="catatan"
                            type="text"
                            placeholder="catatan (opsional)"
                            className="input px-2 py-1 text-xs"
                          />
                          <button type="submit" className="btn btn-danger px-2 py-1">
                            Tolak
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== Keputusan terakhir ===== */}
      <section>
        <h2 className="mb-4 font-display text-xl uppercase tracking-tight">
          Keputusan Terakhir <span className="text-ink/50">({keputusan.length})</span>
        </h2>

        {keputusan.length === 0 ? (
          <EmptyState
            title="Belum ada keputusan"
            hint="Permintaan yang disetujui atau ditolak akan tampil di sini."
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
                  <th>Tgl. Pinjam</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {keputusan.map((r) => (
                  <tr key={r.id}>
                    <td className="text-ink/60">#{String(r.id).padStart(4, "0")}</td>
                    <td className="font-bold">{r.nama_pengguna}</td>
                    <td>
                      <span className="font-bold">{r.kode_barang}</span>{" "}
                      {r.nama_barang}
                    </td>
                    <td className="whitespace-nowrap">
                      {r.jumlah} {r.satuan}
                    </td>
                    <td className="whitespace-nowrap">
                      {formatTanggal(r.tanggal_pinjam)}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="max-w-[24ch] text-ink/80">
                      {r.catatan_admin ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-ink/60">
          Riwayat lengkap tersedia di menu Laporan Peminjaman
        </p>
      </section>
    </>
  );
}
