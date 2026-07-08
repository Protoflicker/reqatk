"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { parseExcelFile, type ImportRow } from "@/lib/import-excel";

export default function ImportBarangPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const [errors, setErrors] = useState<Array<{ row: number; message: string }> | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(null);
    setErrors(null);

    // Parse file
    const buffer = await selectedFile.arrayBuffer();
    const result = parseExcelFile(Buffer.from(buffer));

    if (result.success && result.data) {
      setPreview(result.data);
    } else if (result.errors) {
      setErrors(result.errors);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setImporting(true);

    try {
      const response = await fetch("/admin/barang/import/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: preview }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Berhasil import ${result.imported} barang!`);
        router.push("/admin/barang");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Gagal import data");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Import Barang dari Excel"
        description="Upload file Excel untuk menambahkan banyak barang sekaligus."
      />

      {/* Template Download */}
      <div className="neu-card mb-6">
        <h3 className="mb-3 font-bold text-dark">📥 Download Template</h3>
        <p className="mb-4 text-sm text-dark-light">
          Download template Excel, isi data barang, lalu upload kembali.
        </p>
        <a
          href="/admin/barang/import/template"
          download="template-barang.xlsx"
          className="neu-btn-primary inline-block px-6 py-2 text-sm font-bold"
        >
          Download Template Excel
        </a>
      </div>

      {/* Upload Form */}
      <div className="neu-card mb-6">
        <h3 className="mb-3 font-bold text-dark">📤 Upload File Excel</h3>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="neu-input w-full text-sm"
        />
        {file && (
          <p className="mt-2 text-xs text-text-muted">
            File dipilih: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Errors */}
      {errors && (
        <div className="neu-card mb-6 border-l-4 border-red-600">
          <h3 className="mb-3 font-bold text-red-600">❌ Error Validasi</h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="neu-inset p-3 text-sm">
                <span className="font-bold text-red-600">Baris {error.row}:</span>{" "}
                <span className="text-dark-light">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="neu-card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dark">✓ Preview Data ({preview.length} items)</h3>
            <button
              onClick={handleImport}
              disabled={importing}
              className="neu-btn-primary px-6 py-2 text-sm font-bold disabled:opacity-50"
            >
              {importing ? "Importing..." : `Import ${preview.length} Barang`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-bg text-xs uppercase tracking-wider text-text-muted">
                  <th className="pb-3">Kode</th>
                  <th className="pb-3">Nama</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Satuan</th>
                  <th className="pb-3">Stok</th>
                  <th className="pb-3">Min Stok</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((item, index) => (
                  <tr key={index} className="border-b border-bg last:border-0">
                    <td className="py-3 font-bold text-primary">{item.kode}</td>
                    <td className="py-3 text-dark">{item.nama}</td>
                    <td className="py-3 text-dark-light">{item.kategori}</td>
                    <td className="py-3 text-dark-light">{item.satuan}</td>
                    <td className="py-3 text-dark">{item.stok}</td>
                    <td className="py-3 text-dark">{item.min_stok}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <p className="mt-4 text-center text-xs text-text-muted">
                ... dan {preview.length - 20} lainnya
              </p>
            )}
          </div>
        </div>
      )}

      <div className="neu-card bg-blue-50">
        <h3 className="mb-2 font-bold text-dark">💡 Tips:</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-dark-light">
          <li>Kode barang harus unik</li>
          <li>Stok dan Min Stok harus berupa angka</li>
          <li>Satuan default adalah "pcs" jika dikosongkan</li>
          <li>Data akan divalidasi sebelum import</li>
          <li>Duplikat kode akan diabaikan</li>
        </ul>
      </div>
    </>
  );
}
