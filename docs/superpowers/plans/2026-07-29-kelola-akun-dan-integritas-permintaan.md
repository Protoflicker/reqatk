# Kelola Akun & Integritas Permintaan — Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memangkas Kelola Pengguna menjadi tiga aksi (daftar NIP, nonaktifkan, ganti role), membuat pencabutan akses berlaku seketika, mempertahankan riwayat setelah pengguna dihapus, dan menutup dua belas temuan audit backend.

**Architecture:** Sesi JWT berhenti dipercaya begitu saja — `requireSession()` mencocokkannya ke basis data setiap request, dan ketidakcocokan dialihkan ke Route Handler `/sesi-berakhir` yang menghapus cookie. Penghapusan pengguna menjadi soft delete (`dihapus_pada`) sehingga JOIN laporan tetap menemukan nama dan NIP pemohon. Aksi permintaan memakai `RETURNING` agar audit log dan notifikasi hanya terbit ketika baris benar-benar berubah.

**Tech Stack:** Next.js 15 (App Router, Server Actions), React 19, TypeScript, Neon Postgres (`@neondatabase/serverless`), Tailwind v4, jose (JWT), bcryptjs.

**Spesifikasi:** `docs/superpowers/specs/2026-07-29-kelola-akun-dan-integritas-permintaan-design.md`

## Global Constraints

- **Tidak ada framework test di proyek ini.** Siklus verifikasi tiap tugas adalah `npx tsc --noEmit` + `node scripts/cek-skema.mjs` + langkah manual di peramban. Jangan memasang Jest/Vitest — penambahan test berada di luar cakupan yang disetujui.
- **Jangan pakai `sql.unsafe`.** Seluruh nilai dinamis dikirim sebagai parameter tagged-template Neon.
- **`src/lib/notifications.ts` haram diimpor dari komponen klien.** Aksesnya selalu lewat `await import("./notifications")` di dalam Server Action.
- **`src/middleware.ts` tidak boleh mengimpor `src/lib/db.ts`.** Middleware berjalan di Edge runtime dan harus tetap bebas basis data.
- **Setiap `redirect()` wajib berada di luar blok `try`.** Next.js menjalankannya dengan melempar `NEXT_REDIRECT`; `catch` akan menelannya dan aksinya diam-diam gagal.
- Nama cookie sesi tetap `pinjamatk_session` dan merek tetap **ReqATK** — nama lama di cookie/localStorage sengaja dipertahankan.
- Komentar kode ditulis dalam bahasa Indonesia, mengikuti gaya berkas di sekitarnya.
- Commit tanpa atribusi co-author.
- **Nomor baris hanya sahih pada tugas yang pertama kali menyentuh sebuah berkas.** `src/lib/actions.ts` diedit oleh Task 3–9 dan menyusut sekitar 130 baris di sepanjang rencana ini. Selalu cari berdasarkan nama fungsi atau potongan kode yang dikutip, bukan berdasarkan nomor baris.

## Urutan & Ketergantungan

```
Task 1 (skema aditif)
  ├─> Task 2 (sesi terikat DB)  ─┐
  └─> Task 4 (soft delete)      ─┤
Task 3 (role-only) ──────────────┤
Task 5 (buang alur pengembalian) ┤  saling bebas setelah Task 1
Task 6 (tolak jujur + stok)  ────┤
Task 7 (operasi massal) ─────────┤  Task 7 butuh helper dari Task 6
Task 8 (tanggal + duplikat) ─────┤
Task 9 (min_stok) ───────────────┤
Task 10 (pesan error + IP) ──────┘
```

Task 1 sengaja **hanya aditif** — penghapusan kolom alur pengembalian ditunda ke Task 5 supaya aplikasi tetap jalan di antara tugas.

---

### Task 1: Migrasi skema aditif dan perbaikan tautan notifikasi

**Files:**
- Modify: `scripts/setup-db.mjs` (sisipkan setelah blok `DO $$` penambah kolom `jenis`, sekitar baris 157)
- Create: `scripts/cek-skema.mjs`
- Modify: `package.json` (tambah skrip `db:cek`)

**Interfaces:**
- Produces: kolom `pengguna.dihapus_pada TIMESTAMPTZ` (NULL = aktif), dipakai Task 2 dan Task 4. Perintah `npm run db:cek` dipakai sebagai verifikasi di seluruh tugas berikutnya.

- [ ] **Step 1: Tambahkan migrasi ke `scripts/setup-db.mjs`**

Sisipkan tepat setelah blok `DO $$` yang menambahkan kolom `jenis` (akhir baris 157), sebelum komentar `// Create notifications table`:

```js
  // ---- soft delete pengguna ----
  // Baris pengguna tidak pernah benar-benar dihapus supaya riwayat permintaan
  // tetap memiliki nama dan NIP pemohonnya. NULL = akun masih aktif.
  await sql`
    ALTER TABLE pengguna ADD COLUMN IF NOT EXISTS dihapus_pada TIMESTAMPTZ
  `;

  // ---- tautan notifikasi dari sebelum rename peminjaman → permintaan ----
  // migrate-rename.mjs hanya mengurus tabel, constraint, index, dan sequence;
  // nilai kolom notifications.link terlewat sehingga baris lama menunjuk ke
  // rute yang sudah tidak ada.
  await sql`
    UPDATE notifications
    SET link = replace(link, '/peminjaman', '/permintaan')
    WHERE link LIKE '%peminjaman%'
  `;
```

- [ ] **Step 2: Buat `scripts/cek-skema.mjs`**

```js
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
  console.log(`${lulus ? "  OK  " : " GAGAL"}  ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
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
periksa("permintaan.status_return sudah dibuang", !punya("permintaan", "status_return"));
periksa("permintaan.tanggal_kembali sudah dibuang", !punya("permintaan", "tanggal_kembali"));
periksa("permintaan.catatan_kembali sudah dibuang", !punya("permintaan", "catatan_kembali"));

console.log(gagal === 0 ? "\nSemua pemeriksaan lulus." : `\n${gagal} pemeriksaan gagal.`);
process.exit(gagal === 0 ? 0 : 1);
```

- [ ] **Step 3: Daftarkan skrip di `package.json`**

Tambahkan di dalam `"scripts"`, setelah baris `"db:setup"`:

```json
    "db:cek": "node scripts/cek-skema.mjs",
```

- [ ] **Step 4: Jalankan migrasi**

Run: `npm run db:setup`
Expected: selesai tanpa error, mencetak `Tabel siap: ...`

- [ ] **Step 5: Jalankan lagi untuk membuktikan idempoten**

Run: `npm run db:setup`
Expected: selesai tanpa error, hasil sama persis

- [ ] **Step 6: Verifikasi**

Run: `npm run db:cek`
Expected: `pengguna.dihapus_pada ada` → OK, `tidak ada notifications.link menunjuk peminjaman` → OK. Tiga pemeriksaan kolom pengembalian masih GAGAL — itu benar, dibereskan di Task 5.

- [ ] **Step 7: Commit**

```bash
git add scripts/setup-db.mjs scripts/cek-skema.mjs package.json
git commit -m "Add soft delete column and repair stale notification links"
```

---

### Task 2: Sesi terikat basis data

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/app/sesi-berakhir/route.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/layout.tsx:20`

**Interfaces:**
- Consumes: `pengguna.dihapus_pada` dari Task 1.
- Produces: `requireSession()` dan `requireAdmin()` mengembalikan `SessionPayload` yang berasal dari basis data, bukan dari token. Seluruh tugas berikutnya bergantung pada jaminan ini.

- [ ] **Step 1: Tulis ulang `src/lib/auth.ts`**

Ganti seluruh isi berkas:

