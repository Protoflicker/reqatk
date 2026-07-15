import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buatLaporanPdf } from "@/lib/pdf";
import {
  STATUS_LIST,
  type PermintaanDetail,
  type StatusPermintaan,
} from "@/lib/definitions";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return new NextResponse("Akses ditolak", { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const statusParam = searchParams.get("status");
  const bulanParam = searchParams.get("bulan");

  const statusFilter = STATUS_LIST.includes(statusParam as StatusPermintaan)
    ? (statusParam as StatusPermintaan)
    : null;
  const bulanFilter = /^\d{4}-\d{2}$/.test(bulanParam ?? "")
    ? bulanParam
    : null;

  const sql = db();
  const rows = (await sql`
    SELECT p.id, p.jumlah, p.keperluan, p.status, p.tanggal_pinjam,
           p.catatan_admin,
           u.nip, u.nama AS nama_pengguna,
           b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
    FROM permintaan p
    JOIN pengguna u ON u.id = p.pengguna_id
    JOIN barang b   ON b.id = p.barang_id
    WHERE (${statusFilter}::text IS NULL OR p.status = ${statusFilter})
      AND (${bulanFilter}::text IS NULL
           OR to_char(p.tanggal_pinjam, 'YYYY-MM') = ${bulanFilter})
    ORDER BY p.created_at DESC
  `) as unknown as PermintaanDetail[];

  const filterInfo = [
    `STATUS: ${statusFilter ?? "SEMUA"}`,
    `PERIODE: ${bulanFilter ?? "SEMUA"}`,
  ].join(" /// ");

  const pdf = buatLaporanPdf({
    rows,
    sertakanPemohon: true,
    subjudul: "REKAPITULASI SEMUA PEGAWAI",
    filterInfo,
  });

  const suffix = [statusFilter, bulanFilter].filter(Boolean).join("-");
  const filename = `laporan-permintaan${suffix ? `-${suffix}` : ""}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
