import Link from "next/link";
import { db } from "@/lib/db";

interface LowStockItem {
  id: number;
  kode: string;
  nama: string;
  stok: number;
  min_stok: number;
  kategori: string;
}

export async function LowStockAlert() {
  const sql = db();
  
  const lowStockItems = (await sql`
    SELECT id, kode, nama, stok, min_stok, kategori
    FROM barang
    WHERE stok <= min_stok
    ORDER BY (stok - min_stok) ASC, nama ASC
    LIMIT 10
  `) as unknown as LowStockItem[];

  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="neu-card border-l-4 border-red-500">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-dark">
          <span className="text-red-600">⚠️</span>
          Stok Menipis
        </h3>
        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
          {lowStockItems.length} Item
        </span>
      </div>

      <div className="space-y-3">
        {lowStockItems.map((item) => {
          const percentage = (item.stok / item.min_stok) * 100;
          const isCritical = percentage < 50;

          return (
            <Link
              key={item.id}
              href={`/admin/barang?search=${item.kode}`}
              className="block neu-raised-sm p-3 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-dark">
                    {item.kode} - {item.nama}
                  </p>
                  <p className="text-xs text-text-muted">{item.kategori}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isCritical ? "text-red-600" : "text-orange-600"}`}>
                    {item.stok}
                  </p>
                  <p className="text-xs text-text-muted">
                    min: {item.min_stok}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                <div
                  className={`h-full transition-all ${
                    isCritical ? "bg-red-600" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/admin/barang"
        className="mt-4 block text-center text-sm font-bold text-primary hover:underline"
      >
        Lihat Semua Barang →
      </Link>
    </div>
  );
}
