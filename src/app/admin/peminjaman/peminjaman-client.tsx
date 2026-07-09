"use client";

import { useState } from "react";
import { setujuiPeminjaman, tolakPeminjaman } from "@/lib/actions";
import { StatusBadge } from "@/components/status-badge";
import { BulkApproval } from "@/components/bulk-approval";
import { Pagination } from "@/components/pagination";
import { ReturnForm } from "@/components/return-form";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
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
          <h2 className="font-display text-xl font-extrabold tracking-tight text-text">
            Menunggu Persetujuan{" "}
            <span className={antrean.length > 0 ? "text-primary" : "text-text-muted"}>
              ({antrean.length})
            </span>
          </h2>
          {antrean.length > 0 && (
            <button onClick={toggleSelectAll} className="btn px-4 py-2 text-xs">
              {selectedIds.length === antrean.length
                ? "Batalkan Semua"
                : "Pilih Semua"}
            </button>
          )}
        </div>

        {antrean.length === 0 ? (
          <EmptyState
            title="Antrean kosong"
            hint="Tidak ada permintaan yang menunggu persetujuan."
          />
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Pilih semua permintaan"
                      checked={selectedIds.length === antrean.length && antrean.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
                    />
                  </th>
                  <th>ID</th>
                  <th>Pemohon</th>
                  <th>Barang</th>
                  <th>Jumlah</th>
                  <th>Stok</th>
                  <th>Keperluan</th>
                  <th>Tgl. Pinjam</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {antrean.map((r) => (
                  <tr
                    key={r.id}
                    className={
                      selectedIds.includes(r.id) ? "bg-[rgba(0,117,222,0.06)]" : ""
                    }
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Pilih permintaan #${r.id}`}
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
                      />
                    </td>
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
                    <td className={`tnum ${r.stok < r.jumlah ? "font-bold text-danger" : ""}`}>
                      {r.stok}
                      {r.stok < r.jumlah && (
                        <span className="ml-1 inline-flex items-center gap-1 text-xs">
                          <Icon name="alert" />
                          Kurang
                        </span>
                      )}
                    </td>
                    <td className="max-w-[24ch]">{r.keperluan}</td>
                    <td className="whitespace-nowrap font-mono text-xs">
                      {formatTanggal(r.tanggal_pinjam)}
                    </td>
                    <td>
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <form action={setujuiPeminjaman.bind(null, r.id)}>
                          <button
                            type="submit"
                            className="neu-btn-primary w-full px-3 py-1 text-xs"
                          >
                            <Icon name="check" />
                            Setujui
                          </button>
                        </form>
                        <form action={tolakPeminjaman.bind(null, r.id)} className="flex gap-1">
                          <input
                            name="catatan"
                            type="text"
                            placeholder="catatan (opsional)"
                            className="input flex-1 px-2 py-1 text-xs"
                          />
                          <button
                            type="submit"
                            className="btn px-2.5 py-1 text-xs text-danger"
                          >
                            <Icon name="x" />
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

      {/* Bulk Approval UI */}
      <BulkApproval selectedIds={selectedIds} onClear={() => setSelectedIds([])} />

      {/* ===== Keputusan terakhir ===== */}
      <section>
        <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight text-text">
          Keputusan Terakhir{" "}
          <span className="text-text-muted">({keputusan.length})</span>
        </h2>

        {keputusan.length === 0 ? (
          <EmptyState
            title="Belum ada keputusan"
            hint="Permintaan yang disetujui atau ditolak akan tampil di sini."
          />
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pemohon</th>
                    <th>Barang</th>
                    <th>Jumlah</th>
                    <th>Tgl. Pinjam</th>
                    <th>Status</th>
                    <th>Status Kembali</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedKeputusan.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs text-text-muted">
                        #{String(r.id).padStart(4, "0")}
                      </td>
                      <td className="font-semibold">{r.nama_pengguna}</td>
                      <td>
                        <span className="font-mono text-[13px] font-semibold">
                          {r.kode_barang}
                        </span>{" "}
                        {r.nama_barang}
                      </td>
                      <td className="whitespace-nowrap tnum">
                        {r.jumlah} {r.satuan}
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs">
                        {formatTanggal(r.tanggal_pinjam)}
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        {r.status === "DISETUJUI" && (
                          <span
                            className={`badge whitespace-nowrap ${
                              r.status_return === "DIKEMBALIKAN"
                                ? "badge-success"
                                : r.status_return === "TIDAK_PERLU"
                                ? "badge-muted"
                                : "badge-warning"
                            }`}
                          >
                            {r.status_return === "DIKEMBALIKAN" ? (
                              <>
                                <Icon name="check" />
                                Dikembalikan
                              </>
                            ) : r.status_return === "TIDAK_PERLU" ? (
                              "Tidak Perlu"
                            ) : (
                              <>
                                <Icon name="clock" />
                                Belum Kembali
                              </>
                            )}
                          </span>
                        )}
                        {r.status === "DITOLAK" && (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                        {r.tanggal_kembali && (
                          <div className="mt-1 font-mono text-[11px] text-text-muted">
                            {formatTanggal(r.tanggal_kembali)}
                          </div>
                        )}
                      </td>
                      <td className="max-w-[24ch] text-text-muted">
                        {r.catatan_admin ?? "—"}
                      </td>
                      <td>
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

        <p className="helper mt-4">
          Riwayat lengkap tersedia di menu Laporan Peminjaman.
        </p>
      </section>
    </>
  );
}
