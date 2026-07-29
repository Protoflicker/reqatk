# Perbaikan Kelola Akun, Pencabutan Sesi, dan Integritas Permintaan

**Tanggal:** 29 Juli 2026
**Status:** Disetujui, siap masuk rencana implementasi

## Latar Belakang

Dua permintaan awal:

1. Halaman Kelola Pengguna harus dipangkas menjadi tiga aksi saja — daftarkan NIP, nonaktifkan akun (Reset), dan ganti role. Admin tidak lagi boleh mengisi nama dan kata sandi milik orang lain.
2. Notifikasi masih mengarah ke rute `peminjaman`, bukan `permintaan`.

Audit lanjutan atas seluruh lapisan backend menemukan dua belas masalah tambahan, satu di antaranya membuat fitur Reset yang diminta pada poin 1 tidak benar-benar berfungsi. Semua temuan dikerjakan dalam satu paket karena saling bersandar pada lapisan sesi yang sama.

### Kondisi data saat spesifikasi ditulis

Diukur langsung dari basis data produksi lewat `DATABASE_URL` di `.env.local`:

| Tabel | Jumlah | Catatan |
| --- | --- | --- |
| `pengguna` | 45 | 43 belum aktivasi, **hanya 1 admin** |
| `barang` | 898 | **seluruhnya** `min_stok = 10` (nilai default) |
| `permintaan` | 1 | 1 pengguna terkunci dari penghapusan |
| `activity_logs` | 74 | kolom `ip_address` seluruhnya NULL |
| `notifications` | 2 | 1 baris ber-`link = '/admin/peminjaman'` |

Kolom alur pengembalian (`tanggal_kembali`, `catatan_kembali`) terverifikasi **nol isi**, sehingga aman dibuang.

Angka "hanya 1 admin" menentukan salah satu keputusan rancangan: tanpa pengaman, satu klik penurunan role bisa mengunci semua orang dari `/admin` secara permanen.

## Ruang Lingkup

Termasuk: dua belas temuan audit ditambah dua permintaan awal.

Tidak termasuk: pembatasan laju percobaan login, enumerasi NIP lewat halaman login (disengaja oleh rancangan alur aktivasi), penataan ulang visual, dan refactor yang tidak menyentuh temuan di atas.

## Keputusan yang Sudah Diambil

| Pertanyaan | Keputusan |
| --- | --- |
| NIP boleh diubah lewat form Ubah? | Tidak. Role saja. NIP permanen setelah didaftarkan. |
| Tombol Hapus pengguna? | Tetap ada. |
| Cara riwayat bertahan setelah pengguna dihapus? | Soft delete (`dihapus_pada`). |
| Alur pengembalian barang? | Dibuang total. |
| Cakupan | Seluruh temuan. |

---

## Bagian 1 — Sesi Terikat Database

**Masalah.** `SessionPayload` adalah JWT stateless berumur 8 jam (`src/lib/session.ts`) yang hanya diverifikasi tanda tangannya, tidak pernah dicocokkan ke basis data. Akibatnya Reset tidak mencabut akses, penurunan role tidak mencabut hak admin, dan penghapusan pengguna tidak mengusir siapa pun — semuanya baru berlaku setelah token kedaluwarsa.

Ini dikerjakan lebih dulu karena Bagian 2 dan 3 bersandar padanya.

**Rancangan.** `requireSession()` di `src/lib/auth.ts` berhenti mempercayai isi token:

```ts
import { cache } from "react";

/** Route Handler yang menghapus cookie sesi lalu mengalihkan ke /login. */
const SESI_BERAKHIR = "/sesi-berakhir";

const muatPengguna = cache(async (id: number) => {
  const sql = db();
  const rows = (await sql`
    SELECT id, nip, nama, role
    FROM pengguna
    WHERE id = ${id}
      AND password_hash IS NOT NULL
      AND dihapus_pada IS NULL
    LIMIT 1
  `) as SessionPayload[];
  return rows[0] ?? null;
});

export async function requireSession(): Promise<SessionPayload> {
  const token = await getSession();
  if (!token) redirect("/login");

  const user = await muatPengguna(token.id);
  // Akun hilang, direset jadi nonaktif, atau dihapus.
  if (!user) redirect(SESI_BERAKHIR);
  // Role berubah sejak token terbit; token dan basis data harus selaras.
  if (user.role !== token.role) redirect(SESI_BERAKHIR);

  return user;
}
```

