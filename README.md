# PINJAM/ATK®

Sistem permintaan & peminjaman alat tulis kantor (ATK) berbasis NIP, dengan
area terpisah untuk **pegawai (user)** dan **admin**. Dibangun di atas
infrastruktur ringan yang siap deploy ke Vercel dan tetap bisa dijalankan
lokal untuk troubleshooting.

## Teknologi

| Lapisan   | Pilihan                                    | Alasan                                     |
| --------- | ------------------------------------------ | ------------------------------------------ |
| Framework | Next.js 15 (App Router, Server Actions)    | Native Vercel, tanpa server terpisah       |
| Database  | Neon Postgres via `@neondatabase/serverless` | Driver HTTP serverless, tanpa ORM, ringan |
| Auth      | JWT cookie httpOnly (`jose`) + `bcryptjs`  | Tanpa NextAuth, jalan di Edge Middleware   |
| Styling   | Tailwind CSS v4                            | Satu file CSS, tanpa runtime tambahan      |
| Laporan   | `jspdf` + `jspdf-autotable` (server-side)  | PDF dibuat di route handler, tanpa headless browser |

Tidak ada ORM, tidak ada state-management library, tidak ada icon library —
total dependency runtime hanya 8 paket.

## Menjalankan secara lokal

### 1. Siapkan database Neon

1. Buat project di [console.neon.tech](https://console.neon.tech) (gratis).
2. Salin **connection string** (pilih yang *pooled*, berakhiran
   `-pooler...neon.tech`).

### 2. Konfigurasi environment

```bash
# di folder proyek
copy .env.example .env.local     # Windows
# cp .env.example .env.local     # macOS / Linux
```

Isi `.env.local`:

```
DATABASE_URL="postgresql://...connection string dari Neon..."
AUTH_SECRET="string acak minimal 32 karakter"
```

Buat `AUTH_SECRET` dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install, setup tabel, dan jalankan

```bash
npm install
npm run db:setup    # membuat tabel + akun awal + katalog contoh
npm run dev         # buka http://localhost:3000
```

### Akun awal (hasil seed)

| Role  | NIP         | Kata sandi |
| ----- | ----------- | ---------- |
| Admin | `123456789` | `admin123` |
| User  | `987654321` | `user123`  |

> Segera ganti kata sandi lewat menu **Pengguna** setelah login pertama.

## Deploy ke Vercel

1. Push repo ini ke GitHub / GitLab.
2. Di [vercel.com](https://vercel.com) pilih **Add New Project** → import repo.
3. Pada langkah konfigurasi, tambahkan **Environment Variables**:
   - `DATABASE_URL` — connection string *pooled* dari Neon
   - `AUTH_SECRET` — string acak (samakan atau bedakan dengan lokal, bebas)
4. Deploy. Tidak perlu konfigurasi lain — build command dan output sudah
   terdeteksi otomatis.
5. Jalankan `npm run db:setup` sekali dari mesin lokal (skrip menulis langsung
   ke Neon, jadi cukup dijalankan dari mana saja yang punya `DATABASE_URL`).

Tips: aktifkan integrasi resmi **Neon di Vercel Marketplace** bila ingin
`DATABASE_URL` terpasang otomatis.

## Alur sistem

```
USER                          ADMIN
----                          -----
login (NIP + sandi)           login (NIP + sandi)
cari & lihat daftar barang    kelola katalog barang (CRUD + cari
ajukan form peminjaman  --->    + tombol stok cepat +/-)
  status: MENUNGGU            antrean persetujuan
                                setujui -> stok berkurang permanen, DISETUJUI
lihat laporan pribadi           tolak   -> status DITOLAK (+ catatan)
  + unduh PDF                 laporan semua transaksi + unduh PDF / CSV
                              kelola pengguna (daftar/ubah/reset sandi)
```

- **Tidak ada alur pengembalian.** Begitu disetujui, stok berkurang permanen —
  cocok untuk barang habis pakai seperti ATK.
- Pengurangan stok terjadi **saat persetujuan**, bukan saat pengajuan, dan
  dieksekusi sebagai satu statement SQL atomik sehingga stok tidak bisa minus
  meski dua admin menyetujui bersamaan.
- Stok diisi ulang lewat tombol **+/− Stok Cepat** di tabel barang admin
  (mis. saat belanja ATK baru datang), tanpa membuka formulir ubah.
- Middleware memisahkan rute: user tidak bisa membuka `/admin/*`, admin
  diarahkan keluar dari halaman user.

## Struktur folder

```
scripts/setup-db.mjs        # buat tabel + seed (idempoten, aman diulang)
src/
  middleware.ts             # penjaga rute per role (Edge)
  lib/
    db.ts                   # klien Neon (lazy init)
    session.ts              # JWT sign/verify (aman untuk Edge)
    auth.ts                 # cookie session + guard requireAdmin/requireSession
    actions.ts              # semua Server Actions (login, CRUD, persetujuan)
    definitions.ts          # tipe data bersama
  components/               # sidebar, form, tabel, badge, dsb.
  app/
    login/                  # halaman masuk
    (user)/                 # area pegawai: dashboard, barang (cari),
                            #   peminjaman, laporan (+ export PDF)
    admin/                  # area admin: dashboard, barang (cari + stok cepat),
                            #   persetujuan, laporan (+ export PDF & CSV), pengguna
```

## Troubleshooting

| Gejala | Penyebab umum |
| ------ | ------------- |
| `DATABASE_URL belum diatur` | `.env.local` belum dibuat / salah nama variabel |
| Login gagal terus | `npm run db:setup` belum dijalankan (tabel kosong) |
| `AUTH_SECRET belum diatur` | Variabel belum diisi atau kurang dari 16 karakter |
| Berjalan lokal tapi gagal di Vercel | Env vars belum ditambahkan di dashboard Vercel |
| Kolom CSV berantakan di Excel | Buka via *Data → From Text/CSV*, pilih delimiter koma |
