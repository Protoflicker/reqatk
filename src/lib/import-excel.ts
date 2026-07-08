/**
 * Excel Import Utilities
 */

import * as XLSX from "xlsx";

export interface ImportRow {
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  stok: number;
  min_stok: number;
}

export interface ImportResult {
  success: boolean;
  data?: ImportRow[];
  errors?: Array<{ row: number; message: string }>;
}

/**
 * Parse Excel file buffer
 */
export function parseExcelFile(buffer: Buffer): ImportResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Skip header row
    const dataRows = rawData.slice(1) as any[][];

    const data: ImportRow[] = [];
    const errors: Array<{ row: number; message: string }> = [];

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel is 1-indexed and we skipped header

      // Skip empty rows
      if (!row || row.length === 0 || !row[0]) {
        return;
      }

      const [kode, nama, kategori, satuan, stok, min_stok] = row;

      // Validate
      if (!kode || typeof kode !== "string") {
        errors.push({ row: rowNumber, message: "Kode barang wajib diisi" });
        return;
      }

      if (!nama || typeof nama !== "string") {
        errors.push({ row: rowNumber, message: "Nama barang wajib diisi" });
        return;
      }

      if (!kategori || typeof kategori !== "string") {
        errors.push({ row: rowNumber, message: "Kategori wajib diisi" });
        return;
      }

      const stokNum = Number(stok);
      if (isNaN(stokNum) || stokNum < 0) {
        errors.push({ row: rowNumber, message: "Stok harus angka >= 0" });
        return;
      }

      const minStokNum = min_stok ? Number(min_stok) : 10;
      if (isNaN(minStokNum) || minStokNum < 0) {
        errors.push({ row: rowNumber, message: "Min stok harus angka >= 0" });
        return;
      }

      data.push({
        kode: String(kode).trim().toUpperCase(),
        nama: String(nama).trim(),
        kategori: String(kategori).trim(),
        satuan: satuan ? String(satuan).trim() : "pcs",
        stok: stokNum,
        min_stok: minStokNum,
      });
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    if (data.length === 0) {
      return { success: false, errors: [{ row: 0, message: "Tidak ada data valid" }] };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      errors: [{ row: 0, message: `Error parsing file: ${error}` }],
    };
  }
}

/**
 * Generate template Excel file
 */
export function generateTemplate(): Buffer {
  const data = [
    ["Kode", "Nama", "Kategori", "Satuan", "Stok", "Min Stok"],
    ["ATK-XXX", "Contoh Barang", "Alat Tulis", "pcs", 50, 10],
    ["KRT-XXX", "Contoh Kertas", "Kertas", "rim", 30, 5],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Kode
    { wch: 30 }, // Nama
    { wch: 15 }, // Kategori
    { wch: 10 }, // Satuan
    { wch: 10 }, // Stok
    { wch: 10 }, // Min Stok
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Barang");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer);
}
