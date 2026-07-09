import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import type { Barang } from "@/lib/definitions";

export default async function BarangUserPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim() || null;

  const sql = db();
  const rows = (await sql`
    SELECT id, kode, nama, kategori, satuan, stok
    FROM barang
    WHERE (${q}::text IS NULL
           OR nama     ILIKE '%' || ${q} || '%'
           OR kode     ILIKE '%' || ${q} || '%'
           OR kategori ILIKE '%' || ${q} || '%')
    ORDER BY kategori ASC, nama ASC
  `) as unknown as Barang[];

  const habis = rows.filter((b) => b.stok === 0).length;

  return (
    <>
      <PageHeader
        title="Daftar Barang"
        description="Katalog alat tulis kantor yang tersedia untuk diminta. Stok diperbarui setiap kali permintaan disetujui."
      />

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
            placeholder="kode / nama / kategori..."
            className="input"
          />
        </div>
        <button type="submit" className="btn">
          <Icon name="search" />
          Cari
        </button>
        {q && (
          <Link href="/barang" className="btn-ghost">
            Reset
          </Link>
        )}
        <Link href="/peminjaman" className="neu-btn-primary ml-auto">
          <Icon name="plus" />
          Ajukan Permintaan
        </Link>
      </form>

      <p className="mb-4 text-xs font-semibold text-text-muted">
        {rows.length} jenis barang{q ? ` cocok dengan "${q}"` : " terdaftar"}
        {habis > 0 && (
          <span className="ml-2 font-bold text-danger">
            {habis} stok habis
          </span>
        )}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title={q ? "Tidak ditemukan" : "Katalog masih kosong"}
          hint={
            q
              ? `Tidak ada barang yang cocok dengan "${q}". Coba kata kunci lain.`
              : "Admin belum menambahkan barang. Hubungi bagian umum."
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
                <th>Stok</th>
                <th>Satuan</th>
                <th>Ketersediaan</th>
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
                  <td
                    className={`tnum font-bold ${b.stok === 0 ? "text-danger" : ""}`}
                  >
                    {b.stok}
                  </td>
                  <td className="text-text-muted">{b.satuan}</td>
                  <td>
                    {b.stok > 0 ? (
                      <span className="badge badge-success whitespace-nowrap">
                        <Icon name="check" />
                        Tersedia
                      </span>
                    ) : (
                      <span className="badge badge-danger whitespace-nowrap">
                        <Icon name="x" />
                        Habis
                      </span>
                    )}
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
