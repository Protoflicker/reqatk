import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STATUS_LIST, type StatusPermintaan } from "@/lib/definitions";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

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
    SELECT p.id, u.nip, u.nama AS nama_pengguna,
           b.kode AS kode_barang, b.nama AS nama_barang,
           p.jumlah, b.satuan, p.keperluan, p.status,
           to_char(p.tanggal_pinjam, 'YYYY-MM-DD') AS tanggal_pinjam,
           p.catatan_admin
    FROM permintaan p
    JOIN pengguna u ON u.id = p.pengguna_id
    JOIN barang b   ON b.id = p.barang_id
    WHERE (${statusFilter}::text IS NULL OR p.status = ${statusFilter})
      AND (${bulanFilter}::text IS NULL
           OR to_char(p.tanggal_pinjam, 'YYYY-MM') = ${bulanFilter})
    ORDER BY p.created_at DESC
  `) as unknown as Record<string, unknown>[];

  const header = [
    "ID",
    "NIP",
    "Nama Pegawai",
    "Kode Barang",
    "Nama Barang",
    "Jumlah",
    "Satuan",
    "Keperluan",
    "Status",
    "Tanggal Pinjam",
    "Catatan Admin",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.nip,
        r.nama_pengguna,
        r.kode_barang,
        r.nama_barang,
        r.jumlah,
        r.satuan,
        r.keperluan,
        r.status,
        r.tanggal_pinjam,
        r.catatan_admin,
      ]
        .map(csvCell)
        .join(",")
    ),
  ];

  const suffix = [statusFilter, bulanFilter].filter(Boolean).join("-");
  const filename = `laporan-permintaan${suffix ? `-${suffix}` : ""}.csv`;

  // BOM (U+FEFF) agar Excel membaca UTF-8 dengan benar
  const bom = String.fromCharCode(0xfeff);
  return new NextResponse(bom + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
