export type Role = "admin" | "user";

export type StatusPermintaan = "MENUNGGU" | "DISETUJUI" | "DITOLAK";

export interface Pengguna {
  id: number;
  nip: string;
  nama: string;
  role: Role;
  created_at: string;
  /** false = NIP sudah didaftarkan admin tetapi pemiliknya belum aktivasi. */
  aktif: boolean;
}

/** Hasil pengecekan NIP pada langkah pertama halaman login. */
export interface CekNipState {
  error?: string;
  /** "login" = akun aktif (minta kata sandi); "aktivasi" = lengkapi nama + sandi. */
  mode?: "login" | "aktivasi";
  nip?: string;
  nama?: string;
}

export interface Barang {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  jenis: string;
  satuan: string;
  stok: number;
  /** Ambang peringatan stok menipis; memicu notifikasi LOW_STOCK. */
  min_stok: number;
  created_at: string;
}

export interface Permintaan {
  id: number;
  pengguna_id: number;
  barang_id: number;
  jumlah: number;
  keperluan: string;
  status: StatusPermintaan;
  tanggal_pinjam: string;
  catatan_admin: string | null;
  created_at: string;
}

/** Baris permintaan hasil JOIN dengan pengguna dan barang untuk tabel/laporan. */
export interface PermintaanDetail extends Permintaan {
  nip: string;
  nama_pengguna: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
}

export interface ActionState {
  error?: string;
  success?: string;
}

export const STATUS_LIST: StatusPermintaan[] = [
  "MENUNGGU",
  "DISETUJUI",
  "DITOLAK",
];

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

export function formatTanggal(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
