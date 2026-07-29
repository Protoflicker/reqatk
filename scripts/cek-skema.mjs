/**
 * Verifikasi skema dan data ReqATK — hanya membaca, tidak mengubah apa pun.
 *
 * Jalankan:  npm run db:cek
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum diatur. Lihat .env.example.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
let gagal = 0;

function periksa(nama, lulus, keterangan) {
  console.log(
    `${lulus ? "  OK  " : " GAGAL"}  ${nama}${keterangan ? ` — ${keterangan}` : ""}`
  );
  if (!lulus) gagal++;
}

const kolom = await sql`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
`;
const punya = (tabel, nama) =>
  kolom.some((k) => k.table_name === tabel && k.column_name === nama);

periksa("pengguna.dihapus_pada ada", punya("pengguna", "dihapus_pada"));
periksa("barang.min_stok ada", punya("barang", "min_stok"));

const tautanUsang = await sql`
  SELECT COUNT(*)::int AS n FROM notifications WHERE link LIKE '%peminjaman%'
`;
periksa(
  "tidak ada notifications.link menunjuk peminjaman",
  tautanUsang[0].n === 0,
  `${tautanUsang[0].n} baris tersisa`
);

// Kolom alur pengembalian dibuang pada Task 5. Sebelum tugas itu dikerjakan,
// tiga baris berikut memang masih GAGAL — itu diharapkan.
periksa(
  "permintaan.status_return sudah dibuang",
  !punya("permintaan", "status_return")
);
periksa(
  "permintaan.tanggal_kembali sudah dibuang",
  !punya("permintaan", "tanggal_kembali")
);
periksa(
  "permintaan.catatan_kembali sudah dibuang",
  !punya("permintaan", "catatan_kembali")
);

console.log(
  gagal === 0 ? "\nSemua pemeriksaan lulus." : `\n${gagal} pemeriksaan gagal.`
);
process.exit(gagal === 0 ? 0 : 1);