```ts
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session";

/**
 * Route Handler yang menghapus cookie sesi lalu mengalihkan ke /login.
 *
 * requireSession() tidak bisa menghapus cookie sendiri — Server Component
 * dilarang memodifikasi cookie oleh Next.js. Sekadar redirect ke /login juga
 * tidak cukup: middleware masih melihat token yang sah dan memantulkannya
 * kembali, sehingga terjadi loop redirect tak berujung.
 */
const SESI_BERAKHIR = "/sesi-berakhir";

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Memuat pengguna yang masih berhak memakai aplikasi: ada, sudah aktivasi,
 * dan belum dihapus. cache() dari React membuatnya satu query per request
 * walau requireSession dipanggil beberapa kali dalam satu render (halaman
 * plus getNotifications di app-shell).
 */
const muatPengguna = cache(
  async (id: number): Promise<SessionPayload | null> => {
    const sql = db();
    const rows = (await sql`
      SELECT id, nip, nama, role
      FROM pengguna
      WHERE id = ${id}
        AND password_hash IS NOT NULL
        AND dihapus_pada IS NULL
      LIMIT 1
    `) as unknown as SessionPayload[];
    return rows[0] ?? null;
  }
);

/**
 * Wajib login. Isi token tidak dipercaya begitu saja: selalu dicocokkan ke
 * basis data supaya Reset, penggantian role, dan penghapusan pengguna
 * berlaku seketika — bukan setelah token kedaluwarsa delapan jam.
 */
export async function requireSession(): Promise<SessionPayload> {
  const token = await getSession();
  if (!token) redirect("/login");

  const user = await muatPengguna(token.id);
  // Akun hilang, direset menjadi nonaktif, atau dihapus.
  if (!user) redirect(SESI_BERAKHIR);
  // Role berubah sejak token terbit; login ulang agar keduanya selaras.
  if (user.role !== token.role) redirect(SESI_BERAKHIR);

  return user;
}

/** Wajib admin; user biasa dilempar ke dashboard-nya. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}
```

- [ ] **Step 2: Buat `src/app/sesi-berakhir/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Mengakhiri sesi yang sudah tidak selaras dengan basis data.
 *
 * Route Handler adalah satu-satunya tempat yang boleh menghapus cookie
 * sekaligus mengalihkan, sehingga tidak terjadi loop dengan middleware.
 */
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?err=sesi", request.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
```

`src/middleware.ts` **tidak diubah**: `/sesi-berakhir` tidak cocok dengan `USER_PATHS` maupun awalan `/admin`, sehingga lolos apa adanya untuk sesi user maupun admin.

- [ ] **Step 3: Tampilkan pesan di halaman login**

Di `src/app/login/page.tsx`, tambahkan import:

```ts
import { Alert } from "@/components/alert";
```

Ubah tanda tangan komponen menjadi async dan terima `searchParams`:

```tsx
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
```

Lalu sisipkan tepat sebelum `<LoginForm />` di dalam `<div className="animate-bounce-in ...">`:

```tsx
            {params.err === "sesi" && (
              <div className="mb-5">
                <Alert variant="error">
                  Sesi Anda berakhir karena ada perubahan pada akun. Silakan
                  masuk kembali.
                </Alert>
              </div>
            )}
```

- [ ] **Step 4: Perbaiki kalimat rusak sisa rename**

Dua berkas menyimpan kalimat `"Sistem permintaan dan permintaan alat tulis kantor"` — hasil rename `peminjaman` → `permintaan` yang menabrak kata di sebelahnya.

`src/app/layout.tsx`, di dalam `description` pada objek `metadata`:

```ts
    "Sistem permintaan dan pengelolaan alat tulis kantor berbasis NIP.",
```

`src/app/login/page.tsx`, di dalam paragraf `<p className="mt-8 max-w-[46ch] ...">`:

```tsx
            Sistem permintaan dan pengelolaan alat tulis kantor. Ajukan
```

- [ ] **Step 5: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: keluar tanpa output, exit code 0

- [ ] **Step 6: Verifikasi manual — Reset mencabut akses seketika**

Butuh dua peramban (atau satu normal + satu jendela penyamaran) agar dua sesi hidup bersamaan.

1. Jalankan `npm run dev`
2. Peramban B: login sebagai user biasa yang sudah aktivasi, buka `/dashboard`
3. Peramban A: login sebagai admin, buka `/admin/pengguna`, tekan **Reset** pada user tersebut
4. Peramban B: klik menu apa pun

Expected: peramban B mendarat di `/login` dengan pesan "Sesi Anda berakhir karena ada perubahan pada akun."
Sebelum perbaikan ini, B akan tetap bisa memakai aplikasi hingga delapan jam.

- [ ] **Step 7: Verifikasi manual — tidak ada loop redirect**

Diuji terpisah karena inilah risiko utama rancangan ini.

1. Buat admin kedua lewat basis data atau lewat tombol role setelah Task 3
2. Peramban B: login sebagai admin kedua, buka `/admin`
3. Peramban A: turunkan admin kedua menjadi User
4. Peramban B: muat ulang `/admin`

Expected: mendarat di `/login` dengan pesan sesi berakhir. **Bukan** pantulan `/admin` ↔ `/dashboard` berulang atau error `ERR_TOO_MANY_REDIRECTS`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth.ts src/app/sesi-berakhir/route.ts src/app/login/page.tsx src/app/layout.tsx
git commit -m "Verify sessions against the database on every request"
```

---

### Task 3: Kelola Pengguna menjadi ganti role saja

**Files:**
- Delete: `src/components/pengguna-form.tsx`
- Modify: `src/lib/actions.ts:937-999` (ganti `simpanPengguna` menjadi `ubahRole`)
- Modify: `src/app/admin/pengguna/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin()` dari Task 2.
- Produces: `ubahRole(id: number, formData: FormData): Promise<void>` — Server Action yang dipanggil lewat `action={ubahRole.bind(null, u.id)}`.

- [ ] **Step 1: Hapus komponen form**

```bash
git rm src/components/pengguna-form.tsx
```

Berkas ini satu-satunya jalan bagi admin untuk menulis `nama` dan `password_hash` milik orang lain. Setelah hilang, kedua data itu murni milik pemiliknya lewat alur aktivasi dan halaman Profil.

- [ ] **Step 2: Ganti `simpanPengguna` dengan `ubahRole`**

Di `src/lib/actions.ts`, hapus seluruh fungsi `simpanPengguna` (baris 937–999) dan letakkan di posisinya:

```ts
/**
 * Mengganti role pengguna. Satu-satunya data pengguna lain yang boleh diubah
 * admin — nama dan kata sandi adalah milik pemilik NIP sendiri.
 */
