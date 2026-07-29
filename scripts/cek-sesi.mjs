/**
 * Menguji pencabutan sesi tanpa menyentuh data apa pun.
 *
 * Cookie sesi diterbitkan sendiri memakai AUTH_SECRET, sehingga skenario
 * "token tidak selaras dengan basis data" bisa diuji tanpa mengubah baris
 * pengguna mana pun. Yang dijaga di sini adalah risiko terbesar rancangan
 * sesi: pantulan tanpa henti antara middleware dan requireSession.
 *
 * Jalankan (server dev harus hidup):
 *   npm run dev
 *   npm run cek:sesi
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { SignJWT } from "jose/jwt/sign";

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

if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
  console.error("DATABASE_URL dan AUTH_SECRET wajib ada di .env.local.");
  process.exit(1);
}

const BASE = process.env.BASE ?? "http://localhost:3000";
const COOKIE = "pinjamatk_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const sql = neon(process.env.DATABASE_URL);

async function cookieUntuk(payload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("28800s")
    .sign(secret);
  return `${COOKIE}=${token}`;
}

/**
 * Mengikuti rantai redirect dengan cookie jar sungguhan — Set-Cookie dari
 * respons diterapkan ke permintaan berikutnya, persis seperti peramban.
 * Tanpa ini, penghapusan cookie oleh /sesi-berakhir tidak terlihat dan
 * pengujian melaporkan loop palsu.
 */
async function telusuri(path, cookieAwal, maks = 12) {
  const jar = new Map();
  for (const bagian of cookieAwal.split(";")) {
    const [k, ...v] = bagian.trim().split("=");
    if (k) jar.set(k, v.join("="));
  }

  const jejak = [];
  let url = `${BASE}${path}`;

  for (let i = 0; i < maks; i++) {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(url, {
      headers: cookie ? { cookie } : {},
      redirect: "manual",
    });

    const diset = res.headers.getSetCookie?.() ?? [];
    for (const sc of diset) {
      const [pasangan, ...atribut] = sc.split(";");
      const [k, ...v] = pasangan.trim().split("=");
      const nilai = v.join("=");
      const kedaluwarsa = atribut.some((a) =>
        /^\s*max-age\s*=\s*0\s*$/i.test(a)
      );
      if (nilai === "" || kedaluwarsa) jar.delete(k);
      else jar.set(k, nilai);
    }

    jejak.push(
      `${new URL(url).pathname}${new URL(url).search} -> ${res.status}` +
        (diset.length ? `  [set-cookie: ${diset.join(" | ")}]` : "")
    );

    const lokasi = res.headers.get("location");
    if (!lokasi) return { jejak, akhir: new URL(url), loop: false };
    url = new URL(lokasi, url).href;
  }
  return { jejak, akhir: new URL(url), loop: true };
}

let gagal = 0;
function periksa(nama, lulus, detail) {
  console.log(`${lulus ? "  OK  " : " GAGAL"}  ${nama}`);
  if (detail) console.log(`         ${detail}`);
  if (!lulus) gagal++;
}

try {
  await fetch(BASE, { redirect: "manual" });
} catch {
  console.error(`Server tidak menjawab di ${BASE}. Jalankan "npm run dev".`);
  process.exit(1);
}

const [korban] = await sql`
  SELECT id, nip, nama FROM pengguna
  WHERE role = 'user' AND password_hash IS NOT NULL AND dihapus_pada IS NULL
  LIMIT 1
`;

console.log("--- 1. /sesi-berakhir tanpa cookie sama sekali ---");
{
  // Pengunjung anonim dicegat middleware lebih dulu dan tidak pernah mencapai
  // Route Handler — memang tidak ada sesi untuk dicabut. Jalur nyata selalu
  // membawa cookie, dan itu diuji pada bagian 2 dan 3.
  const res = await fetch(`${BASE}/sesi-berakhir`, { redirect: "manual" });
  const lokasi = res.headers.get("location") ?? "";
  periksa(
    "dicegat middleware ke /login",
    lokasi.includes("/login"),
    `location: ${lokasi}`
  );
}

console.log("\n--- 2. Token menunjuk pengguna yang tidak ada ---");
{
  const cookie = await cookieUntuk({
    id: 999999,
    nip: "99999999",
    nama: "Hantu",
    role: "admin",
  });
  const { jejak, akhir, loop } = await telusuri("/admin", cookie);
  periksa("tidak terjadi loop redirect", !loop, jejak.join("\n         "));
  periksa(
    "mendarat di /login dengan pesan sesi",
    akhir.pathname === "/login" && akhir.searchParams.get("err") === "sesi",
    `akhir: ${akhir.pathname}${akhir.search}`
  );
}

if (korban) {
  console.log(
    `\n--- 3. Token mengaku admin, basis data bilang user (id ${korban.id}) ---`
  );
  const cookie = await cookieUntuk({
    id: korban.id,
    nip: korban.nip,
    nama: korban.nama,
    role: "admin",
  });
  const { jejak, akhir, loop } = await telusuri("/admin", cookie);
  periksa("tidak terjadi loop redirect", !loop, jejak.join("\n         "));
  periksa(
    "mendarat di /login dengan pesan sesi",
    akhir.pathname === "/login" && akhir.searchParams.get("err") === "sesi",
    `akhir: ${akhir.pathname}${akhir.search}`
  );

  console.log("\n--- 4. Token selaras (role user) tetap bisa masuk ---");
  const sah = await cookieUntuk({
    id: korban.id,
    nip: korban.nip,
    nama: korban.nama,
    role: "user",
  });
  const { akhir: akhirSah, loop: loopSah } = await telusuri("/dashboard", sah);
  periksa("tidak terjadi loop redirect", !loopSah);
  periksa(
    "tetap di /dashboard",
    akhirSah.pathname === "/dashboard",
    `akhir: ${akhirSah.pathname}${akhirSah.search}`
  );
} else {
  console.log("\n(lewati 3 & 4: tidak ada pengguna aktif berperan user)");
}

console.log(
  gagal === 0 ? "\nSemua pemeriksaan lulus." : `\n${gagal} pemeriksaan gagal.`
);
process.exit(gagal === 0 ? 0 : 1);
