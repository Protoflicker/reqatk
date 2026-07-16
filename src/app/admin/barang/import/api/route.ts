import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ImportRow } from "@/lib/import-excel";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { data } = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data provided" },
        { status: 400 }
      );
    }

    const sql = db();
    let imported = 0;
    let skipped = 0;

    // Import each item
    for (const item of data as ImportRow[]) {
      try {
        await sql`
          INSERT INTO barang (kode, nama, kategori, jenis, satuan, stok, min_stok)
          VALUES (
            ${item.kode},
            ${item.nama},
            ${item.kategori},
            ${item.jenis},
            ${item.satuan},
            ${item.stok},
            ${item.min_stok}
          )
          ON CONFLICT (kode) DO NOTHING
        `;
        imported++;
      } catch (error) {
        skipped++;
        console.error(`Failed to import ${item.kode}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: "Import failed" },
      { status: 500 }
    );
  }
}