`cache()` dari React memastikan hanya ada satu query per request meski `requireSession()` dipanggil beberapa kali dalam satu render (halaman + `getNotifications()` di app-shell).

Nilai kembalian diambil dari basis data, bukan dari token, sehingga `requireAdmin()` otomatis ikut benar tanpa perubahan.

**Kenapa lewat Route Handler, bukan `destroySession()` langsung.** Server Component tidak boleh memodifikasi cookie; Next.js melemparkan error. Sementara `redirect("/login")` tanpa menghapus cookie menimbulkan **loop redirect tak berujung**: middleware melihat token yang masih sah dan memantulkan kembali ke `/admin`. Route Handler adalah satu-satunya tempat yang boleh menghapus cookie sekaligus mengalihkan.

Berkas baru `src/app/sesi-berakhir/route.ts`:

```ts
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login?err=sesi", request.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
```

**`src/middleware.ts` tidak diubah.** Sudah ditelusuri: `/sesi-berakhir` tidak cocok dengan `USER_PATHS` maupun awalan `/admin`, sehingga lolos apa adanya untuk sesi user maupun admin; setelah cookie terhapus, `/login` juga lolos. Middleware tetap bebas dependensi basis data sehingga aman di Edge runtime, dan tetap berperan sebagai perutean cepat — penegakan hak akses yang sesungguhnya ada di `requireSession()` / `requireAdmin()`.

Halaman `src/app/login/page.tsx` menampilkan pesan untuk `?err=sesi`: "Sesi berakhir karena perubahan pada akun Anda. Silakan masuk kembali."

---

## Bagian 2 — Kelola Akun

### 2a. Form Ubah menjadi ganti role saja

- `src/components/pengguna-form.tsx` **dihapus**. Berkas ini satu-satunya jalan bagi admin untuk menulis `nama` dan `password_hash` milik orang lain; setelah hilang, kedua data itu murni milik pemiliknya lewat alur aktivasi dan halaman Profil.
- Parameter URL `?edit=` dan blok render form di `src/app/admin/pengguna/page.tsx` dihapus.
- Kolom Aksi mendapat tombol per-baris **Jadikan Admin** / **Jadikan User** sesuai role baris, dibungkus `ConfirmButton` (pola yang sudah dipakai Reset dan Hapus).

`simpanPengguna` diganti `ubahRole`:

```ts
export async function ubahRole(id: number, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const role = String(formData.get("role") ?? "");
  let err: string | null = null;

  if (role !== "admin" && role !== "user") {
    err = "gagal";
  } else if (id === session.id) {
    err = "role-sendiri";
  } else {
    const target = (await sql`
      SELECT nip, role, password_hash IS NOT NULL AS aktif
      FROM pengguna WHERE id = ${id} AND dihapus_pada IS NULL LIMIT 1
    `) as { nip: string; role: Role; aktif: boolean }[];

    if (target.length === 0) err = "gagal";
    else if (role === "admin" && !target[0].aktif) err = "role-nonaktif";
    else { /* UPDATE + logActivity("UPDATE_USER", { nip, role_lama, role_baru }) */ }
  }

  revalidatePath("/admin/pengguna");
  redirect(err ? `/admin/pengguna?err=${err}` : "/admin/pengguna?ok=role");
}
```

Dua pengaman, keduanya menutup lubang nyata pada form lama:

1. **Tidak bisa mengubah role sendiri.** Dengan hanya satu admin di sistem, penurunan diri sendiri mengunci semua orang dari `/admin` tanpa jalan pulih lewat aplikasi.
2. **Akun belum aktivasi tidak bisa dipromosikan jadi admin.** 43 dari 45 akun berada dalam kondisi ini. Akun tanpa kata sandi bisa diklaim siapa pun yang tahu NIP-nya lewat alur aktivasi publik, jadi mempromosikannya sama dengan menyiapkan akun admin yang menganggur untuk diambil alih. Ini konsisten dengan larangan `reset-admin` yang sudah ada.

Penurunan admin menjadi user tetap selalu diizinkan.

### 2b. Soft delete pengguna

`hapusPengguna` berhenti melakukan `DELETE`:

