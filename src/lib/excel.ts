/**
 * Excel Export Utilities
 * Uses xlsx library to generate Excel files with formatting
 */

import * as XLSX from "xlsx";
import type { PermintaanDetail } from "./definitions";

export interface ExcelData {
  sheetName: string;
  data: unknown[];
  columns?: { header: string; key: string; width?: number }[];
}

/**
 * Generate Excel buffer from multiple sheets
 */
export function generateExcelBuffer(sheets: ExcelData[]): Buffer {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    let worksheet: XLSX.WorkSheet;

    if (sheet.columns) {
      // Custom column mapping
      const headers = sheet.columns.map((col) => col.header);
      const rows = sheet.data.map((row: any) =>
        sheet.columns!.map((col) => row[col.key] ?? "")
      );
      const data = [headers, ...rows];
      worksheet = XLSX.utils.aoa_to_sheet(data);

      // Set column widths
      worksheet["!cols"] = sheet.columns.map((col) => ({
        wch: col.width || 15,
      }));
    } else {
      // Auto-generate from object keys
      worksheet = XLSX.utils.json_to_sheet(sheet.data);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
  });

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}

/**
 * Generate Excel for Permintaan Report
 */
export function generatePermintaanExcel(
  data: PermintaanDetail[],
  summary?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  }
): Buffer {
  const sheets: ExcelData[] = [];

  // Summary Sheet
  if (summary) {
    sheets.push({
      sheetName: "Ringkasan",
      data: [
        { Metrik: "Total Permintaan", Jumlah: summary.total },
        { Metrik: "Disetujui", Jumlah: summary.approved },
        { Metrik: "Menunggu", Jumlah: summary.pending },
        { Metrik: "Ditolak", Jumlah: summary.rejected },
      ],
    });
  }

  // Detail Sheet
  sheets.push({
    sheetName: "Detail Permintaan",
    columns: [
      { header: "ID", key: "id", width: 8 },
      { header: "Tanggal", key: "tanggal_pinjam", width: 12 },
      { header: "NIP", key: "nip", width: 20 },
      { header: "Nama Pemohon", key: "nama_pengguna", width: 25 },
      { header: "Kode Barang", key: "kode_barang", width: 15 },
      { header: "Nama Barang", key: "nama_barang", width: 30 },
      { header: "Jumlah", key: "jumlah", width: 10 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "Keperluan", key: "keperluan", width: 35 },
      { header: "Status", key: "status", width: 12 },
      { header: "Catatan Admin", key: "catatan_admin", width: 30 },
    ],
    data: data.map((item) => ({
      id: item.id,
      tanggal_pinjam: item.tanggal_pinjam,
      nip: item.nip,
      nama_pengguna: item.nama_pengguna,
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      jumlah: item.jumlah,
      satuan: item.satuan,
      keperluan: item.keperluan,
      status: item.status,
      catatan_admin: item.catatan_admin || "-",
    })),
  });

  return generateExcelBuffer(sheets);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")
    .replace("T", "_");
  return `${prefix}_${timestamp}.xlsx`;
}