export async function ubahRole(id: number, formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const role = String(formData.get("role") ?? "");
  let err: string | null = null;

  if (role !== "admin" && role !== "user") {
    err = "gagal";
  } else if (id === session.id) {
    // Sistem ini hanya punya satu admin; menurunkan diri sendiri akan
    // mengunci semua orang dari /admin tanpa jalan pulih lewat aplikasi.
    err = "role-sendiri";
  } else {
    try {
      const sql = db();
      const target = (await sql`
        SELECT nip, role, password_hash IS NOT NULL AS aktif
        FROM pengguna
        WHERE id = ${id} AND dihapus_pada IS NULL
        LIMIT 1
      `) as { nip: string; role: Role; aktif: boolean }[];

      if (target.length === 0) {
        err = "gagal";
      } else if (role === "admin" && !target[0].aktif) {
        // Akun tanpa kata sandi bisa diklaim siapa pun yang tahu NIP-nya
        // lewat alur aktivasi publik. Mempromosikannya sama dengan
        // menyiapkan akun admin menganggur untuk diambil alih.
        err = "role-nonaktif";
      } else if (target[0].role !== role) {
        await sql`
          UPDATE pengguna SET role = ${role} WHERE id = ${id}
        `;
        await logActivity(session.id, "UPDATE_USER", "pengguna", id, {
          nip: target[0].nip,
          role_lama: target[0].role,
          role_baru: role,
        });
      }
    } catch (e) {
      console.error("ubahRole gagal:", e);
      err = "gagal";
    }
  }

  revalidatePath("/admin/pengguna");
  redirect(err ? `/admin/pengguna?err=${err}` : "/admin/pengguna?ok=role");
}
```

- [ ] **Step 3: Perbarui halaman Kelola Pengguna**

Di `src/app/admin/pengguna/page.tsx`:

Ganti lima baris import berurutan — dari `@/lib/actions` sampai `@/components/confirm-button` — menjadi empat baris berikut. Yang hilang hanyalah `PenggunaForm`; import `Alert`, `Icon`, `db`, `requireAdmin`, dan `formatTanggal` di sekitarnya tetap dipakai dan tidak boleh disentuh:

```ts
import { hapusPengguna, resetAktivasi, ubahRole } from "@/lib/actions";
import { PageHeader } from "@/components/page-header";
import { DaftarNipForm } from "@/components/daftar-nip-form";
import { ConfirmButton } from "@/components/confirm-button";
```

Hapus juga `import Link from "next/link";` di baris paling atas — setelah tombol Ubah diganti, `Link` tidak dipakai lagi di berkas ini dan akan memicu peringatan lint.

Ganti `OK_MSG` dan `ERR_MSG` menjadi:

```ts
const OK_MSG: Record<string, string> = {
  nip: "NIP berhasil didaftarkan. Pemilik NIP tinggal melakukan aktivasi saat login pertama.",
  role: "Role pengguna berhasil diperbarui.",
  reset:
    "Akun dinonaktifkan. Pemilik NIP harus mendaftarkan ulang nama dan kata sandi saat login berikutnya.",
};

const ERR_MSG: Record<string, string> = {
  sendiri: "Anda tidak dapat menghapus akun yang sedang dipakai.",
  "reset-sendiri": "Anda tidak dapat menonaktifkan akun yang sedang dipakai.",
  "reset-admin":
    "Akun admin tidak bisa dinonaktifkan (mencegah akun diambil alih). Jadikan User dulu bila ingin mencabut akses admin.",
  "role-sendiri":
    "Anda tidak dapat mengubah role akun yang sedang dipakai. Minta admin lain melakukannya.",
  "role-nonaktif":
    "Akun yang belum aktivasi tidak bisa dijadikan admin — akun tanpa kata sandi masih bisa diklaim siapa pun yang tahu NIP-nya. Tunggu pemiliknya aktivasi lebih dulu.",
  gagal: "Operasi gagal. Coba lagi.",
};
```

Hapus `edit` dari tipe `searchParams` sehingga menjadi:

```ts
  searchParams: Promise<{ ok?: string; err?: string }>;
