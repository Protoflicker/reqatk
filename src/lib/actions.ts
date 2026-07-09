"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import {
  createSession,
  destroySession,
  requireAdmin,
  requireSession,
} from "./auth";
import type { ActionState, Role } from "./definitions";

/* ============================================================
   AUTENTIKASI
   ============================================================ */

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nip = String(formData.get("nip") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nip || !password) {
    return { error: "NIP dan kata sandi wajib diisi." };
  }

  let role: Role;
  try {
    const sql = db();
    const rows = (await sql`
      SELECT id, nip, nama, password_hash, role
      FROM pengguna
      WHERE nip = ${nip}
      LIMIT 1
    `) as {
      id: number;
      nip: string;
      nama: string;
      password_hash: string;
      role: Role;
    }[];

    if (rows.length === 0) {
      return { error: "NIP tidak terdaftar." };
    }

    const user = rows[0];
    const cocok = await bcrypt.compare(password, user.password_hash);
    if (!cocok) {
      return { error: "Kata sandi salah." };
    }

    await createSession({
      id: user.id,
      nip: user.nip,
      nama: user.nama,
      role: user.role,
    });
    role = user.role;
  } catch (e) {
    console.error("login gagal:", e);
    return {
      error:
        "Tidak dapat terhubung ke database. Periksa DATABASE_URL di .env.local.",
    };
  }

  redirect(role === "admin" ? "/admin" : "/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/* ============================================================
   PEMINJAMAN — SISI USER
   ============================================================ */

export async function ajukanPeminjaman(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const barangId = Number(formData.get("barang_id"));
  const jumlah = Number(formData.get("jumlah"));
  const keperluan = String(formData.get("keperluan") ?? "").trim();
  const tanggalPinjam = String(formData.get("tanggal_pinjam") ?? "").trim();

  if (!Number.isInteger(barangId) || barangId <= 0) {
    return { error: "Pilih barang terlebih dahulu." };
  }
  if (!Number.isInteger(jumlah) || jumlah <= 0) {
    return { error: "Jumlah harus bilangan bulat lebih dari nol." };
  }
  if (keperluan.length < 5) {
    return { error: "Keperluan wajib diisi (minimal 5 karakter)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalPinjam)) {
    return { error: "Tanggal pinjam tidak valid." };
  }

  try {
    const sql = db();
    const barang = (await sql`
      SELECT id, nama, stok FROM barang WHERE id = ${barangId} LIMIT 1
    `) as { id: number; nama: string; stok: number }[];

    if (barang.length === 0) {
      return { error: "Barang tidak ditemukan." };
    }
    if (barang[0].stok < jumlah) {
      return {
        error: `Stok ${barang[0].nama} tersisa ${barang[0].stok}. Kurangi jumlah permintaan.`,
      };
    }

    await sql`
      INSERT INTO peminjaman (pengguna_id, barang_id, jumlah, keperluan, tanggal_pinjam)
      VALUES (${session.id}, ${barangId}, ${jumlah}, ${keperluan}, ${tanggalPinjam})
    `;
  } catch (e) {
    console.error("ajukanPeminjaman gagal:", e);
    return { error: "Gagal menyimpan permintaan. Coba lagi." };
  }

  revalidatePath("/laporan");
  revalidatePath("/dashboard");
  revalidatePath("/admin/peminjaman");
  redirect("/laporan?ok=diajukan");
}

/* ============================================================
   PEMINJAMAN — SISI ADMIN
   ============================================================ */

export async function setujuiPeminjaman(
  id: number,
  _formData: FormData
): Promise<void> {
  await requireAdmin();

  let berhasil = false;
  try {
    const sql = db();
    // Satu statement atomik: stok hanya berkurang bila mencukupi,
    // dan status hanya berubah bila stok berhasil dikurangi.
    const rows = (await sql`
      WITH ambil AS (
        SELECT barang_id, jumlah
        FROM peminjaman
        WHERE id = ${id} AND status = 'MENUNGGU'
      ),
      kurangi AS (
        UPDATE barang b
        SET stok = b.stok - a.jumlah
        FROM ambil a
        WHERE b.id = a.barang_id AND b.stok >= a.jumlah
        RETURNING b.id
      )
      UPDATE peminjaman p
      SET status = 'DISETUJUI', updated_at = now()
      FROM kurangi k
      WHERE p.id = ${id}
      RETURNING p.id
    `) as { id: number }[];
    berhasil = rows.length > 0;
  } catch (e) {
    console.error("setujuiPeminjaman gagal:", e);
  }

  revalidatePath("/admin/peminjaman");
  revalidatePath("/admin");
  revalidatePath("/admin/barang");
  if (!berhasil) {
    redirect("/admin/peminjaman?err=stok");
  }
}

export async function tolakPeminjaman(
  id: number,
  formData: FormData
): Promise<void> {
  await requireAdmin();

  const catatan = String(formData.get("catatan") ?? "").trim() || null;

  try {
    const sql = db();
    await sql`
      UPDATE peminjaman
      SET status = 'DITOLAK', catatan_admin = ${catatan}, updated_at = now()
      WHERE id = ${id} AND status = 'MENUNGGU'
    `;
  } catch (e) {
    console.error("tolakPeminjaman gagal:", e);
  }

  revalidatePath("/admin/peminjaman");
  revalidatePath("/admin");
}

/* ============================================================
   BARANG — CRUD ADMIN
   ============================================================ */

export async function simpanBarang(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const idRaw = String(formData.get("id") ?? "").trim();
  const id = idRaw ? Number(idRaw) : null;
  const kode = String(formData.get("kode") ?? "").trim().toUpperCase();
  const nama = String(formData.get("nama") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "").trim();
  const satuan = String(formData.get("satuan") ?? "").trim() || "pcs";
  const stok = Number(formData.get("stok"));

  if (!kode || kode.length > 20) {
    return { error: "Kode barang wajib diisi (maks. 20 karakter)." };
  }
  if (!nama) {
    return { error: "Nama barang wajib diisi." };
  }
  if (!kategori) {
    return { error: "Kategori wajib diisi." };
  }
  if (!Number.isInteger(stok) || stok < 0) {
    return { error: "Stok harus bilangan bulat nol atau lebih." };
  }

  try {
    const sql = db();
    if (id) {
      await sql`
        UPDATE barang
        SET kode = ${kode}, nama = ${nama}, kategori = ${kategori},
            satuan = ${satuan}, stok = ${stok}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO barang (kode, nama, kategori, satuan, stok)
        VALUES (${kode}, ${nama}, ${kategori}, ${satuan}, ${stok})
      `;
    }
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return { error: `Kode barang ${kode} sudah dipakai barang lain.` };
    }
    console.error("simpanBarang gagal:", e);
    return { error: "Gagal menyimpan barang. Coba lagi." };
  }

  revalidatePath("/admin/barang");
  revalidatePath("/barang");
  redirect(`/admin/barang?ok=${id ? "ubah" : "tambah"}`);
}

/**
 * Penyesuaian stok cepat dari tabel barang: tambah/kurangi sejumlah N
 * tanpa membuka formulir ubah. Stok tidak pernah turun di bawah nol.
 */
export async function ubahStok(id: number, formData: FormData): Promise<void> {
  await requireAdmin();

  const jumlah = Number(formData.get("jumlah"));
  const arah = String(formData.get("arah") ?? "");

  if (
    !Number.isInteger(jumlah) ||
    jumlah <= 0 ||
    (arah !== "tambah" && arah !== "kurang")
  ) {
    redirect("/admin/barang?err=stok-input");
  }

  const delta = arah === "tambah" ? jumlah : -jumlah;

  try {
    const sql = db();
    await sql`
      UPDATE barang
      SET stok = GREATEST(0, stok + ${delta})
      WHERE id = ${id}
    `;
  } catch (e) {
    console.error("ubahStok gagal:", e);
  }

  revalidatePath("/admin/barang");
  revalidatePath("/barang");
  revalidatePath("/peminjaman");
}

export async function hapusBarang(id: number, _formData: FormData): Promise<void> {
  await requireAdmin();

  let err: string | null = null;
  try {
    const sql = db();
    await sql`DELETE FROM barang WHERE id = ${id}`;
  } catch (e: unknown) {
    if (isForeignKeyViolation(e)) {
      err = "terpakai";
    } else {
      console.error("hapusBarang gagal:", e);
      err = "gagal";
    }
  }

  revalidatePath("/admin/barang");
  revalidatePath("/barang");
  if (err) redirect(`/admin/barang?err=${err}`);
}

/* ============================================================
   PENGGUNA — CRUD ADMIN
   ============================================================ */

export async function simpanPengguna(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const idRaw = String(formData.get("id") ?? "").trim();
  const id = idRaw ? Number(idRaw) : null;
  const nip = String(formData.get("nip") ?? "").trim();
  const nama = String(formData.get("nama") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");

  if (!/^\d{5,30}$/.test(nip)) {
    return { error: "NIP harus berupa angka 5–30 digit." };
  }
  if (!nama) {
    return { error: "Nama wajib diisi." };
  }
  if (role !== "admin" && role !== "user") {
    return { error: "Role tidak valid." };
  }
  if (!id && password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }
  if (id && password && password.length < 6) {
    return { error: "Kata sandi baru minimal 6 karakter (kosongkan bila tidak diganti)." };
  }

  try {
    const sql = db();
    if (id) {
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        await sql`
          UPDATE pengguna
          SET nip = ${nip}, nama = ${nama}, role = ${role}, password_hash = ${hash}
          WHERE id = ${id}
        `;
      } else {
        await sql`
          UPDATE pengguna
          SET nip = ${nip}, nama = ${nama}, role = ${role}
          WHERE id = ${id}
        `;
      }
    } else {
      const hash = await bcrypt.hash(password, 10);
      await sql`
        INSERT INTO pengguna (nip, nama, password_hash, role)
        VALUES (${nip}, ${nama}, ${hash}, ${role})
      `;
    }
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return { error: `NIP ${nip} sudah terdaftar.` };
    }
    console.error("simpanPengguna gagal:", e);
    return { error: "Gagal menyimpan pengguna. Coba lagi." };
  }

  revalidatePath("/admin/pengguna");
  redirect(`/admin/pengguna?ok=${id ? "ubah" : "tambah"}`);
}

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
      await sql`DELETE FROM pengguna WHERE id = ${id}`;
    } catch (e: unknown) {
      if (isForeignKeyViolation(e)) {
        err = "terpakai";
      } else {
        console.error("hapusPengguna gagal:", e);
        err = "gagal";
      }
    }
  }

  revalidatePath("/admin/pengguna");
  if (err) redirect(`/admin/pengguna?err=${err}`);
}

/* ============================================================
   UTIL
   ============================================================ */

function pgCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    return String((e as { code?: unknown }).code);
  }
  return undefined;
}

function isUniqueViolation(e: unknown): boolean {
  return pgCode(e) === "23505";
}

function isForeignKeyViolation(e: unknown): boolean {
  return pgCode(e) === "23503";
}
