import Link from "next/link";
import { db } from "@/lib/db";
import { hapusBarang, ubahStok } from "@/lib/actions";
import { PageHeader } from "@/components/page-header";
import { BarangForm } from "@/components/barang-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Alert } from "@/components/alert";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import type { Barang } from "@/lib/definitions";

const OK_MSG: Record<string, string> = {
  tambah: "Barang baru berhasil ditambahkan ke katalog.",
  ubah: "Perubahan barang berhasil disimpan.",
};

const ERR_MSG: Record<string, string> = {
  terpakai:
    "Barang tidak bisa dihapus karena punya riwayat permintaan. Set stok ke 0 bila ingin menonaktifkannya.",
  gagal: "Gagal menghapus barang. Coba lagi.",
  "stok-input": "Jumlah penyesuaian stok harus bilangan bulat lebih dari nol.",
};

export default async function AdminBarangPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; ok?: string; err?: string; q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim() || null;
  const sql = db();

  const rows = (await sql`
    SELECT id, kode, nama, kategori, jenis, satuan, stok, created_at
    FROM barang
    WHERE (${q}::text IS NULL
           OR nama     ILIKE '%' || ${q} || '%'
           OR kode     ILIKE '%' || ${q} || '%'
           OR kategori ILIKE '%' || ${q} || '%'
           OR jenis    ILIKE '%' || ${q} || '%')
    ORDER BY kategori ASC, jenis ASC, nama ASC
  `) as unknown as Barang[];

  const editId = params.edit ? Number(params.edit) : null;
  const editData = editId ? (rows.find((b) => b.id === editId) ?? null) : null;

  return (
    <>
      <PageHeader
        title="Kelola Barang"
        description="Tambah dan ubah barang pada katalog ATK. Gunakan tombol +/− pada kolom Stok Cepat untuk memperbarui stok tanpa membuka formulir."
      />

      {params.ok && OK_MSG[params.ok] && (
        <Alert variant="success">{OK_MSG[params.ok]}</Alert>
      )}
      {params.err && ERR_MSG[params.err] && (
        <Alert variant="error">{ERR_MSG[params.err]}</Alert>
      )}

      <div className="mb-8">
        <BarangForm editData={editData} />
      </div>

      <form
        method="GET"
        className="neu-card mb-6 flex flex-wrap items-end gap-3 hover:transform-none"
      >
        <div className="min-w-[240px] flex-1">
          <label htmlFor="q" className="label">
            Cari Barang
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="kode / nama / kategori / jenis..."
            className="input"
          />
        </div>
        <button type="submit" className="btn">
          <Icon name="search" />
          Cari
        </button>
        {q && (
          <Link href="/admin/barang" className="btn-ghost">
            Reset
          </Link>
        )}
      </form>

      <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight text-text">
        Katalog{" "}
        <span className="text-text-muted">
          ({rows.length}
          {q ? ` cocok dengan "${q}"` : ""})
        </span>
      </h2>

      {rows.length === 0 ? (
        <EmptyState
          title={q ? "Tidak ditemukan" : "Katalog kosong"}
          hint={
            q
              ? `Tidak ada barang yang cocok dengan "${q}". Coba kata kunci lain.`
              : "Tambahkan barang pertama lewat formulir di atas."
          }
        />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Jenis</th>
                <th>Stok</th>
                <th>Satuan</th>
                <th>Stok Cepat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap font-mono text-[13px] font-semibold">
                    {b.kode}
                  </td>
                  <td className="font-semibold">{b.nama}</td>
                  <td>
                    <span className="badge">{b.kategori}</span>
                  </td>
                  <td className="text-text-muted text-[13px]">{b.jenis}</td>
                  <td
                    className={`tnum font-bold ${b.stok === 0 ? "text-danger" : ""}`}
                  >
                    {b.stok}
                  </td>
                  <td className="text-text-muted">{b.satuan}</td>
                  <td>
                    <form
                      action={ubahStok.bind(null, b.id)}
                      className="flex items-center gap-1"
                    >
                      <label htmlFor={`stok-${b.id}`} className="sr-only">
                        Jumlah penyesuaian stok {b.nama}
                      </label>
                      <input
                        id={`stok-${b.id}`}
                        name="jumlah"
                        type="number"
                        min={1}
                        defaultValue={10}
                        className="input w-16 px-2 py-1 text-xs"
                      />
                      <button
                        type="submit"
                        name="arah"
                        value="tambah"
                        title={`Tambah stok ${b.nama}`}
                        className="btn px-2.5 py-1 text-xs"
                      >
                        +
                      </button>
                      <button
                        type="submit"
                        name="arah"
                        value="kurang"
                        title={`Kurangi stok ${b.nama}`}
                        className="btn px-2.5 py-1 text-xs text-danger"
                      >
                        &minus;
                      </button>
                    </form>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/barang?edit=${b.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                        className="btn px-2.5 py-1 text-xs"
                      >
                        <Icon name="pencil" />
                        Ubah
                      </Link>
                      <form action={hapusBarang.bind(null, b.id)}>
                        <ConfirmButton
                          message={`Hapus ${b.kode} — ${b.nama} dari katalog?`}
                          className="btn-danger px-2.5 py-1 text-xs"
                        >
                          <Icon name="trash" />
                          Hapus
                        </ConfirmButton>
                      </form>
                    </div>
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