```

Hapus kedua baris `const editId = ...` dan `const editData = ...`, serta blok render `{editData && ( <div className="mb-8"><PenggunaForm editData={editData} /></div> )}`.

Ganti seluruh elemen `<Link href={\`/admin/pengguna?edit=${u.id}\`} ...>` beserta isinya (ikon pensil dan teks "Ubah") dengan tombol role:

```tsx
                    {u.id !== session.id && (
                      <form
                        action={ubahRole.bind(null, u.id)}
                        className="contents"
                      >
                        <input
                          type="hidden"
                          name="role"
                          value={u.role === "admin" ? "user" : "admin"}
                        />
                        <ConfirmButton
                          message={
                            u.role === "admin"
                              ? `Jadikan ${u.nama || u.nip} sebagai User biasa? Akses admin-nya dicabut dan sesinya langsung berakhir.`
                              : `Jadikan ${u.nama || u.nip} sebagai Admin? Ia akan bisa mengelola barang, permintaan, dan pengguna.`
                          }
                          className="btn px-2.5 py-1 text-xs"
                        >
                          <Icon name={u.role === "admin" ? "user" : "shield"} />
                          {u.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                        </ConfirmButton>
                      </form>
                    )}
```

Terakhir, perbarui atribut `description` pada `<PageHeader title="Kelola Pengguna" ...>` menjadi:

```tsx
        description="Daftarkan NIP pegawai baru — pemilik NIP melengkapi nama dan kata sandi sendiri saat login pertama. Gunakan Reset untuk menonaktifkan akun, atau ubah role untuk memberi/mencabut akses admin."
```

- [ ] **Step 4: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0. Bila muncul error "Cannot find module '@/components/pengguna-form'", berarti masih ada import tersisa — hapus.

- [ ] **Step 5: Verifikasi manual**

1. `npm run dev`, login sebagai admin, buka `/admin/pengguna`
2. Tombol **Ubah** sudah tidak ada; barisnya kini menampilkan **Jadikan Admin** / **Jadikan User**
3. Baris milik diri sendiri tidak menampilkan tombol role sama sekali
4. Tekan **Jadikan Admin** pada akun berstatus *Belum aktivasi*
   Expected: pesan merah `role-nonaktif`
5. Tekan **Jadikan Admin** pada akun berstatus *Aktif*
   Expected: pesan hijau "Role pengguna berhasil diperbarui", badge berubah menjadi Admin

- [ ] **Step 6: Commit**

```bash
git add -A src/components/pengguna-form.tsx src/lib/actions.ts src/app/admin/pengguna/page.tsx
git commit -m "Reduce user management to role changes only"
```

---

### Task 4: Soft delete pengguna dan pemulihan NIP

**Files:**
- Modify: `src/lib/actions.ts` (`hapusPengguna`, `daftarkanNip`, `cekNip`, `login`)
- Modify: `src/lib/notifications.ts` (dua query pencarian admin)
- Modify: `src/app/admin/pengguna/page.tsx` (query daftar + pesan)

**Interfaces:**
- Consumes: `pengguna.dihapus_pada` dari Task 1.
- Produces: jaminan bahwa setiap query "akun aktif" menyaring `dihapus_pada IS NULL`, sementara query laporan tidak.

- [ ] **Step 1: Ubah `hapusPengguna` menjadi soft delete**

Ganti seluruh fungsi `hapusPengguna` di `src/lib/actions.ts`:

```ts
/**
 * Penghapusan pengguna bersifat soft delete: barisnya dipertahankan supaya
 * riwayat permintaan tetap memiliki nama dan NIP pemohonnya. password_hash
 * dikosongkan agar akun langsung tidak bisa dipakai login, dan sesi yang
 * sedang berjalan ikut putus lewat pemeriksaan di requireSession().
 */
export async function hapusPengguna(
  id: number,
  _formData: FormData
): Promise<void> {
  const session = await requireAdmin();

  let err: string | null = null;
  if (id === session.id) {
    err = "sendiri";
  } else {
    try {
      const sql = db();
      const target = (await sql`
        SELECT nip, nama, role FROM pengguna
        WHERE id = ${id} AND dihapus_pada IS NULL
        LIMIT 1
      `) as { nip: string; nama: string; role: Role }[];

      if (target.length === 0) {
        err = "gagal";
      } else if (target[0].role === "admin") {
        err = "hapus-admin";
      } else {
        await sql`
          UPDATE pengguna
          SET dihapus_pada = now(), password_hash = NULL
          WHERE id = ${id} AND dihapus_pada IS NULL
        `;
        await logActivity(session.id, "DELETE_USER", "pengguna", id, {
          nip: target[0].nip,
          nama: target[0].nama,
          role: target[0].role,
        });
      }
    } catch (e) {
      console.error("hapusPengguna gagal:", e);
      err = "gagal";
    }
  }

  revalidatePath("/admin/pengguna");
  redirect(err ? `/admin/pengguna?err=${err}` : "/admin/pengguna?ok=hapus");
}
```

- [ ] **Step 2: Buat `daftarkanNip` memulihkan NIP yang pernah dihapus**

Karena `pengguna.nip` bersifat `UNIQUE` dan baris soft-deleted tetap memegang NIP-nya, tanpa penanganan ini admin akan melihat "NIP sudah terdaftar" untuk akun yang tidak tampak di mana pun.

Di `daftarkanNip`, ganti mulai dari `try {` sampai `redirect("/admin/pengguna?ok=nip");` di akhir fungsi menjadi:

```ts
  let hasil = "nip";
  try {
    const sql = db();
    const ada = (await sql`
      SELECT id, dihapus_pada FROM pengguna WHERE nip = ${nip} LIMIT 1
    `) as { id: number; dihapus_pada: string | null }[];

    if (ada.length > 0 && ada[0].dihapus_pada === null) {
      return { error: `NIP ${nip} sudah terdaftar.` };
    }

    if (ada.length > 0) {
      // NIP menandai orang yang sama, jadi barisnya dipulihkan apa adanya
      // dan riwayat permintaan lamanya ikut tersambung kembali.
      await sql`
        UPDATE pengguna
        SET dihapus_pada = NULL, nama = '', password_hash = NULL, role = 'user'
        WHERE id = ${ada[0].id}
      `;
      await logActivity(session.id, "CREATE_USER", "pengguna", ada[0].id, {
        nip,
        status: "dipulihkan",
      });
      hasil = "nip-pulih";
    } else {
      const result = await sql`
        INSERT INTO pengguna (nip, nama, password_hash, role)
        VALUES (${nip}, '', NULL, 'user')
        RETURNING id
      `;
      const newId = (result[0] as { id: number }).id;
      await logActivity(session.id, "CREATE_USER", "pengguna", newId, {
        nip,
        status: "belum_aktivasi",
      });
    }
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return { error: `NIP ${nip} sudah terdaftar.` };
    }
    console.error("daftarkanNip gagal:", e);
    return { error: "Gagal mendaftarkan NIP. Coba lagi." };
  }

  revalidatePath("/admin/pengguna");
  redirect(`/admin/pengguna?ok=${hasil}`);
```

- [ ] **Step 3: Saring akun terhapus dari alur login**

Di `cekNip`, tambahkan syarat pada query yang memilih `nama, password_hash IS NOT NULL AS aktif`:

```ts
    const rows = (await sql`
      SELECT nama, password_hash IS NOT NULL AS aktif
      FROM pengguna
      WHERE nip = ${nip} AND dihapus_pada IS NULL
      LIMIT 1
    `) as { nama: string; aktif: boolean }[];
```

Di `login`, tambahkan syarat yang sama pada query yang memilih `id, nip, nama, password_hash, role`:

```ts
    const rows = (await sql`
      SELECT id, nip, nama, password_hash, role
      FROM pengguna
      WHERE nip = ${nip} AND dihapus_pada IS NULL
      LIMIT 1
    `) as {
```

Di `aktivasiAkun`, tambahkan syarat pada `WHERE` di `UPDATE pengguna` agar akun terhapus tidak bisa diklaim ulang lewat aktivasi:

```ts
      WHERE nip = ${nip} AND password_hash IS NULL AND role = 'user'
        AND dihapus_pada IS NULL
```

- [ ] **Step 4: Saring pencarian admin di `src/lib/notifications.ts`**

Di `notifyAdminsNewRequest` (baris 85) dan `notifyAdminsLowStock` (baris 106), ganti kedua query menjadi:

```ts
  const admins = await sql`
    SELECT id FROM pengguna WHERE role = 'admin' AND dihapus_pada IS NULL
  `;
```

- [ ] **Step 5: Saring daftar pengguna dan tambahkan pesan baru**

Di `src/app/admin/pengguna/page.tsx`, ganti query `SELECT id, nip, nama, role, created_at, ...`:

```ts
  const rows = (await sql`
    SELECT id, nip, nama, role, created_at,
           password_hash IS NOT NULL AS aktif
    FROM pengguna
    WHERE dihapus_pada IS NULL
    ORDER BY role ASC, aktif ASC, nama ASC, nip ASC
  `) as unknown as Pengguna[];
```

Tambahkan ke `OK_MSG`:

```ts
  "nip-pulih":
    "NIP dipulihkan beserta riwayat permintaannya. Pemilik NIP tinggal melakukan aktivasi ulang saat login.",
  hapus:
    "Pengguna dihapus. Riwayat permintaannya tetap tersimpan di Laporan.",
```

Tambahkan ke `ERR_MSG`:

```ts
  "hapus-admin":
    "Akun admin tidak bisa dihapus. Jadikan User dulu lewat tombol di baris ini.",
```

Terakhir, perbarui paragraf `<p className="helper mt-3">` di dekat akhir berkas:

```tsx
      <p className="helper mt-3">
        Akun berstatus <strong>Belum aktivasi</strong> hanya berisi NIP.
        Pemiliknya diminta mengisi nama dan kata sandi ketika login pertama
        kali. Pengguna yang dihapus tidak lagi muncul di sini, tetapi riwayat
        permintaannya tetap tersimpan di Laporan.
      </p>
```

- [ ] **Step 6: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0

- [ ] **Step 7: Verifikasi manual — riwayat bertahan**

Sistem punya satu pengguna dengan riwayat permintaan; gunakan pengguna itu.

1. Buka `/admin/laporan`, catat nama dan NIP pemohon pada baris yang ada
2. Buka `/admin/pengguna`, tekan **Hapus** pada pengguna tersebut
   Expected: pesan hijau "Pengguna dihapus. Riwayat permintaannya tetap tersimpan di Laporan", barisnya hilang dari tabel
3. Buka lagi `/admin/laporan`
   Expected: **baris riwayat masih ada, lengkap dengan nama dan NIP yang sama**. Inilah inti tugas ini — sebelumnya penghapusan justru ditolak dengan pesan `terpakai`.
4. Kembali ke `/admin/pengguna`, daftarkan NIP yang sama lewat form Daftarkan NIP
   Expected: pesan "NIP dipulihkan beserta riwayat permintaannya", akun muncul lagi berstatus *Belum aktivasi*

- [ ] **Step 8: Commit**

```bash
git add src/lib/actions.ts src/lib/notifications.ts src/app/admin/pengguna/page.tsx
git commit -m "Keep request history by soft deleting users"
```

---

### Task 5: Buang alur pengembalian

**Files:**
- Delete: `src/components/return-form.tsx`
- Modify: `src/lib/actions.ts` (hapus bagian `RETURN WORKFLOW`: `markAsReturned` dan `markAsNotReturnable`)
- Modify: `src/app/admin/permintaan/page.tsx`
- Modify: `src/app/admin/permintaan/permintaan-client.tsx`
- Modify: `scripts/setup-db.mjs`

**Interfaces:**
- Produces: tipe `BarisRiwayat` tanpa `status_return`, `tanggal_kembali`, dan `barang_id`.

- [ ] **Step 1: Hapus komponen dan Server Action**

```bash
git rm src/components/return-form.tsx
```

Di `src/lib/actions.ts`, hapus seluruh blok yang diawali komentar bagian `RETURN WORKFLOW`, beserta fungsi `markAsReturned` dan `markAsNotReturnable` di bawahnya — berhenti tepat sebelum komentar bagian `BULK OPERATIONS — PERMINTAAN`.

Fungsi `markAsReturned` memuat bug `redirect()` di dalam `try`: Next.js menjalankan `redirect()` dengan melempar `NEXT_REDIRECT`, dan `catch` di bawahnya menangkapnya lalu hanya mencatat ke konsol — sehingga cabang `not-found` tidak pernah mengalihkan.

- [ ] **Step 2: Cari pola `redirect()` di dalam `try` yang tersisa**

Run: `grep -n "redirect(" src/lib/actions.ts`

Periksa setiap hasil dan pastikan tidak ada yang berada di dalam blok `try`. Setelah Step 1, seharusnya tidak ada lagi. Bila ada, pindahkan ke luar dengan pola variabel `err` seperti pada `resetAktivasi`.

- [ ] **Step 3: Bersihkan query dan tipe di halaman**

Di `src/app/admin/permintaan/page.tsx`, ganti tipe `BarisRiwayat` (baris 20–35):

```ts
type BarisRiwayat = Pick<
  PermintaanDetail,
  | "id"
  | "jumlah"
  | "status"
  | "tanggal_pinjam"
  | "catatan_admin"
  | "nama_pengguna"
  | "kode_barang"
  | "nama_barang"
  | "satuan"
>;
```

Ganti query riwayat (baris 56–66) menjadi:

```ts
    sql`
      SELECT p.id, p.jumlah, p.status, p.tanggal_pinjam, p.catatan_admin,
             u.nama AS nama_pengguna,
             b.kode AS kode_barang, b.nama AS nama_barang, b.satuan
      FROM permintaan p
      JOIN pengguna u ON u.id = p.pengguna_id
      JOIN barang b   ON b.id = p.barang_id
      WHERE p.status IN ('DISETUJUI', 'DITOLAK')
      ORDER BY p.updated_at DESC
    `,
```

- [ ] **Step 4: Bersihkan komponen klien**

Di `src/app/admin/permintaan/permintaan-client.tsx`:

Hapus baris import `import { ReturnForm } from "@/components/return-form";`

Ganti tipe `BarisRiwayat` — blok `Pick<PermintaanDetail, ...> & { status_return; tanggal_kembali; barang_id }` — menjadi:

```ts
type BarisRiwayat = Pick<
  PermintaanDetail,
  | "id"
  | "jumlah"
  | "status"
  | "tanggal_pinjam"
  | "catatan_admin"
  | "nama_pengguna"
  | "kode_barang"
  | "nama_barang"
  | "satuan"
>;
```

Bidang `barang_id` ikut dibuang — ia dideklarasikan tetapi tidak pernah dibaca di mana pun.

Di tabel **Riwayat** (bukan tabel Antrean), hapus dua header kolom ini — keduanya berada di `<thead>` yang sama, dipisahkan oleh `<th>Catatan</th>`:

```tsx
                    <th>Status Kembali</th>
                    ...
                    <th>Aksi</th>
```

Lalu hapus dua sel `<td>` yang bersesuaian di `<tbody>`:

- Sel "Status Kembali": seluruh `<td>` yang diawali `{r.status === "DISETUJUI" && (` berisi badge `r.status_return`, sampai penutupnya setelah blok `{r.tanggal_kembali && (...)}`
- Sel "Aksi": seluruh `<td>` yang isinya hanya `{r.status === "DISETUJUI" && r.status_return === "BELUM_DIKEMBALIKAN" && (<ReturnForm ... />)}`

Setelah perubahan ini, tiap baris riwayat berakhir pada sel Catatan, dan jumlah `<th>` harus sama dengan jumlah `<td>` — hitung ulang untuk memastikan.

- [ ] **Step 5: Buang kolomnya dari skema**

Di `scripts/setup-db.mjs`, hapus seluruh blok `DO $$` yang diawali komentar `// Add return workflow columns to existing permintaan table if not exists` dan gantikan dengan:

```js
  // ---- alur pengembalian dibuang ----
  // ATK bersifat habis pakai dan tidak dikembalikan; status 'DIKEMBALIKAN'
  // sudah dipensiunkan lebih dulu di atas. Kolomnya terverifikasi nol isi
  // sebelum dibuang.
  await sql`ALTER TABLE permintaan DROP COLUMN IF EXISTS status_return`;
  await sql`ALTER TABLE permintaan DROP COLUMN IF EXISTS tanggal_kembali`;
  await sql`ALTER TABLE permintaan DROP COLUMN IF EXISTS catatan_kembali`;
```

Hapus juga ketiga kolom itu dari definisi `CREATE TABLE IF NOT EXISTS permintaan` sehingga basis data baru tidak pernah membuatnya — tiga baris `status_return`, `tanggal_kembali`, dan `catatan_kembali` di antara `catatan_admin` dan `created_at`:

```js
      catatan_admin   TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- [ ] **Step 6: Jalankan migrasi dan verifikasi**

Run: `npm run db:setup && npm run db:cek`
Expected: seluruh pemeriksaan di `db:cek` lulus, termasuk tiga baris kolom pengembalian yang tadinya GAGAL.

- [ ] **Step 7: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0

- [ ] **Step 8: Verifikasi manual**

Buka `/admin/permintaan`, lihat tabel Riwayat.
Expected: kolom "Status Kembali" dan "Aksi" hilang; tidak ada tombol yang menambah stok kembali.

- [ ] **Step 9: Commit**

```bash
git add -A src/components/return-form.tsx src/lib/actions.ts src/app/admin/permintaan scripts/setup-db.mjs
git commit -m "Remove the return workflow left over from the loan era"
```

---

### Task 6: Penolakan yang jujur dan peringatan stok pada persetujuan

**Files:**
- Modify: `src/lib/actions.ts` (`setujuiPermintaan`, `tolakPermintaan`, `ubahStok`)

**Interfaces:**
- Produces: `periksaStokMenipis(barangIds: number[]): Promise<void>` — helper internal (tidak diekspor) yang dipakai ulang oleh Task 7.

- [ ] **Step 1: Tambahkan helper stok menipis**

Sisipkan di `src/lib/actions.ts` tepat sebelum `setujuiPermintaan`:

```ts
/**
 * Memberi tahu admin untuk setiap barang yang stoknya menyentuh batas
 * minimum. Dipakai bersama oleh persetujuan satuan, persetujuan massal, dan
 * penyesuaian stok manual supaya ambangnya diperlakukan sama di mana pun.
 */
async function periksaStokMenipis(barangIds: number[]): Promise<void> {
  if (barangIds.length === 0) return;
  try {
    const sql = db();
    const menipis = (await sql`
      SELECT nama, stok, min_stok
      FROM barang
      WHERE id = ANY(${barangIds}) AND stok <= min_stok
    `) as { nama: string; stok: number; min_stok: number }[];

    if (menipis.length === 0) return;

    const { notifyAdminsLowStock } = await import("./notifications");
    for (const b of menipis) {
      await notifyAdminsLowStock(b.nama, b.stok, b.min_stok);
    }
  } catch (e) {
    console.error("Gagal memeriksa stok menipis:", e);
  }
}
```

- [ ] **Step 2: Kembalikan `barang_id` dari `setujuiPermintaan` dan periksa stok**

Di `setujuiPermintaan`, ubah baris `RETURNING p.id` pada query menjadi:

```sql
      RETURNING p.id, p.barang_id
```

dan ubah tipe hasilnya:

```ts
    `) as { id: number; barang_id: number }[];
    berhasil = rows.length > 0;
    barangId = rows.length > 0 ? rows[0].barang_id : null;
```

Deklarasikan `let barangId: number | null = null;` bersebelahan dengan `let berhasil = false;`.

Lalu tepat sebelum blok notifikasi di akhir fungsi (setelah `if (!berhasil) redirect(...)`), tambahkan:

```ts
  if (barangId !== null) await periksaStokMenipis([barangId]);
```

Sebelum perubahan ini, hanya penyesuaian stok manual yang memicu peringatan — padahal persetujuanlah jalur yang paling sering menurunkan stok.

- [ ] **Step 3: Tulis ulang `tolakPermintaan`**

Ganti seluruh fungsi:

```ts
export async function tolakPermintaan(
  id: number,
  formData: FormData
): Promise<void> {
  const session = await requireAdmin();

  const catatan = String(formData.get("catatan") ?? "").trim() || null;

  let ditolak: {
    pengguna_id: number;
    jumlah: number;
    barang_nama: string;
  } | null = null;

  try {
    const sql = db();
    // RETURNING memastikan audit log dan notifikasi hanya terbit bila ada
    // baris yang benar-benar berubah. Tanpa ini, menolak permintaan yang
    // sudah disetujui admin lain tetap mengirim notifikasi "ditolak" yang
    // keliru kepada pemohon.
    const rows = (await sql`
      WITH diubah AS (
        UPDATE permintaan
        SET status = 'DITOLAK', catatan_admin = ${catatan}, updated_at = now()
        WHERE id = ${id} AND status = 'MENUNGGU'
        RETURNING pengguna_id, barang_id, jumlah
      )
      SELECT d.pengguna_id, d.jumlah, b.nama AS barang_nama
      FROM diubah d
      JOIN barang b ON b.id = d.barang_id
    `) as { pengguna_id: number; jumlah: number; barang_nama: string }[];

    ditolak = rows[0] ?? null;

    if (ditolak) {
      await logActivity(session.id, "REJECT_REQUEST", "permintaan", id, {
        status: "DITOLAK",
        catatan,
      });
    }
  } catch (e) {
    console.error("tolakPermintaan gagal:", e);
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin");

  if (!ditolak) redirect("/admin/permintaan?err=status");

  try {
    const { notifyRequestRejected } = await import("./notifications");
    await notifyRequestRejected(
      ditolak.pengguna_id,
      ditolak.barang_nama,
      ditolak.jumlah,
      catatan || undefined
    );
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}
```

- [ ] **Step 4: Pakai helper di `ubahStok`**

Di `ubahStok`, ganti seluruh blok `try` yang diawali komentar `// Check for low stock and notify admins` menjadi satu baris:

```ts
  if (arah === "kurang") await periksaStokMenipis([id]);
```

- [ ] **Step 5: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0

- [ ] **Step 6: Verifikasi manual — tidak ada notifikasi penolakan palsu**

1. Login sebagai user, ajukan satu permintaan
2. Login sebagai admin di peramban lain, buka `/admin/permintaan`
3. Buka halaman yang sama di dua tab admin
4. Tab 1: tekan **Setujui**
5. Tab 2 (masih menampilkan permintaan itu sebagai MENUNGGU): tekan **Tolak**

Expected: tab 2 menampilkan pesan bahwa permintaan sudah diproses admin lain (`err=status`, teksnya ditambahkan di Task 10 — sebelum itu halaman hanya tidak menampilkan apa-apa), dan **user tidak menerima notifikasi "Permintaan Ditolak"**. Periksa lonceng notifikasi user: hanya ada satu notifikasi, yaitu "Permintaan Disetujui".

- [ ] **Step 7: Commit**

```bash
git add src/lib/actions.ts
git commit -m "Only log and notify when a rejection actually changes a row"
```

---

### Task 7: Operasi massal disejajarkan dengan operasi satuan

**Files:**
- Modify: `src/lib/actions.ts` (`bulkApprovePermintaan`, `bulkRejectPermintaan`)
- Modify: `src/components/bulk-approval.tsx`

**Interfaces:**
- Consumes: `periksaStokMenipis(barangIds: number[])` dari Task 6.
- Produces:
  - `bulkApprovePermintaan(ids: number[]): Promise<{ disetujui: number; gagalStok: number }>`
  - `bulkRejectPermintaan(ids: number[], catatan: string | null): Promise<{ ditolak: number }>`

Keduanya mengembalikan objek, bukan memanggil `redirect()`, karena dipanggil dari komponen klien yang menunggu Promise — bukan lewat `<form action>`.

- [ ] **Step 1: Tulis ulang `bulkApprovePermintaan`**

```ts
export async function bulkApprovePermintaan(
  ids: number[]
): Promise<{ disetujui: number; gagalStok: number }> {
  const session = await requireAdmin();

  if (!Array.isArray(ids) || ids.length === 0) {
    return { disetujui: 0, gagalStok: 0 };
  }

  const sql = db();
  const disetujui: {
    pengguna_id: number;
    jumlah: number;
    barang_id: number;
    barang_nama: string;
  }[] = [];
  let gagalStok = 0;

  for (const id of ids) {
    if (!Number.isInteger(id) || id <= 0) continue;
    try {
      const rows = (await sql`
        WITH ambil AS (
          SELECT barang_id, jumlah
          FROM permintaan
          WHERE id = ${id} AND status = 'MENUNGGU'
        ),
        kurangi AS (
          UPDATE barang b
          SET stok = b.stok - a.jumlah
          FROM ambil a
          WHERE b.id = a.barang_id AND b.stok >= a.jumlah
          RETURNING b.id, b.nama
        )
        UPDATE permintaan p
        SET status = 'DISETUJUI', updated_at = now()
        FROM kurangi k
        WHERE p.id = ${id}
        RETURNING p.pengguna_id, p.jumlah, k.id AS barang_id, k.nama AS barang_nama
      `) as {
        pengguna_id: number;
        jumlah: number;
        barang_id: number;
        barang_nama: string;
      }[];

      if (rows.length > 0) {
        disetujui.push(rows[0]);
        // Jalur satuan menulis audit log; tanpa ini persetujuan massal
        // hilang sama sekali dari Activity Log.
        await logActivity(session.id, "APPROVE_REQUEST", "permintaan", id, {
          status: "DISETUJUI",
          massal: true,
        });
      } else {
        gagalStok++;
      }
    } catch (e) {
      console.error(`bulkApprovePermintaan gagal untuk id ${id}:`, e);
      gagalStok++;
    }
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin");
  revalidatePath("/admin/barang");

  try {
    const { notifyRequestApproved } = await import("./notifications");
    for (const d of disetujui) {
      await notifyRequestApproved(d.pengguna_id, d.barang_nama, d.jumlah);
    }
  } catch (e) {
    console.error("Failed to send notification:", e);
  }

  await periksaStokMenipis(disetujui.map((d) => d.barang_id));

  return { disetujui: disetujui.length, gagalStok };
}
```

- [ ] **Step 2: Tulis ulang `bulkRejectPermintaan`**

```ts
export async function bulkRejectPermintaan(
  ids: number[],
  catatan: string | null
): Promise<{ ditolak: number }> {
  const session = await requireAdmin();

  if (!Array.isArray(ids) || ids.length === 0) return { ditolak: 0 };

  const bersih = ids.filter((id) => Number.isInteger(id) && id > 0);
  if (bersih.length === 0) return { ditolak: 0 };

  let ditolak: {
    id: number;
    pengguna_id: number;
    jumlah: number;
    barang_nama: string;
  }[] = [];

  try {
    const sql = db();
    ditolak = (await sql`
      WITH diubah AS (
        UPDATE permintaan
        SET status = 'DITOLAK', catatan_admin = ${catatan}, updated_at = now()
        WHERE id = ANY(${bersih}) AND status = 'MENUNGGU'
        RETURNING id, pengguna_id, barang_id, jumlah
      )
      SELECT d.id, d.pengguna_id, d.jumlah, b.nama AS barang_nama
      FROM diubah d
      JOIN barang b ON b.id = d.barang_id
    `) as {
      id: number;
      pengguna_id: number;
      jumlah: number;
      barang_nama: string;
    }[];

    for (const d of ditolak) {
      await logActivity(session.id, "REJECT_REQUEST", "permintaan", d.id, {
        status: "DITOLAK",
        catatan,
        massal: true,
      });
    }
  } catch (e) {
    console.error("bulkRejectPermintaan gagal:", e);
    throw e;
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin");

  try {
    const { notifyRequestRejected } = await import("./notifications");
    for (const d of ditolak) {
      await notifyRequestRejected(
        d.pengguna_id,
        d.barang_nama,
        d.jumlah,
        catatan || undefined
      );
    }
  } catch (e) {
    console.error("Failed to send notification:", e);
  }

  return { ditolak: ditolak.length };
}
```

- [ ] **Step 3: Tampilkan hasilnya di `src/components/bulk-approval.tsx`**

Ganti `handleBulkApprove` dan `handleBulkReject`:

```tsx
  const handleBulkApprove = async () => {
    if (!confirm(`Setujui ${selectedIds.length} permintaan sekaligus?`)) return;

    setLoading(true);
    try {
      const hasil = await bulkApprovePermintaan(selectedIds);
      if (hasil.gagalStok > 0) {
        alert(
          `${hasil.disetujui} permintaan disetujui. ` +
            `${hasil.gagalStok} tidak dapat diproses karena stoknya tidak mencukupi ` +
            `atau sudah diproses admin lain.`
        );
      }
      onClear();
    } catch {
      alert("Gagal menyetujui permintaan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    setLoading(true);
    try {
      const hasil = await bulkRejectPermintaan(
        selectedIds,
        rejectNote.trim() || null
      );
      if (hasil.ditolak < selectedIds.length) {
        alert(
          `${hasil.ditolak} permintaan ditolak. ` +
            `${selectedIds.length - hasil.ditolak} sudah diproses admin lain.`
        );
      }
      setShowRejectModal(false);
      setRejectNote("");
      onClear();
    } catch {
      alert("Gagal menolak permintaan.");
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 4: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0

- [ ] **Step 5: Verifikasi manual**

1. Login sebagai user, ajukan tiga permintaan
2. Login sebagai admin, buka `/admin/permintaan`, centang ketiganya, tekan **Setujui Semua**
3. Buka `/admin/logs`
   Expected: **tiga** entri "Setujui Permintaan" — sebelumnya operasi massal tidak menulis log sama sekali
4. Login kembali sebagai user, buka lonceng notifikasi
   Expected: **tiga** notifikasi "Permintaan Disetujui" — sebelumnya nol

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions.ts src/components/bulk-approval.tsx
git commit -m "Give bulk actions the same logging and notifications as single ones"
```

---

### Task 8: Validasi tanggal dan penggabungan item duplikat

**Files:**
- Modify: `src/lib/definitions.ts`
- Modify: `src/lib/actions.ts` (`ajukanPermintaan`)
- Modify: `src/app/(user)/permintaan/page.tsx`

**Interfaces:**
- Produces: `tanggalHariIniWIB(): string` dan `tanggalIsoValid(s: string): boolean`, diekspor dari `src/lib/definitions.ts`.

- [ ] **Step 1: Pindahkan helper tanggal ke `src/lib/definitions.ts`**

Tambahkan di akhir berkas:

```ts
/** Tanggal hari ini di zona WIB, format YYYY-MM-DD. */
export function tanggalHariIniWIB(): string {
  // format en-CA = YYYY-MM-DD, dievaluasi pada zona waktu Indonesia barat
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

/**
 * true hanya bila string benar-benar tanggal yang ada. Pemeriksaan pola saja
 * meloloskan 2026-99-99, dan konstruktor Date diam-diam menggeser 2026-02-31
 * menjadi 2026-03-03 — perbandingan balik ke ISO menolak keduanya.
 */
export function tanggalIsoValid(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
```

- [ ] **Step 2: Pakai helper bersama di halaman permintaan**

Di `src/app/(user)/permintaan/page.tsx`, hapus fungsi lokal `tanggalHariIniWIB` (baris 7–12) dan tambahkan ke import yang sudah ada di baris 5:

```ts
import { tanggalHariIniWIB, type Barang } from "@/lib/definitions";
```

- [ ] **Step 3: Perkuat validasi di `ajukanPermintaan`**

Tambahkan `tanggalIsoValid` ke import `definitions` di puncak `src/lib/actions.ts`:

```ts
import {
  tanggalIsoValid,
  type ActionState,
  type CekNipState,
  type Role,
} from "./definitions";
```

Ganti pemeriksaan tanggal — blok `if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalPinjam))` — menjadi:

```ts
  if (!tanggalIsoValid(tanggalPinjam)) {
    return { error: "Tanggal pinjam tidak valid." };
  }
```

Lalu ganti semuanya mulai dari `let barangNames: string[] = [];` sampai penutup blok `catch` di akhir bagian penyimpanan (tepat sebelum `revalidatePath("/laporan");`) dengan penggabungan duplikat lebih dulu:

```ts
  // Entri barang yang sama dijumlahkan supaya totalnya divalidasi terhadap
  // stok. UI sudah menggabungkannya, tetapi Server Action adalah endpoint
  // POST publik sehingga tidak boleh bergantung pada itu.
  const gabungan = new Map<number, number>();
  for (const item of cartItems) {
    if (!Number.isInteger(item.barang_id) || item.barang_id <= 0) {
      return { error: "ID Barang tidak valid." };
    }
    if (!Number.isInteger(item.jumlah) || item.jumlah <= 0) {
      return { error: "Jumlah harus lebih dari nol." };
    }
    gabungan.set(
      item.barang_id,
      (gabungan.get(item.barang_id) ?? 0) + item.jumlah
    );
  }
  const items = [...gabungan].map(([barang_id, jumlah]) => ({
    barang_id,
    jumlah,
  }));

  const barangNames: string[] = [];

  try {
    const sql = db();

    // Rentang tanggal diperiksa di Postgres agar tidak meleset ketika zona
    // waktu server berbeda dari WIB.
    const [batas] = (await sql`
      SELECT ${tanggalPinjam}::date >= (now() AT TIME ZONE 'Asia/Jakarta')::date
               AS tidak_lampau,
             ${tanggalPinjam}::date <= (now() AT TIME ZONE 'Asia/Jakarta')::date + 365
               AS masuk_akal
    `) as { tidak_lampau: boolean; masuk_akal: boolean }[];

    if (!batas.tidak_lampau) {
      return { error: "Tanggal pinjam tidak boleh di masa lalu." };
    }
    if (!batas.masuk_akal) {
      return { error: "Tanggal pinjam terlalu jauh ke depan (maksimal 1 tahun)." };
    }

    // Satu pengambilan per barang, dipakai untuk validasi sekaligus insert.
    const detail = new Map<number, { nama: string; stok: number }>();
    for (const item of items) {
      const barang = (await sql`
        SELECT nama, stok FROM barang WHERE id = ${item.barang_id} LIMIT 1
      `) as { nama: string; stok: number }[];

      if (barang.length === 0) {
        return { error: "Ada barang yang tidak ditemukan." };
      }
      if (barang[0].stok < item.jumlah) {
        return {
          error: `Stok ${barang[0].nama} tersisa ${barang[0].stok}. Kurangi jumlah permintaan.`,
        };
      }
      detail.set(item.barang_id, barang[0]);
    }

    for (const item of items) {
      const barangNama = detail.get(item.barang_id)!.nama;
      barangNames.push(barangNama);

      const result = await sql`
        INSERT INTO permintaan (pengguna_id, barang_id, jumlah, keperluan, tanggal_pinjam)
        VALUES (${session.id}, ${item.barang_id}, ${item.jumlah}, ${keperluan}, ${tanggalPinjam})
        RETURNING id
      `;

      const newRequestId = (result[0] as { id: number }).id;

      await logActivity(session.id, "CREATE_REQUEST", "permintaan", newRequestId, {
        barang_id: item.barang_id,
        barang_nama: barangNama,
        jumlah: item.jumlah,
        keperluan,
      });
    }
  } catch (e) {
    console.error("ajukanPermintaan gagal:", e);
    return { error: "Gagal menyimpan permintaan. Coba lagi." };
  }
```

Perhatikan deklarasi lama `let barangNames: string[] = [];` diganti `const barangNames: string[] = [];` di potongan di atas — pastikan tidak tersisa deklarasi ganda. Blok `revalidatePath` dan pengiriman notifikasi ke admin di bawahnya tidak berubah.

- [ ] **Step 4: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0

- [ ] **Step 5: Verifikasi manual — tanggal**

Server Action adalah endpoint POST publik, jadi ujinya harus menembus validasi frontend. Buka `/permintaan` sebagai user, tambahkan satu barang, lalu jalankan di konsol peramban:

```js
document.querySelector('#tanggal_pinjam').value = '2020-01-01';
```

Isi keperluan, tekan Ajukan.
Expected: pesan merah "Tanggal pinjam tidak boleh di masa lalu."

Ulangi dengan `'2026-02-31'`.
Expected: pesan merah "Tanggal pinjam tidak valid." — sebelumnya nilai ini lolos ke Postgres dan muncul sebagai "Gagal menyimpan permintaan. Coba lagi."

- [ ] **Step 6: Commit**

```bash
git add src/lib/definitions.ts src/lib/actions.ts "src/app/(user)/permintaan/page.tsx"
git commit -m "Validate request dates properly and merge duplicate cart entries"
```

---

### Task 9: Stok minimum bisa diatur dari UI

**Files:**
- Modify: `src/lib/definitions.ts` (antarmuka `Barang`)
- Modify: `src/components/barang-form.tsx`
- Modify: `src/lib/actions.ts` (`simpanBarang`)
- Modify: `src/app/admin/barang/page.tsx:34`

**Interfaces:**
- Produces: `Barang.min_stok: number`.

- [ ] **Step 1: Tambahkan `min_stok` ke antarmuka `Barang`**

Di `src/lib/definitions.ts`, sisipkan setelah baris `stok: number;`:

```ts
  /** Ambang peringatan stok menipis; memicu notifikasi LOW_STOCK. */
  min_stok: number;
```

- [ ] **Step 2: Muat kolomnya untuk form Ubah**

Di `src/app/admin/barang/page.tsx` baris 34:

```ts
    SELECT id, kode, nama, kategori, jenis, satuan, stok, min_stok, created_at
```

- [ ] **Step 3: Tambahkan field ke `src/components/barang-form.tsx`**

Sisipkan satu blok `<div>` baru tepat setelah blok yang memuat `<label htmlFor="stok">`, sebelum blok tombol submit:

```tsx
        <div>
          <label htmlFor="min_stok" className="label">
            Stok Minimum
          </label>
          <input
            id="min_stok"
            name="min_stok"
            type="number"
            min={0}
            required
            defaultValue={editData?.min_stok ?? 10}
            className="input"
          />
          <p className="helper mt-1">Peringatan muncul bila stok ≤ nilai ini.</p>
        </div>
```

Lalu ubah lebar gridnya agar field baru muat: `md:grid-cols-6` → `md:grid-cols-7` pada `<div className="grid gap-5 p-5 ...">`, dan **kedua** kemunculan `md:col-span-6` → `md:col-span-7` (satu pada kotak pesan error, satu pada pembungkus tombol submit).

- [ ] **Step 4: Baca dan tulis `min_stok` di `simpanBarang`**

Tambahkan setelah baris `const stok = Number(formData.get("stok"));`:

```ts
  const minStok = Number(formData.get("min_stok"));
```

Tambahkan validasi setelah validasi `stok`:

```ts
  if (!Number.isInteger(minStok) || minStok < 0) {
    return { error: "Stok minimum harus bilangan bulat nol atau lebih." };
  }
```

Ubah kedua query. UPDATE:

```ts
      await sql`
        UPDATE barang
        SET kode = ${kode}, nama = ${nama}, kategori = ${kategori},
            jenis = ${jenis}, satuan = ${satuan}, stok = ${stok},
            min_stok = ${minStok}
        WHERE id = ${id}
      `;
```

INSERT:

```ts
      const result = await sql`
        INSERT INTO barang (kode, nama, kategori, jenis, satuan, stok, min_stok)
        VALUES (${kode}, ${nama}, ${kategori}, ${jenis}, ${satuan}, ${stok}, ${minStok})
        RETURNING id
      `;
```

Sertakan `min_stok: minStok` pada kedua panggilan `logActivity`.

- [ ] **Step 5: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0.

Bila muncul error pada berkas lain yang meng-cast hasil query ke `Barang[]` tanpa memilih `min_stok`, tambahkan kolomnya ke query tersebut — jangan melonggarkan tipenya.

- [ ] **Step 6: Verifikasi manual**

1. Buka `/admin/barang`, tekan Ubah pada satu barang
   Expected: field **Stok Minimum** terisi 10
2. Ubah menjadi 3, simpan
3. Tekan Ubah lagi
   Expected: field menunjukkan 3
4. Turunkan stok barang itu lewat tombol − hingga ≤ 3
   Expected: notifikasi "Stok Menipis" muncul di lonceng admin, dan barangnya masuk daftar di kartu peringatan dashboard

- [ ] **Step 7: Commit**

```bash
git add src/lib/definitions.ts src/components/barang-form.tsx src/lib/actions.ts src/app/admin/barang/page.tsx
git commit -m "Let admins set the low stock threshold from the item form"
```

---

### Task 10: Pesan error yang tampil dan alamat IP yang terisi

**Files:**
- Modify: `src/app/admin/permintaan/page.tsx`
- Modify: `src/lib/audit.ts`

- [ ] **Step 1: Render pesan `err=status`**

Di `src/app/admin/permintaan/page.tsx`, tambahkan setelah blok `params.err === "stok"`:

```tsx
      {params.err === "status" && (
        <Alert variant="error">
          Permintaan itu sudah diproses admin lain, jadi tidak ada yang
          berubah. Muat ulang halaman untuk melihat status terbarunya.
        </Alert>
      )}
```

- [ ] **Step 2: Isi kolom IP di `src/lib/audit.ts`**

Sisipkan tepat sebelum `logActivity`:

```ts
/**
 * Alamat IP pemanggil, diambil dari header proksi.
 *
 * Import "next/headers" sengaja dinamis: berkas ini juga mengekspor
 * ACTION_LABELS dan parseActionType, dan import statis akan menjadikan
 * seluruh modul server-only sehingga konstanta itu tidak lagi bisa dipakai
 * komponen klien di kemudian hari.
 */
async function ambilIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  } catch {
    return null; // dipanggil di luar cakupan request
  }
}
```

Ubah badan `logActivity` agar memakainya bila parameter tidak diisi:

```ts
  try {
    const sql = db();
    const ip = ipAddress ?? (await ambilIp());
    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (
        ${userId},
        ${action},
        ${entityType},
        ${entityId || null},
        ${details ? JSON.stringify(details) : null},
        ${ip}
      )
    `;
  } catch (e) {
    console.error("Failed to log activity:", e);
    // Don't throw - logging failure shouldn't break the main operation
  }
