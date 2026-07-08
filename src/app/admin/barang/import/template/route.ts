import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateTemplate } from "@/lib/import-excel";

export async function GET() {
  try {
    await requireAdmin();

    const buffer = generateTemplate();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="template-barang.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