```sql
UPDATE pengguna
SET dihapus_pada = now(), password_hash = NULL
WHERE id = ${id} AND dihapus_pada IS NULL
```

Riwayat permintaan tetap utuh berikut nama dan NIP pemohon, karena baris `pengguna` tidak pernah hilang dan seluruh JOIN laporan tetap menemukan pasangannya. Mengosongkan `password_hash` berarti akun langsung tidak bisa login, dan — digabung dengan Bagian 1 — sesi yang sedang berjalan langsung putus.

Pengaman: tidak bisa menghapus diri sendiri (sudah ada), dan **admin harus diturunkan jadi User dulu sebelum bisa dihapus**, konsisten dengan aturan Reset.

Foreign key `permintaan.pengguna_id` tetap `ON DELETE RESTRICT` dan tidak perlu diubah — dengan soft delete, tidak ada lagi `DELETE` yang bisa memicunya.

### 2c. Mendaftarkan ulang NIP yang pernah dihapus

Karena `pengguna.nip` bersifat `UNIQUE` dan baris soft-deleted tetap memegang NIP-nya, `daftarkanNip` harus menangani kasus ini secara eksplisit — kalau tidak, admin akan melihat "NIP sudah terdaftar" untuk akun yang tidak tampak di mana pun.

Perilaku: mendaftarkan NIP yang pernah dihapus akan **memulihkannya** — `dihapus_pada` dikosongkan, `nama` dikembalikan ke `''`, `password_hash` ke `NULL`, `role` ke `'user'`. Riwayat lamanya ikut tersambung kembali. Ini perilaku yang benar, karena NIP menandai orang yang sama.

Implementasi memakai percabangan eksplisit, bukan `ON CONFLICT`, agar mudah dibaca dan pesan suksesnya bisa dibedakan:

```ts
const ada = (await sql`
  SELECT id, dihapus_pada FROM pengguna WHERE nip = ${nip} LIMIT 1
`) as { id: number; dihapus_pada: string | null }[];

if (ada.length > 0 && ada[0].dihapus_pada === null) {
  return { error: `NIP ${nip} sudah terdaftar.` };
}
// ada.length > 0  → UPDATE pemulihan, redirect ?ok=nip-pulih
// ada.length === 0 → INSERT seperti sekarang, redirect ?ok=nip
```

Balapan antar-admin tidak relevan di sini: aksi ini khusus admin dan jarang, dan `UNIQUE` tetap menjadi jaring pengaman terakhir lewat `isUniqueViolation`.

### 2d. Penyaringan `dihapus_pada`

Setiap query yang memperlakukan pengguna sebagai **akun aktif** harus menambahkan `dihapus_pada IS NULL`:

- `src/app/admin/pengguna/page.tsx` — daftar pengguna
- `cekNip` dan `login` di `src/lib/actions.ts`
- `notifyAdminsNewRequest` dan `notifyAdminsLowStock` di `src/lib/notifications.ts` (`SELECT id FROM pengguna WHERE role = 'admin'`)
- `muatPengguna` di `src/lib/auth.ts`

Query yang memperlakukan pengguna sebagai **catatan sejarah** harus **tidak** disaring — inilah inti fitur ini:

- seluruh JOIN di halaman dan ekspor laporan (`(user)/laporan`, `admin/laporan`, `admin/page.tsx`, `(user)/dashboard`)
- `admin/logs` dan `activity-timeline`

Implementasi wajib menelusuri ulang seluruh rujukan tabel `pengguna` dan mengklasifikasikan tiap query ke salah satu kelompok di atas.

---

## Bagian 3 — Integritas Permintaan

### 3a. `tolakPermintaan` mengirim notifikasi palsu

`UPDATE ... WHERE status = 'MENUNGGU'` bisa mencocokkan nol baris, tetapi kode tetap menulis audit log `REJECT_REQUEST` dan mengirim notifikasi "✕ Permintaan Ditolak". Skenario nyata: dua admin membuka halaman bersamaan, A menyetujui lebih dulu, B menekan Tolak — permintaan tetap DISETUJUI sementara pemohon menerima notifikasi ditolak.

Perbaikan: tambahkan `RETURNING id`, dan jalankan log serta notifikasi hanya bila ada baris yang benar-benar berubah. Bila tidak, alihkan ke `?err=status`. `setujuiPermintaan` sudah memakai pola ini lewat flag `berhasil` dan menjadi acuannya.

