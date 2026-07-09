import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Search, RotateCcw, Plus } from "lucide-react";
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
        className="mb-6 flex flex-wrap items-end gap-3 neu-card"
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
          <Search className="w-4 h-4" /> Cari
        </button>
        {q && (
          <Link href="/barang" className="btn btn-danger">
            <RotateCcw className="w-4 h-4" /> Reset
          </Link>
        )}
        <Link href="/peminjaman" className="btn btn-solid ml-auto">
          <Plus className="w-4 h-4" /> Ajukan Permintaan
        </Link>
      </form>

      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70">
        {rows.length} jenis barang{q ? ` cocok dengan "${q}"` : " terdaftar"}
        {habis > 0 && <span className="text-red"> /// {habis} stok habis</span>}
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
        <div className="overflow-x-auto neu-card">
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
                  <td className="font-bold">{b.kode}</td>
                  <td>{b.nama}</td>
                  <td className="text-[11px] uppercase tracking-[0.06em]">
                    {b.kategori}
                  </td>
                  <td className={b.stok === 0 ? "font-bold text-red" : "font-bold"}>
                    {b.stok}
                  </td>
                  <td>{b.satuan}</td>
                  <td>
                    {b.stok > 0 ? (
                      <span className="inline-block border-2 border-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]">
                        Tersedia
                      </span>
                    ) : (
                      <span className="inline-block border-2 border-red bg-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-paper">
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
