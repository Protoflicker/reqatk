"use client";

import { useState } from "react";
import { bulkApprovePermintaan, bulkRejectPermintaan } from "@/lib/actions";
import { Icon } from "./icon";

interface BulkApprovalProps {
  selectedIds: number[];
  onClear: () => void;
}

export function BulkApproval({ selectedIds, onClear }: BulkApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  if (selectedIds.length === 0) return null;

  const handleBulkApprove = async () => {
    if (!confirm(`Setujui ${selectedIds.length} permintaan sekaligus?`)) return;

    setLoading(true);
    try {
      await bulkApprovePermintaan(selectedIds);
      onClear();
    } catch {
      alert("Gagal menyetujui beberapa permintaan. Periksa stok barang.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    setLoading(true);
    try {
      await bulkRejectPermintaan(selectedIds, rejectNote.trim() || null);
      setShowRejectModal(false);
      setRejectNote("");
      onClear();
    } catch {
      alert("Gagal menolak permintaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="animate-fade-up fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-surface py-3 pl-5 pr-3 shadow-(--shadow-hover)">
        <span className="whitespace-nowrap text-sm font-bold text-text">
          {selectedIds.length} dipilih
        </span>

        <button
          onClick={handleBulkApprove}
          disabled={loading}
          className="neu-btn-primary px-5 py-2 text-sm disabled:opacity-50"
        >
          <Icon name="check" />
          {loading ? "Memproses..." : "Setujui Semua"}
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="btn px-5 py-2 text-sm text-danger disabled:opacity-50"
        >
          <Icon name="x" />
          Tolak Semua
        </button>

        <button
          onClick={onClear}
          disabled={loading}
          className="btn-ghost px-3 py-2 text-sm"
        >
          Batal
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="animate-fade-in fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(15,23,42,0.5)] backdrop-blur-[8px]">
          <div className="animate-bounce-in mx-4 w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-(--shadow-hover)">
            <h3 className="mb-4 font-display text-lg font-extrabold tracking-tight text-text">
              Tolak {selectedIds.length} Permintaan
            </h3>

            <label htmlFor="bulk-catatan" className="label">
              Catatan Admin (Opsional)
            </label>
            <textarea
              id="bulk-catatan"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Alasan penolakan..."
              className="input mb-4 resize-none text-sm"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={handleBulkReject}
                disabled={loading}
                className="neu-btn-danger flex-1 py-2 text-sm disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Konfirmasi Tolak"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNote("");
                }}
                disabled={loading}
                className="btn flex-1 py-2 text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
