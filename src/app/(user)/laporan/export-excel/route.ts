import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePeminjamanExcel, generateFilename } from "@/lib/excel";
import type { PeminjamanDetail } from "@/lib/definitions";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const sql = db();

    // Build query - only user's own data
    let query = sql`
      SELECT 
        p.id, p.jumlah, p.keperluan, p.status, 
        p.tanggal_pinjam, p.catatan_admin,
        u.nip, u.nama AS nama_pengguna,
        b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
      FROM peminjaman p
      JOIN pengguna u ON u.id = p.pengguna_id
      JOIN barang b ON b.id = p.barang_id
      WHERE p.pengguna_id = ${session.id}
    `;

    // Apply status filter
    if (status && status !== "ALL") {
      query = sql`${query} AND p.status = ${status}`;
    }

    query = sql`${query} ORDER BY p.created_at DESC`;

    const data = (await query) as unknown as PeminjamanDetail[];

    // Calculate summary
    const summary = {
      total: data.length,
      approved: data.filter((d) => d.status === "DISETUJUI").length,
      pending: data.filter((d) => d.status === "MENUNGGU").length,
      rejected: data.filter((d) => d.status === "DITOLAK").length,
    };

    // Generate Excel
    const buffer = generatePeminjamanExcel(data, summary);
    const filename = generateFilename(`laporan_${session.nip}`);

    // Return Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