### 3b. Operasi massal disejajarkan dengan operasi satuan

`bulkApprovePermintaan` dan `bulkRejectPermintaan` saat ini tidak menulis audit log dan tidak mengirim notifikasi sama sekali, dan bulk approve gagal senyap ketika stok kurang.

Karena keduanya dipanggil dari komponen klien `src/components/bulk-approval.tsx` yang menunggu Promise (bukan lewat `<form action>`), keduanya **mengembalikan objek hasil** alih-alih memanggil `redirect()`:

```ts
export async function bulkApprovePermintaan(
  ids: number[]
): Promise<{ disetujui: number; gagalStok: number }>;

export async function bulkRejectPermintaan(
  ids: number[],
  catatan: string | null
): Promise<{ ditolak: number }>;
```

Tiap id memakai `RETURNING` untuk mengetahui keberhasilannya, lalu menulis audit log dan mengirim notifikasi per pemohon persis seperti jalur satuan. `bulk-approval.tsx` menampilkan ringkasannya, termasuk kalimat khusus ketika sebagian gagal karena stok.

### 3c. Peringatan stok menipis pada jalur persetujuan

`ubahStok` memeriksa `stok <= min_stok` dan mengirim notifikasi LOW_STOCK, tetapi `setujuiPermintaan` — jalur yang paling sering menurunkan stok — tidak. Pemeriksaan yang sama ditambahkan setelah pengurangan stok berhasil.

### 3d. Validasi tanggal

`/^\d{4}-\d{2}-\d{2}$/` meloloskan `2026-99-99` (ditolak Postgres lalu muncul sebagai error generik) dan tanggal lampau. Frontend punya `min={today}`, server tidak — dan Server Action adalah endpoint POST publik, sehingga validasi frontend saja tidak cukup.

Pemeriksaan bentuk di TypeScript, menolak tanggal yang dinormalisasi diam-diam oleh `Date`:

```ts
function tanggalIsoValid(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
```

Pemeriksaan rentang dilakukan di Postgres agar tidak meleset karena zona waktu server berbeda dari WIB:

```sql
SELECT ${tanggal}::date >= (now() AT TIME ZONE 'Asia/Jakarta')::date AS tidak_lampau,
       ${tanggal}::date <= (now() AT TIME ZONE 'Asia/Jakarta')::date + 365 AS masuk_akal
```

Helper `tanggalHariIniWIB()` yang sekarang berada di dalam `src/app/(user)/permintaan/page.tsx` dipindahkan ke `src/lib/definitions.ts` agar dipakai bersama dan tidak ada dua definisi "hari ini".

### 3e. Item duplikat di keranjang

UI sudah menggabungkan barang yang sama, tetapi server memvalidasi tiap entri secara terpisah — POST langsung dengan dua entri barang sama, masing-masing setengah stok, lolos keduanya. Server menjumlahkan `jumlah` per `barang_id` sebelum memvalidasi terhadap stok.

Sekalian: `ajukanPermintaan` sekarang mengambil baris `barang` dua kali dalam dua perulangan terpisah. Digabung menjadi satu pengambilan yang dipakai ulang.

---

## Bagian 4 — Membuang Alur Pengembalian

Skema sudah memensiunkan status `DIKEMBALIKAN` (`scripts/setup-db.mjs` baris 113–122) sebagai bagian dari perpindahan konsep *peminjaman* ke *permintaan*, tetapi UI admin masih memasang tombol yang **menambahkan stok kembali** untuk ATK habis pakai.

Dihapus:

- `src/components/return-form.tsx`
- `markAsReturned` dan `markAsNotReturnable` di `src/lib/actions.ts`
- seluruh rujukan `status_return`, `tanggal_kembali`, `catatan_kembali` di `src/app/admin/permintaan/page.tsx` dan `permintaan-client.tsx`
- blok `DO $$` penambah kolom tersebut di `scripts/setup-db.mjs`, diganti `ALTER TABLE ... DROP COLUMN IF EXISTS`

Penghapusan kolom aman: sudah diverifikasi nol isi pada kedua kolom data.

