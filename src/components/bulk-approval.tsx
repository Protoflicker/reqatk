"use client";

import { useState } from "react";
import { bulkApprovePeminjaman, bulkRejectPeminjaman } from "@/lib/actions";

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
      await bulkApprovePeminjaman(selectedIds);
      onClear();
    } catch (error) {
      alert("Gagal menyetujui beberapa permintaan. Periksa stok barang.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    setLoading(true);
    try {
      await bulkRejectPeminjaman(selectedIds, rejectNote.trim() || null);
      setShowRejectModal(false);
      setRejectNote("");
      onClear();
    } catch (error) {
      alert("Gagal menolak permintaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="neu-card fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 px-6 py-4 shadow-2xl">
        <span className="text-sm font-bold text-dark">
          {selectedIds.length} dipilih
        </span>
        
        <button
          onClick={handleBulkApprove}
          disabled={loading}
          className="neu-btn-primary px-6 py-2 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Memproses..." : "✓ Setujui Semua"}
        </button>
        
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="neu-btn px-6 py-2 text-sm font-bold text-dark-light disabled:opacity-50"
        >
          ✕ Tolak Semua
        </button>
        
        <button
          onClick={onClear}
          disabled={loading}
          className="text-sm text-text-muted underline hover:text-dark"
        >
          Batal
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/50 backdrop-blur-sm">
          <div className="neu-card mx-4 w-full max-w-md">
            <h3 className="mb-4 font-display text-lg font-bold text-dark">
              Tolak {selectedIds.length} Permintaan
            </h3>
            
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
              Catatan Admin (Opsional)
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Alasan penolakan..."
              className="neu-input mb-4 w-full resize-none text-sm"
              rows={4}
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleBulkReject}
                disabled={loading}
                className="neu-btn-primary flex-1 py-2 text-sm font-bold disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Konfirmasi Tolak"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNote("");
                }}
                disabled={loading}
                className="neu-btn flex-1 py-2 text-sm font-bold text-dark-light"
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
