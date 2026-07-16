/**
 * Seed database dari Data Persediaan.xlsx.
 *
 * Jalankan:  node scripts/seed-from-excel.mjs
 *
 * Skrip ini:
 *   1. Membaca Data Persediaan.xlsx
 *   2. Mem-parse hierarki Kategori (117xxx) → Jenis (1010xxxxxx) → Barang
 *   3. Menambah kolom `jenis` ke tabel barang (bila belum ada)
 *   4. Menghapus data barang placeholder lama yang tidak ada di Excel
 *   5. Menyisipkan semua barang dari Excel ke database
 *
 * Aman dijalankan berulang — menggunakan ON CONFLICT untuk upsert.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import XLSX from "xlsx";

// ---- muat .env.local secara manual ----
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

// ---- Parse Excel ----
function parseExcel() {
  const filePath = resolve(process.cwd(), "Data Persediaan.xlsx");
  if (!existsSync(filePath)) {
    console.error(`[GAGAL] File tidak ditemukan: ${filePath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  const items = [];
  let currentKategori = null;
  let currentJenis = null;
  let itemCounter = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const kode = row[0];
    const nama = (row[2] || row[1] || "").toString().trim();

    if (!nama || nama === "") continue;

    // Kategori: kode 117xxx (6 digit, 117000-117999)
    if (typeof kode === "number" && kode >= 117000 && kode < 118000) {
      currentKategori = nama;
      currentJenis = null;
      itemCounter = 0;
      continue;
    }

    // Jenis: kode 1010xxxxxx (10 digit, starts with 1010)
    if (typeof kode === "number" && kode >= 1010000000 && kode < 1020000000) {
      currentJenis = nama;
      itemCounter = 0;
      continue;
    }

    // Skip header rows and summary rows
    if (typeof kode === "string") continue;
    if (currentKategori === null || currentJenis === null) continue;

    // This is a barang item (has a numeric code that's not a kategori/jenis code)
    if (typeof kode === "number" && kode < 117000) {
      itemCounter++;
      // Format kode: kode_jenis + nomor_urut (3 digit, padded)
      // Find the jenis kode from context — we need to track it
      const kodeBarang = `${currentJenis.replace(/[^a-zA-Z0-9]/g, "").substring(0, 10)}${String(itemCounter).padStart(3, "0")}`;

      items.push({
        kode: kodeBarang,
        nama,
        kategori: currentKategori,
        jenis: currentJenis,
        satuan: "pcs",
        stok: 0,
      });
    }
  }

  return items;
}

// Better approach: track jenis code number for the kode_barang
function parseExcelV2() {
  const filePath = resolve(process.cwd(), "Data Persediaan.xlsx");
  if (!existsSync(filePath)) {
    console.error(`[GAGAL] File tidak ditemukan: ${filePath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  const items = [];
  let currentKategori = null;
  let currentJenisNama = null;
  let currentJenisKode = null;
  let itemCounter = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const kode = row[0];
    const nama = (row[2] || row[1] || "").toString().trim();

    if (!nama || nama === "") continue;

    // Kategori: kode 117xxx (6 digit, 117000-117999)
    if (typeof kode === "number" && kode >= 117000 && kode < 118000) {
      currentKategori = nama;
      currentJenisNama = null;
      currentJenisKode = null;
      itemCounter = 0;
      continue;
    }

    // Jenis: kode 1010xxxxxx (10 digit, starts with 1010)
    if (typeof kode === "number" && kode >= 1010000000 && kode < 1020000000) {
      currentJenisNama = nama;
      currentJenisKode = String(kode);
      itemCounter = 0;
      continue;
    }

    // Skip header rows and summary rows
    if (typeof kode === "string") continue;
    if (currentKategori === null || currentJenisNama === null) continue;

    // This is a barang item
    if (typeof kode === "number" && kode < 117000) {
      itemCounter++;
      // Kode format: jenisKode + nomorUrut (3 digit padded) — tanpa strip
      const kodeBarang = `${currentJenisKode}${String(itemCounter).padStart(3, "0")}`;

      items.push({
        kode: kodeBarang,
        nama,
        kategori: currentKategori,
        jenis: currentJenisNama,
        satuan: "pcs",
        stok: 0,
      });
    }
  }

  return items;
}

async function main() {
  console.log(">>> PINJAM/ATK — seed data dari Data Persediaan.xlsx\n");

  // ---- Step 1: Add jenis column ----
  console.log(">>> Menambah kolom jenis ke tabel barang...");
  await sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'barang' AND column_name = 'jenis'
      ) THEN
        ALTER TABLE barang ADD COLUMN jenis VARCHAR(100) NOT NULL DEFAULT '';
      END IF;
    END $$;
  `;
  console.log("    Kolom jenis siap.\n");

  // ---- Step 2: Widen kode column to accommodate longer codes ----
  console.log(">>> Memperlebar kolom kode barang...");
  await sql`
    ALTER TABLE barang ALTER COLUMN kode TYPE VARCHAR(30)
  `;
  console.log("    Kolom kode diperlebar ke VARCHAR(30).\n");

  // ---- Step 3: Parse Excel ----
  console.log(">>> Membaca Data Persediaan.xlsx...");
  const items = parseExcelV2();
  console.log(`    Ditemukan ${items.length} barang dari Excel.\n`);

  // Show summary
  const categories = {};
  for (const item of items) {
    if (!categories[item.kategori]) {
      categories[item.kategori] = {};
    }
    if (!categories[item.kategori][item.jenis]) {
      categories[item.kategori][item.jenis] = 0;
    }
    categories[item.kategori][item.jenis]++;
  }

  console.log("    Ringkasan:");
  for (const [kat, jenisMap] of Object.entries(categories)) {
    const total = Object.values(jenisMap).reduce((a, b) => a + b, 0);
    console.log(`    📁 ${kat} (${total} barang, ${Object.keys(jenisMap).length} jenis)`);
    for (const [jenis, count] of Object.entries(jenisMap)) {
      console.log(`       └─ ${jenis}: ${count} barang`);
    }
  }
  console.log();

  // ---- Step 4: Delete old placeholder data ----
  console.log(">>> Menghapus data barang placeholder lama...");
  
  // Check for existing placeholder items (ATK-xxx, KRT-xxx, ARS-xxx, PRK-xxx patterns)
  const placeholderPrefixes = ["ATK-", "KRT-", "ARS-", "PRK-"];
  let deletedCount = 0;
  
  for (const prefix of placeholderPrefixes) {
    try {
      const result = await sql`
        DELETE FROM barang 
        WHERE kode LIKE ${prefix + '%'}
        AND NOT EXISTS (
          SELECT 1 FROM permintaan WHERE barang_id = barang.id
        )
        RETURNING id
      `;
      deletedCount += result.length;
    } catch (e) {
      // Some might have foreign key constraints
      console.log(`    ⚠ Beberapa barang ${prefix}* tidak bisa dihapus (ada permintaan terkait).`);
    }
  }
  console.log(`    ${deletedCount} barang placeholder dihapus.\n`);

  // ---- Step 5: Insert all items from Excel ----
  console.log(">>> Memasukkan data barang dari Excel...");
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const item of items) {
    try {
      const result = await sql`
        INSERT INTO barang (kode, nama, kategori, jenis, satuan, stok)
        VALUES (${item.kode}, ${item.nama}, ${item.kategori}, ${item.jenis}, ${item.satuan}, ${item.stok})
        ON CONFLICT (kode) DO UPDATE SET
          nama = EXCLUDED.nama,
          kategori = EXCLUDED.kategori,
          jenis = EXCLUDED.jenis
        RETURNING (xmax = 0) AS is_insert
      `;
      if (result[0]?.is_insert) {
        inserted++;
      } else {
        updated++;
      }
    } catch (e) {
      errors++;
      console.error(`    ✗ Gagal: ${item.kode} — ${item.nama}: ${e.message}`);
    }
  }

  console.log(`    ✓ ${inserted} barang baru ditambahkan.`);
  if (updated > 0) console.log(`    ↻ ${updated} barang diperbarui.`);
  if (errors > 0) console.log(`    ✗ ${errors} barang gagal.`);

  // ---- Verify ----
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM barang`;
  console.log(`\n>>> Total barang di database: ${n}`);
  console.log(">>> Selesai!");
}

main().catch((e) => {
  console.error("[GAGAL] Seed error:", e.message ?? e);
  process.exit(1);
});