Ini sekaligus menutup bug `redirect()` di dalam blok `try` (`src/lib/actions.ts` baris 549). Next.js menjalankan `redirect()` dengan melempar `NEXT_REDIRECT`; `catch` di baris 570 menangkapnya dan hanya mencatat ke konsol, sehingga cabang `not-found` tidak pernah mengalihkan. **Catatan untuk implementasi:** pola ini harus dicari di seluruh `actions.ts`, bukan hanya di fungsi yang dihapus — setiap `redirect()` wajib berada di luar `try`.

---

## Bagian 5 — Mismatch Frontend ↔ Backend

### 5a. `min_stok` tidak terjangkau dari UI

Kolomnya ada, dipakai `low-stock-alert.tsx` dan notifikasi LOW_STOCK, serta diisi oleh import Excel — tetapi `barang-form.tsx` tidak punya field-nya. Akibatnya seluruh 898 barang terkunci di nilai default 10.

- Field **Stok Minimum** ditambahkan ke `src/components/barang-form.tsx`
- `min_stok: number` ditambahkan ke antarmuka `Barang` di `src/lib/definitions.ts`
- `simpanBarang` membaca dan menulisnya, dengan validasi bilangan bulat ≥ 0
- Query yang memuat data untuk form Ubah Barang ikut menyertakan kolomnya

### 5b. Pesan error yang tidak pernah tampil

`src/app/admin/permintaan/page.tsx` hanya merender `err === "stok"`. Ditambahkan penanganan untuk `err=status` (Bagian 3a) dan ringkasan hasil sebagian dari operasi massal.

### 5c. Kolom IP selalu kosong

`admin/logs/page.tsx` menampilkan `log.ip_address || "-"`, tetapi `logActivity` tidak pernah dipanggil dengan argumen itu. Daripada menambahkannya di puluhan titik panggilan, `logActivity` mengambil sendiri dari header:

```ts
async function ambilIp(): Promise<string | null> {
  try {
    // Import dinamis: audit.ts juga mengekspor konstanta ACTION_LABELS dan
    // parseActionType. Menaruh "next/headers" di puncak modul akan membuat
    // seluruh berkas server-only, sehingga konstanta itu tidak lagi bisa
    // dipakai komponen klien di kemudian hari.
    const { headers } = await import("next/headers");
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  } catch {
    return null; // di luar cakupan request
  }
}
```

Parameter `ipAddress` tetap ada sebagai penimpa opsional; nilai dari header dipakai bila parameter tidak diisi. Dibungkus try/catch karena `headers()` melempar error di luar cakupan request.

Saat ini `audit.ts` hanya diimpor `admin/logs/page.tsx` (Server Component) dan `actions.ts`, jadi import statis pun belum akan merusak apa pun — import dinamis dipakai agar tetap begitu seiring waktu, mengikuti pola yang sudah dipakai `actions.ts` terhadap `notifications.ts`.

---

## Bagian 6 — Migrasi Skema

Seluruh perubahan masuk ke `scripts/setup-db.mjs`, mengikuti pola idempoten yang sudah ada di sana, sehingga `npm run db:setup` aman dijalankan berulang:

```sql
-- 1. Soft delete pengguna
ALTER TABLE pengguna ADD COLUMN IF NOT EXISTS dihapus_pada TIMESTAMPTZ;

-- 2. Tautan notifikasi dari sebelum rename peminjaman → permintaan.
--    Terlewat oleh migrate-rename.mjs, yang hanya mengurus tabel,
--    constraint, index, dan sequence.
UPDATE notifications
SET link = replace(link, '/peminjaman', '/permintaan')
WHERE link LIKE '%peminjaman%';

-- 3. Alur pengembalian dibuang (terverifikasi nol isi)
ALTER TABLE permintaan DROP COLUMN IF EXISTS status_return;
ALTER TABLE permintaan DROP COLUMN IF EXISTS tanggal_kembali;
ALTER TABLE permintaan DROP COLUMN IF EXISTS catatan_kembali;
```

Blok `DO $$` lama yang menambahkan ketiga kolom pengembalian dihapus dari skrip agar tidak saling meniadakan dengan langkah nomor 3.

Basis data produksi (Vercel) perlu dijalankan sekali juga bila `DATABASE_URL`-nya berbeda dari yang ada di `.env.local`.

---

## Berkas Terdampak

