import Link from "next/link";
import { db } from "@/lib/db";
import { Icon } from "./icon";

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
    <div className="neu-card border-l-[3px] border-l-warning hover:transform-none">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-text">
          <Icon name="alert" className="text-warning" />
          Stok Menipis
        </h3>
        <span className="badge badge-warning tnum">
          {lowStockItems.length} item
        </span>
      </div>

      <div className="space-y-3">
        {lowStockItems.map((item) => {
          const percentage = (item.stok / item.min_stok) * 100;
          const isCritical = percentage < 50;

          return (
            <Link
              key={item.id}
              href={`/admin/barang?q=${encodeURIComponent(item.kode)}`}
              className="neu-raised-sm block p-3 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">
                    <span className="font-mono text-[13px]">{item.kode}</span>{" "}
                    — {item.nama}
                  </p>
                  <p className="text-xs text-text-muted">{item.kategori}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`tnum text-lg font-extrabold ${
                      isCritical ? "text-danger" : "text-warning"
                    }`}
                  >
                    {item.stok}
                  </p>
                  <p className="text-xs text-text-muted">min: {item.min_stok}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-mid">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCritical ? "bg-danger" : "bg-warning"
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
        Lihat Semua Barang
      </Link>
    </div>
  );
}
