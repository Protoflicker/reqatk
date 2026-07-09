"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icon";
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
      <div className="neu-card mb-6 hover:transform-none">
        <h3 className="mb-3 flex items-center gap-2 font-extrabold tracking-tight text-text">
          <Icon name="download" className="text-primary" />
          Download Template
        </h3>
        <p className="mb-4 text-sm text-text-muted">
          Download template Excel, isi data barang, lalu upload kembali.
        </p>
        <a
          href="/admin/barang/import/template"
          download="template-barang.xlsx"
          className="neu-btn-primary inline-flex px-6 py-2 text-sm"
        >
          Download Template Excel
        </a>
      </div>

      {/* Upload Form */}
      <div className="neu-card mb-6 hover:transform-none">
        <h3 className="mb-3 flex items-center gap-2 font-extrabold tracking-tight text-text">
          <Icon name="upload" className="text-primary" />
          Upload File Excel
        </h3>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="input text-sm"
        />
        {file && (
          <p className="helper">
            File dipilih: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Errors */}
      {errors && (
        <div className="neu-card mb-6 border-l-[3px] border-l-danger hover:transform-none">
          <h3 className="mb-3 flex items-center gap-2 font-extrabold tracking-tight text-danger">
            <Icon name="alert" />
            Error Validasi
          </h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="neu-inset p-3 text-sm">
                <span className="font-bold text-danger">Baris {error.row}:</span>{" "}
                <span className="text-text-muted">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="neu-card mb-6 hover:transform-none">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-extrabold tracking-tight text-text">
              <Icon name="check" className="text-success" />
              Preview Data ({preview.length} item)
            </h3>
            <button
              onClick={handleImport}
              disabled={importing}
              className="neu-btn-primary px-6 py-2 text-sm disabled:opacity-50"
            >
              {importing ? "Mengimpor..." : `Import ${preview.length} Barang`}
            </button>
          </div>

          <div className="tbl-wrap shadow-none">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Satuan</th>
                  <th>Stok</th>
                  <th>Min Stok</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((item, index) => (
                  <tr key={index}>
                    <td className="font-mono text-[13px] font-semibold">{item.kode}</td>
                    <td className="font-semibold">{item.nama}</td>
                    <td className="text-text-muted">{item.kategori}</td>
                    <td className="text-text-muted">{item.satuan}</td>
                    <td className="tnum">{item.stok}</td>
                    <td className="tnum">{item.min_stok}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 20 && (
            <p className="mt-4 text-center text-xs text-text-muted">
              ... dan {preview.length - 20} lainnya
            </p>
          )}
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] bg-primary-light p-5">
        <h3 className="mb-2 font-extrabold tracking-tight text-primary">Tips</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-text">
          <li>Kode barang harus unik</li>
          <li>Stok dan Min Stok harus berupa angka</li>
          <li>Satuan default adalah &quot;pcs&quot; jika dikosongkan</li>
          <li>Data akan divalidasi sebelum import</li>
          <li>Duplikat kode akan diabaikan</li>
        </ul>
      </div>
    </>
  );
}
