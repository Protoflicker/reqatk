/**
 * Setup database Neon untuk PINJAM/ATK.
 *
 * Jalankan:  npm run db:setup
 *
 * Skrip ini:
 *   1. Membuat tabel pengguna, barang, dan peminjaman (bila belum ada)
 *   2. Menanam akun admin + user contoh (bila tabel pengguna kosong)
 *   3. Menanam katalog barang contoh (bila tabel barang kosong)
 *
 * Aman dijalankan berulang — tidak menimpa data yang sudah ada.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// ---- muat .env.local secara manual agar tidak bergantung pada dotenv ----
function loadEnvLocal() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  const content = readFileSync(file, "utf8");
  for (const line of content.split(/\r?\n/)) {
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

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "[GAGAL] DATABASE_URL tidak ditemukan.\n" +
      "        Salin .env.example menjadi .env.local lalu isi connection string Neon."
  );
  process.exit(1);
}

const sql = neon(url);

const BARANG_CONTOH = [
  ["ATK-001", "Pulpen Gel Hitam 0.5", "Alat Tulis", "pcs", 60],
  ["ATK-002", "Pensil 2B", "Alat Tulis", "pcs", 48],
  ["ATK-003", "Spidol Whiteboard Hitam", "Alat Tulis", "pcs", 24],
  ["ATK-004", "Penghapus Whiteboard", "Alat Tulis", "pcs", 10],
  ["KRT-001", "Kertas HVS A4 70gsm", "Kertas", "rim", 30],
  ["KRT-002", "Kertas HVS F4 70gsm", "Kertas", "rim", 20],
  ["KRT-003", "Amplop Putih Panjang", "Kertas", "box", 15],
  ["KRT-004", "Sticky Notes 76x76", "Kertas", "pad", 40],
  ["ARS-001", "Map Ordner Besar", "Arsip", "pcs", 25],
  ["ARS-002", "Stopmap Folio", "Arsip", "pcs", 100],
  ["ARS-003", "Binder Clip No. 200", "Arsip", "box", 18],
  ["PRK-001", "Stapler HD-10", "Perkakas", "pcs", 12],
  ["PRK-002", "Isi Staples No. 10", "Perkakas", "box", 50],
  ["PRK-003", "Gunting Kertas Sedang", "Perkakas", "pcs", 8],
  ["PRK-004", "Cutter Besar + Isi", "Perkakas", "pcs", 6],
];

async function main() {
  console.log(">>> PINJAM/ATK — setup database Neon");
  console.log(">>> Membuat tabel...");

  await sql`
    CREATE TABLE IF NOT EXISTS pengguna (
      id            SERIAL PRIMARY KEY,
      nip           VARCHAR(30) UNIQUE NOT NULL,
      nama          VARCHAR(100) NOT NULL,
      password_hash TEXT NOT NULL,
      role          VARCHAR(10) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS barang (
      id         SERIAL PRIMARY KEY,
      kode       VARCHAR(20) UNIQUE NOT NULL,
      nama       VARCHAR(100) NOT NULL,
      kategori   VARCHAR(50) NOT NULL,
      satuan     VARCHAR(20) NOT NULL DEFAULT 'pcs',
      stok       INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
      min_stok   INTEGER NOT NULL DEFAULT 10,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS peminjaman (
      id              SERIAL PRIMARY KEY,
      pengguna_id     INTEGER NOT NULL REFERENCES pengguna(id) ON DELETE RESTRICT,
      barang_id       INTEGER NOT NULL REFERENCES barang(id) ON DELETE RESTRICT,
      jumlah          INTEGER NOT NULL CHECK (jumlah > 0),
      keperluan       TEXT NOT NULL,
      status          VARCHAR(15) NOT NULL DEFAULT 'MENUNGGU',
      tanggal_pinjam  DATE NOT NULL DEFAULT CURRENT_DATE,
      catatan_admin   TEXT,
      status_return   VARCHAR(20) DEFAULT 'BELUM_DIKEMBALIKAN',
      tanggal_kembali DATE,
      catatan_kembali TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // ---- migrasi dari skema lama (yang masih punya alur pengembalian) ----
  // Aman dijalankan berulang; pada database baru semua ini tidak berefek.
  await sql`
    UPDATE peminjaman SET status = 'DISETUJUI' WHERE status = 'DIKEMBALIKAN'
  `;
  await sql`
    ALTER TABLE peminjaman DROP COLUMN IF EXISTS tanggal_kembali
  `;
  await sql`
    ALTER TABLE peminjaman DROP CONSTRAINT IF EXISTS peminjaman_status_check
  `;
  await sql`
    ALTER TABLE peminjaman ADD CONSTRAINT peminjaman_status_check
    CHECK (status IN ('MENUNGGU', 'DISETUJUI', 'DITOLAK'))
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_peminjaman_pengguna
    ON peminjaman (pengguna_id, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_peminjaman_status
    ON peminjaman (status, created_at DESC)
  `;
  
  // Add min_stok column to existing barang table if not exists
  await sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barang' AND column_name = 'min_stok'
      ) THEN
        ALTER TABLE barang ADD COLUMN min_stok INTEGER NOT NULL DEFAULT 10;
      END IF;
    END $$;
  `;
  
  // Create notifications table
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
      type       VARCHAR(50) NOT NULL,
      title      VARCHAR(200) NOT NULL,
      message    TEXT NOT NULL,
      link       VARCHAR(500),
      read       BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications (user_id, read, created_at DESC)
  `;
  
  // Create activity_logs table for audit trail
  await sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES pengguna(id) ON DELETE SET NULL,
      action      VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id   INTEGER,
      details     JSONB,
      ip_address  VARCHAR(45),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user
    ON activity_logs (user_id, created_at DESC)
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
    ON activity_logs (entity_type, entity_id, created_at DESC)
  `;

  // Add return workflow columns to existing peminjaman table if not exists
  await sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'peminjaman' AND column_name = 'status_return'
      ) THEN
        ALTER TABLE peminjaman 
        ADD COLUMN status_return VARCHAR(20) DEFAULT 'BELUM_DIKEMBALIKAN',
        ADD COLUMN tanggal_kembali DATE,
        ADD COLUMN catatan_kembali TEXT;
      END IF;
    END $$;
  `;

  console.log("    Tabel siap: pengguna, barang, peminjaman, notifications, activity_logs");

  // ---- seed pengguna ----
  const [{ n: jumlahPengguna }] = await sql`
    SELECT COUNT(*)::int AS n FROM pengguna
  `;

  if (jumlahPengguna === 0) {
    console.log(">>> Menanam akun awal...");
    const hashAdmin = await bcrypt.hash("admin123", 10);
    const hashUser = await bcrypt.hash("user123", 10);
    await sql`
      INSERT INTO pengguna (nip, nama, password_hash, role) VALUES
        ('199001012015011001', 'Administrator Umum', ${hashAdmin}, 'admin'),
        ('199002022016012002', 'Budi Santoso', ${hashUser}, 'user')
    `;
    console.log("    Admin — NIP: 199001012015011001 / sandi: admin123");
    console.log("    User  — NIP: 199002022016012002 / sandi: user123");
    console.log("    (!) Segera ganti kedua sandi ini setelah login pertama.");
  } else {
    console.log(`>>> Lewati seed pengguna (sudah ada ${jumlahPengguna} akun).`);
  }

  // ---- seed barang ----
  const [{ n: jumlahBarang }] = await sql`
    SELECT COUNT(*)::int AS n FROM barang
  `;

  if (jumlahBarang === 0) {
    console.log(">>> Menanam katalog barang contoh...");
    for (const [kode, nama, kategori, satuan, stok] of BARANG_CONTOH) {
      await sql`
        INSERT INTO barang (kode, nama, kategori, satuan, stok)
        VALUES (${kode}, ${nama}, ${kategori}, ${satuan}, ${stok})
      `;
    }
    console.log(`    ${BARANG_CONTOH.length} barang ditambahkan.`);
  } else {
    console.log(`>>> Lewati seed barang (sudah ada ${jumlahBarang} barang).`);
  }

  console.log(">>> Selesai. Jalankan: npm run dev");
}

main().catch((e) => {
  console.error("[GAGAL] Setup database error:", e.message ?? e);
  process.exit(1);
});
