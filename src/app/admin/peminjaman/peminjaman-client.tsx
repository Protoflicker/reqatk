"use client";

import { useState } from "react";
import { setujuiPeminjaman, tolakPeminjaman } from "@/lib/actions";
import { StatusBadge } from "@/components/status-badge";
import { BulkApproval } from "@/components/bulk-approval";
import { Pagination } from "@/components/pagination";
import { ReturnForm } from "@/components/return-form";
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
> & { 
  status_return: string; 
  tanggal_kembali: string | null;
  barang_id: number;
};

interface PeminjamanClientProps {
  antrean: BarisAntrean[];
  keputusan: BarisRiwayat[];
}

const ITEMS_PER_PAGE = 10;

export function PeminjamanClient({ antrean, keputusan }: PeminjamanClientProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(keputusan.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedKeputusan = keputusan.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === antrean.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(antrean.map((r) => r.id));
    }
  };

  return (
    <>
      {/* ===== Antrean menunggu ===== */}
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl uppercase tracking-tight text-dark">
            Menunggu Persetujuan{" "}
            <span className={antrean.length > 0 ? "text-primary" : "text-text-muted"}>
              ({antrean.length})
            </span>
          </h2>
          {antrean.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="neu-btn px-4 py-2 text-xs font-bold text-dark-light"
            >
              {selectedIds.length === antrean.length ? "✓ Batalkan Semua" : "☐ Pilih Semua"}
            </button>
          )}
        </div>

        {antrean.length === 0 ? (
          <div className="neu-card py-12 text-center">
            <p className="text-lg font-bold text-dark">Antrean kosong</p>
            <p className="mt-2 text-sm text-text-muted">
              Tidak ada permintaan yang menunggu persetujuan.
            </p>
          </div>
        ) : (
          <div className="neu-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-bg text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === antrean.length && antrean.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Pemohon</th>
                  <th className="pb-3">Barang</th>
                  <th className="pb-3">Jumlah</th>
                  <th className="pb-3">Stok</th>
                  <th className="pb-3">Keperluan</th>
                  <th className="pb-3">Tgl. Pinjam</th>
                  <th className="pb-3">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {antrean.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-bg transition-colors last:border-0 ${
                      selectedIds.includes(r.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </td>
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
                      {r.stok < r.jumlah && (
                        <span className="ml-1 text-xs uppercase">⚠ Kurang</span>
                      )}
                    </td>
                    <td className="max-w-[24ch] py-3 text-dark-light">{r.keperluan}</td>
                    <td className="whitespace-nowrap py-3">
                      {formatTanggal(r.tanggal_pinjam)}
                    </td>
                    <td className="py-3">
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <form action={setujuiPeminjaman.bind(null, r.id)}>
                          <button type="submit" className="neu-btn-primary w-full px-3 py-1 text-xs font-bold">
                            ✓ Setujui
                          </button>
                        </form>
                        <form action={tolakPeminjaman.bind(null, r.id)} className="flex gap-1">
                          <input
                            name="catatan"
                            type="text"
                            placeholder="catatan (opsional)"
                            className="neu-input flex-1 px-2 py-1 text-xs"
                          />
                          <button type="submit" className="neu-btn px-2 py-1 text-xs font-bold text-red-600">
                            ✕ Tolak
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

      {/* Bulk Approval UI */}
      <BulkApproval selectedIds={selectedIds} onClear={() => setSelectedIds([])} />

      {/* ===== Keputusan terakhir ===== */}
      <section>
        <h2 className="mb-4 font-display text-xl uppercase tracking-tight text-dark">
          Keputusan Terakhir{" "}
          <span className="text-text-muted">({keputusan.length})</span>
        </h2>

        {keputusan.length === 0 ? (
          <div className="neu-card py-12 text-center">
            <p className="text-lg font-bold text-dark">Belum ada keputusan</p>
            <p className="mt-2 text-sm text-text-muted">
              Permintaan yang disetujui atau ditolak akan tampil di sini.
            </p>
          </div>
        ) : (
          <>
            <div className="neu-card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-bg text-xs uppercase tracking-wider text-text-muted">
                    <th className="pb-3">ID</th>
                    <th className="pb-3">Pemohon</th>
                    <th className="pb-3">Barang</th>
                    <th className="pb-3">Jumlah</th>
                    <th className="pb-3">Tgl. Pinjam</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Status Kembali</th>
                    <th className="pb-3">Catatan</th>
                    <th className="pb-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedKeputusan.map((r) => (
                    <tr key={r.id} className="border-b border-bg last:border-0">
                      <td className="py-3 text-text-muted">#{String(r.id).padStart(4, "0")}</td>
                      <td className="py-3 font-bold text-dark">{r.nama_pengguna}</td>
                      <td className="py-3">
                        <span className="font-bold text-primary">{r.kode_barang}</span>{" "}
                        <span className="text-dark-light">{r.nama_barang}</span>
                      </td>
                      <td className="whitespace-nowrap py-3">
                        {r.jumlah} {r.satuan}
                      </td>
                      <td className="whitespace-nowrap py-3">
                        {formatTanggal(r.tanggal_pinjam)}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3">
                        {r.status === "DISETUJUI" && (
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                              r.status_return === "DIKEMBALIKAN"
                                ? "bg-green-100 text-green-800"
                                : r.status_return === "TIDAK_PERLU"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {r.status_return === "DIKEMBALIKAN"
                              ? "✓ Dikembalikan"
                              : r.status_return === "TIDAK_PERLU"
                              ? "⊘ Tidak Perlu"
                              : "⏱ Belum Kembali"}
                          </span>
                        )}
                        {r.status === "DITOLAK" && (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                        {r.tanggal_kembali && (
                          <div className="mt-1 text-xs text-text-muted">
                            {formatTanggal(r.tanggal_kembali)}
                          </div>
                        )}
                      </td>
                      <td className="max-w-[24ch] py-3 text-dark-light">
                        {r.catatan_admin ?? "—"}
                      </td>
                      <td className="py-3">
                        {r.status === "DISETUJUI" && 
                         r.status_return === "BELUM_DIKEMBALIKAN" && (
                          <ReturnForm
                            peminjamanId={r.id}
                            barangNama={r.nama_barang}
                            jumlah={r.jumlah}
                            satuan={r.satuan}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        <p className="mt-4 text-xs uppercase tracking-wider text-text-muted">
          Riwayat lengkap tersedia di menu Laporan Peminjaman
        </p>
      </section>
    </>
  );
}
