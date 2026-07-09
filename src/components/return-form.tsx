"use client";

import { useState } from "react";
import { markAsReturned, markAsNotReturnable } from "@/lib/actions";
import { Icon } from "./icon";

interface ReturnFormProps {
  peminjamanId: number;
  barangNama: string;
  jumlah: number;
  satuan: string;
}

export function ReturnForm({ peminjamanId, barangNama, jumlah, satuan }: ReturnFormProps) {
  const [showModal, setShowModal] = useState(false);
  const [tanggalKembali, setTanggalKembali] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const handleNotReturnable = async () => {
    if (confirm("Tandai sebagai tidak perlu dikembalikan (barang habis pakai)?")) {
      await markAsNotReturnable(peminjamanId);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="neu-btn-primary px-3 py-1 text-xs"
        >
          <Icon name="check" />
          Sudah Dikembalikan
        </button>
        <button
          onClick={handleNotReturnable}
          className="btn px-3 py-1 text-xs text-text-muted"
        >
          Tidak Perlu Kembali
        </button>
      </div>

      {/* Modal (docs/style.md §15) */}
      {showModal && (
        <div className="animate-fade-in fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(15,23,42,0.5)] backdrop-blur-[8px]">
          <div className="animate-bounce-in mx-4 w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-(--shadow-hover)">
            <h3 className="mb-4 font-display text-lg font-extrabold tracking-tight text-text">
              Konfirmasi Pengembalian
            </h3>

            <div className="neu-inset mb-4 p-3">
              <p className="text-sm font-bold text-text">{barangNama}</p>
              <p className="text-xs text-text-muted">
                Jumlah: {jumlah} {satuan}
              </p>
            </div>

            <form action={markAsReturned.bind(null, peminjamanId)}>
              <div className="mb-4">
                <label htmlFor={`tgl-kembali-${peminjamanId}`} className="label">
                  Tanggal Pengembalian
                </label>
                <input
                  id={`tgl-kembali-${peminjamanId}`}
                  type="date"
                  name="tanggal_kembali"
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className="input font-mono text-sm"
                />
              </div>

              <div className="mb-4">
                <label htmlFor={`catatan-kembali-${peminjamanId}`} className="label">
                  Catatan (Opsional)
                </label>
                <textarea
                  id={`catatan-kembali-${peminjamanId}`}
                  name="catatan_kembali"
                  placeholder="Kondisi barang, keterangan, dll..."
                  rows={3}
                  className="input resize-none text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="neu-btn-primary flex-1 py-2 text-sm"
                >
                  Konfirmasi Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn flex-1 py-2 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>

            <p className="helper mt-3">
              Stok barang akan otomatis bertambah setelah dikonfirmasi.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