```

- [ ] **Step 3: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: exit code 0

- [ ] **Step 4: Verifikasi manual**

1. Logout lalu login kembali
2. Buka `/admin/logs`

Expected: entri **Login** terbaru menampilkan alamat IP pada kolom IP, bukan `-`. Di `localhost` nilainya bisa `::1` — itu tetap dihitung berhasil; yang penting bukan lagi `-`.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/permintaan/page.tsx src/lib/audit.ts
git commit -m "Surface the stale-request error and record caller IP addresses"
```

---

## Verifikasi Akhir

Dijalankan setelah seluruh tugas selesai.

- [ ] `npx tsc --noEmit` → exit 0
- [ ] `npm run db:cek` → semua pemeriksaan lulus
- [ ] `npm run build` → sukses tanpa error
- [ ] `npm run db:setup` dua kali berturut-turut → tetap sukses (idempoten)
- [ ] Verifikasi manual Task 2 Step 6 dan Step 7 diulang sekali lagi — pencabutan sesi dan ketiadaan loop redirect adalah risiko terbesar rencana ini
- [ ] Klik satu notifikasi lama di lonceng admin → mendarat di `/admin/permintaan`, bukan halaman tidak ditemukan

**Basis data produksi:** bila `DATABASE_URL` di Vercel berbeda dari yang ada di `.env.local`, jalankan `npm run db:setup` sekali dengan URL tersebut sebelum deploy — Task 1 dan Task 5 mengubah skema.

## Catatan Gotcha

- Port 3000 kadang masih dipegang proses `next dev` sebelumnya. Bila `npm run dev` pindah ke 3001, tutup proses lama dulu agar cookie sesi (yang terikat host+port) tidak membingungkan saat menguji dua peramban.
- `npm run db:cek` sengaja GAGAL pada tiga pemeriksaan kolom pengembalian sampai Task 5 selesai. Itu perilaku yang diharapkan, bukan regresi.
