"use client";

import { useState } from "react";
import { markAsReturned, markAsNotReturnable } from "@/lib/actions";

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
      <div className="flex gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="neu-btn-primary px-3 py-1 text-xs font-bold"
        >
          ✓ Sudah Dikembalikan
        </button>
        <button
          onClick={handleNotReturnable}
          className="neu-btn px-3 py-1 text-xs font-bold text-text-muted"
        >
          Tidak Perlu Kembali
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/50 backdrop-blur-sm">
          <div className="neu-card mx-4 w-full max-w-md">
            <h3 className="mb-4 font-display text-lg font-bold text-dark">
              Konfirmasi Pengembalian
            </h3>

            <div className="neu-inset mb-4 p-3">
              <p className="text-sm text-dark">
                <span className="font-bold">{barangNama}</span>
              </p>
              <p className="text-xs text-text-muted">
                Jumlah: {jumlah} {satuan}
              </p>
            </div>

            <form action={markAsReturned.bind(null, peminjamanId)}>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
                  Tanggal Pengembalian
                </label>
                <input
                  type="date"
                  name="tanggal_kembali"
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className="neu-input w-full text-sm text-dark"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
                  Catatan (Opsional)
                </label>
                <textarea
                  name="catatan_kembali"
                  placeholder="Kondisi barang, keterangan, dll..."
                  rows={3}
                  className="neu-input w-full resize-none text-sm text-dark"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="neu-btn-primary flex-1 py-2 text-sm font-bold"
                >
                  Konfirmasi Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="neu-btn flex-1 py-2 text-sm font-bold text-dark-light"
                >
                  Batal
                </button>
              </div>
            </form>

            <p className="mt-3 text-xs text-text-muted">
              💡 Stok barang akan otomatis bertambah setelah dikonfirmasi.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
