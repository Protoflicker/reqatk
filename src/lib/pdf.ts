import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import {
  formatTanggal,
  STATUS_LIST,
  type PeminjamanDetail,
} from "./definitions";

/** Palet Swiss Industrial Print — sama dengan antarmuka web. */
const INK: [number, number, number] = [17, 17, 17];
const PAPER: [number, number, number] = [244, 244, 240];
const PAPER_DIM: [number, number, number] = [234, 232, 227];
const RED: [number, number, number] = [230, 25, 25];

export interface LaporanPdfInput {
  rows: PeminjamanDetail[];
  /** true = laporan admin (kolom pemohon ikut dicetak) */
  sertakanPemohon: boolean;
  /** baris identitas di bawah judul, mis. "SEMUA PEGAWAI" */
  subjudul: string;
  /** deskripsi saringan aktif, mis. "STATUS: SEMUA /// PERIODE: 2026-07" */
  filterInfo: string;
}

export function buatLaporanPdf({
  rows,
  sertakanPemohon,
  subjudul,
  filterInfo,
}: LaporanPdfInput): ArrayBuffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const lebar = doc.internal.pageSize.getWidth();
  const tinggi = doc.internal.pageSize.getHeight();

  // ===== kop hitam =====
  doc.setFillColor(...INK);
  doc.rect(0, 0, lebar, 24, "F");

  doc.setTextColor(...PAPER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PINJAM/ATK — LAPORAN PEMINJAMAN", 14, 11);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text(subjudul.toUpperCase(), 14, 18);

  const dicetak = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
  doc.text(`DICETAK: ${dicetak} WIB`, lebar - 14, 18, { align: "right" });

  // ===== garis merah =====
  doc.setFillColor(...RED);
  doc.rect(0, 24, lebar, 1.5, "F");

  // ===== ringkasan =====
  const ringkas = { MENUNGGU: 0, DISETUJUI: 0, DITOLAK: 0 } as Record<
    string,
    number
  >;
  for (const r of rows) ringkas[r.status] = (ringkas[r.status] ?? 0) + 1;

  doc.setTextColor(...INK);
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.text(`[ ${filterInfo.toUpperCase()} ]`, 14, 32);
  doc.text(
    STATUS_LIST.map((s) => `${s}: ${ringkas[s] ?? 0}`).join("   ///   ") +
      `   ///   TOTAL: ${rows.length}`,
    14,
    37
  );

  // ===== tabel =====
  const head = sertakanPemohon
    ? [["ID", "NIP", "NAMA PEGAWAI", "BARANG", "JML", "KEPERLUAN", "TGL PINJAM", "STATUS", "CATATAN ADMIN"]]
    : [["ID", "BARANG", "JML", "KEPERLUAN", "TGL PINJAM", "STATUS", "CATATAN ADMIN"]];

  const body: RowInput[] = rows.map((r) => {
    const dasar = [
      `#${String(r.id).padStart(4, "0")}`,
      `${r.kode_barang} ${r.nama_barang}`,
      `${r.jumlah} ${r.satuan}`,
      r.keperluan,
      formatTanggal(r.tanggal_pinjam),
      r.status,
      r.catatan_admin ?? "-",
    ];
    return sertakanPemohon
      ? [dasar[0], r.nip, r.nama_pengguna, ...dasar.slice(1)]
      : dasar;
  });

  autoTable(doc, {
    startY: 42,
    head,
    body,
    theme: "grid",
    margin: { left: 14, right: 14, bottom: 16 },
    styles: {
      font: "courier",
      fontSize: 7.5,
      textColor: INK,
      fillColor: PAPER,
      lineColor: INK,
      lineWidth: 0.2,
      cellPadding: 1.6,
      overflow: "linebreak",
    },
    headStyles: {
      font: "courier",
      fontStyle: "bold",
      fillColor: INK,
      textColor: PAPER,
      lineColor: INK,
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: PAPER_DIM,
    },
    didParseCell: (data) => {
      // status DITOLAK dicetak merah agar konsisten dengan web
      if (
        data.section === "body" &&
        typeof data.cell.raw === "string" &&
        data.cell.raw === "DITOLAK"
      ) {
        data.cell.styles.textColor = RED;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ===== catatan kosong =====
  if (rows.length === 0) {
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text("// TIDAK ADA DATA YANG COCOK DENGAN SARINGAN", 14, 50);
  }

  // ===== kaki halaman =====
  const totalHalaman = doc.getNumberOfPages();
  for (let i = 1; i <= totalHalaman; i++) {
    doc.setPage(i);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text(
      `PINJAM/ATK (c) ${new Date().getFullYear()} /// DOKUMEN INTERNAL`,
      14,
      tinggi - 8
    );
    doc.text(`HAL ${i}/${totalHalaman}`, lebar - 14, tinggi - 8, {
      align: "right",
    });
  }

  return doc.output("arraybuffer");
}
