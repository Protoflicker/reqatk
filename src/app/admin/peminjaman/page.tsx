import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Alert } from "@/components/alert";
import { PeminjamanClient } from "./peminjaman-client";
import type { PeminjamanDetail } from "@/lib/definitions";

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
> & { 
  status_return: string; 
  tanggal_kembali: string | null;
  barang_id: number;
};

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
             p.status_return, p.tanggal_kembali, p.barang_id,
             u.nama AS nama_pengguna,
             b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
      FROM peminjaman p
      JOIN pengguna u ON u.id = p.pengguna_id
      JOIN barang b   ON b.id = p.barang_id
      WHERE p.status IN ('DISETUJUI', 'DITOLAK')
      ORDER BY p.updated_at DESC
    `,
  ]);

  const antrean = menunggu as unknown as BarisAntrean[];
  const keputusan = riwayat as unknown as BarisRiwayat[];

  return (
    <>
      <PageHeader
        title="Persetujuan"
        description="Proses permintaan masuk: setujui (stok langsung berkurang) atau tolak dengan catatan. Pilih multiple untuk bulk approval."
      />

      {params.err === "stok" && (
        <Alert variant="error">
          Permintaan tidak dapat disetujui — stok barang tidak mencukupi.
          Perbarui stok lewat tombol +/− di menu Daftar Barang.
        </Alert>
      )}

      <PeminjamanClient antrean={antrean} keputusan={keputusan} />
    </>
  );
}
