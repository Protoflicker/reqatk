import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PermintaanForm } from "@/components/permintaan-form";
import { EmptyState } from "@/components/empty-state";
import { tanggalHariIniWIB, type Barang } from "@/lib/definitions";

export default async function PermintaanPage() {
  const sql = db();
  const barangList = (await sql`
    SELECT id, kode, nama, stok, satuan
    FROM barang
    ORDER BY nama ASC
  `) as unknown as Pick<Barang, "id" | "kode" | "nama" | "stok" | "satuan">[];

  return (
    <>
      <PageHeader
        title="Form Permintaan"
        description="Isi formulir berikut untuk mengajukan permintaan alat tulis kantor. Permintaan akan diverifikasi oleh admin sebelum barang dapat diambil."
      />

      {barangList.length === 0 ? (
        <EmptyState
          title="Belum ada barang yang bisa dipinjam"
          hint="Katalog barang masih kosong. Hubungi admin bagian umum."
        />
      ) : (
        <div className="max-w-3xl">
          <PermintaanForm barangList={barangList} today={tanggalHariIniWIB()} />
        </div>
      )}
    </>
  );
}
