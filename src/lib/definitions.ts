export type Role = "admin" | "user";

export type StatusPeminjaman = "MENUNGGU" | "DISETUJUI" | "DITOLAK";

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
  satuan: string;
  stok: number;
  created_at: string;
}

export interface Peminjaman {
  id: number;
  pengguna_id: number;
  barang_id: number;
  jumlah: number;
  keperluan: string;
  status: StatusPeminjaman;
  tanggal_pinjam: string;
  catatan_admin: string | null;
  created_at: string;
}

/** Baris peminjaman hasil JOIN dengan pengguna dan barang untuk tabel/laporan. */
export interface PeminjamanDetail extends Peminjaman {
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

export const STATUS_LIST: StatusPeminjaman[] = [
  "MENUNGGU",
  "DISETUJUI",
  "DITOLAK",
];

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