**Dihapus:** `src/components/pengguna-form.tsx`, `src/components/return-form.tsx`

**Baru:** `src/app/sesi-berakhir/route.ts`

**Diubah:**

| Berkas | Perubahan |
| --- | --- |
| `src/lib/auth.ts` | `requireSession()` terikat basis data, `muatPengguna` ber-`cache` |
| `src/lib/actions.ts` | `ubahRole`, soft delete, pemulihan NIP, perbaikan tolak/bulk/tanggal/duplikat, hapus aksi pengembalian |
| `src/lib/notifications.ts` | saring `dihapus_pada IS NULL` pada pencarian admin |
| `src/lib/audit.ts` | `ambilIp()` di dalam `logActivity` |
| `src/lib/definitions.ts` | `min_stok` pada `Barang`, `tanggalHariIniWIB()` dipindahkan ke sini |
| `src/app/admin/pengguna/page.tsx` | tombol role, hapus `?edit=`, pesan `ok`/`err` baru |
| `src/app/admin/permintaan/page.tsx` | hapus kolom pengembalian, pesan error baru |
| `src/app/admin/permintaan/permintaan-client.tsx` | hapus `ReturnForm` dan `status_return` |
| `src/app/admin/barang/page.tsx` | muat `min_stok` untuk form |
| `src/app/(user)/permintaan/page.tsx` | pakai helper WIB bersama |
| `src/app/login/page.tsx` | pesan `?err=sesi` |
| `src/components/barang-form.tsx` | field Stok Minimum |
| `src/components/bulk-approval.tsx` | tampilkan hasil dari objek kembalian |
| `scripts/setup-db.mjs` | tiga langkah migrasi Bagian 6 |

---

## Rencana Verifikasi

Otomatis:

1. `npx tsc --noEmit` — harus tetap bersih (baseline sebelum perubahan sudah bersih)
2. `npm run db:setup` — berhasil, dan aman dijalankan dua kali berturut-turut
3. Query ulang `SELECT link, COUNT(*) FROM notifications GROUP BY link` — `/admin/peminjaman` harus sudah tidak ada
4. Query `information_schema.columns` — `dihapus_pada` ada, ketiga kolom pengembalian tidak ada

Manual, memakai dua peramban agar dua sesi berjalan bersamaan:

5. **Reset mencabut akses seketika** — user login di peramban B, admin menekan Reset di peramban A, navigasi berikutnya di B mendarat di `/login` dengan pesan sesi berakhir
6. **Penurunan role berlaku seketika** — admin kedua diturunkan jadi User, sesinya langsung terputus, dan tidak terjadi loop redirect
7. **Tidak bisa menurunkan role sendiri** — pesan `role-sendiri` muncul
8. **Akun belum aktivasi tidak bisa jadi admin** — pesan `role-nonaktif` muncul
9. **Hapus mempertahankan riwayat** — hapus pengguna yang punya permintaan, lalu buka Laporan Admin dan pastikan nama serta NIP-nya masih tampil
10. **Daftar ulang NIP terhapus** — memulihkan akun beserta riwayatnya
11. **Notifikasi** — klik notifikasi lama, harus mendarat di `/admin/permintaan`, bukan halaman tidak ditemukan
12. **Tolak ganda** — setujui lalu tolak permintaan yang sama, pastikan tidak ada notifikasi penolakan palsu
13. **Bulk** — setujui beberapa permintaan sekaligus, pastikan notifikasi dan audit log terbit untuk setiap pemohon

## Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Loop redirect antara middleware dan `requireAdmin` | Ditangani dengan Route Handler `/sesi-berakhir` yang menghapus cookie, bukan `redirect("/login")` biasa. Diuji eksplisit di langkah verifikasi 6. |
| Query pengguna terlewat disaring `dihapus_pada` | Bagian 2d mewajibkan penelusuran ulang seluruh rujukan tabel `pengguna` dan mengklasifikasikannya. |
| `DROP COLUMN` menghilangkan data | Terverifikasi nol isi sebelum spesifikasi ditulis. |
| Query tambahan per request dari `requireSession` | Pencarian primary key ber-`cache()` per request; aplikasi internal berskala 45 pengguna. |
| Basis data produksi tertinggal migrasi | Dicatat eksplisit di Bagian 6. |
