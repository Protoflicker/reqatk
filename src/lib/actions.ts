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
import type { ActionState, CekNipState, Role } from "./definitions";
import type { Notification } from "./notifications";
import { logActivity } from "./audit";

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

export async function getNotifications(userId: number): Promise<Notification[]> {
  const sql = db();
  
  const rows = await sql`
    SELECT * FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  
  return rows as unknown as Notification[];
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const sql = db();
  
  await sql`
    UPDATE notifications
    SET read = true
    WHERE id = ${notificationId}
  `;
  
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const sql = db();
  
  await sql`
    UPDATE notifications
    SET read = true
    WHERE user_id = ${userId} AND read = false
  `;
  
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

/* ============================================================
   AUTENTIKASI
   ============================================================ */

/**
 * Langkah pertama login: cek status NIP.
 * - NIP tidak terdaftar  → error (hubungi admin)
 * - NIP terdaftar, belum aktivasi (password_hash NULL) → mode "aktivasi"
 * - NIP terdaftar dan aktif → mode "login" (minta kata sandi)
 */
export async function cekNip(
  _prevState: CekNipState,
  formData: FormData
): Promise<CekNipState> {
  const nip = String(formData.get("nip") ?? "").trim();

  // Saat error, nip dikembalikan agar isian tidak hilang (React mereset form).
  if (!/^\d{5,30}$/.test(nip)) {
    return { error: "NIP harus berupa angka 5–30 digit.", nip };
  }

  try {
    const sql = db();
    const rows = (await sql`
      SELECT nama, password_hash IS NOT NULL AS aktif
      FROM pengguna
      WHERE nip = ${nip}
      LIMIT 1
    `) as { nama: string; aktif: boolean }[];

    if (rows.length === 0) {
      return {
        error:
          "NIP tidak terdaftar. Hubungi admin bagian umum untuk didaftarkan.",
        nip,
      };
    }

    return {
      mode: rows[0].aktif ? "login" : "aktivasi",
      nip,
      nama: rows[0].nama || "",
    };
  } catch (e) {
    console.error("cekNip gagal:", e);
    return {
      error: "Terjadi gangguan pada sistem. Coba lagi beberapa saat.",
      nip,
    };
  }
}

/**
 * Aktivasi akun: pemilik NIP yang didaftarkan admin melengkapi nama dan
 * kata sandi. Hanya berlaku selama akun belum aktif (password_hash NULL)
 * DAN berperan 'user'. Batasan role mencegah eskalasi hak akses: akun
 * admin tidak dapat diklaim lewat jalur aktivasi publik ini walau kata
 * sandinya kosong — admin harus diamankan ulang lewat formulir Kelola
 * Pengguna oleh admin lain.
 */
export async function aktivasiAkun(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nip = String(formData.get("nip") ?? "").trim();
  const nama = String(formData.get("nama") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const konfirmasi = String(formData.get("konfirmasi") ?? "");

  if (!/^\d{5,30}$/.test(nip)) {
    return { error: "NIP tidak valid." };
  }
  if (nama.length < 3) {
    return { error: "Nama lengkap minimal 3 karakter." };
  }
  if (password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }
  if (password !== konfirmasi) {
    return { error: "Konfirmasi kata sandi tidak cocok." };
  }

  let role: Role;
  try {
    const sql = db();
    const hash = await bcrypt.hash(password, 10);
    const rows = (await sql`
      UPDATE pengguna
      SET nama = ${nama}, password_hash = ${hash}
      WHERE nip = ${nip} AND password_hash IS NULL AND role = 'user'
      RETURNING id, nip, nama, role
    `) as { id: number; nip: string; nama: string; role: Role }[];

    if (rows.length === 0) {
      return {
        error:
          "Akun ini tidak dapat diaktivasi lewat halaman ini. Hubungi admin bagian umum.",
      };
    }

    const user = rows[0];
    await createSession({
      id: user.id,
      nip: user.nip,
      nama: user.nama,
      role: user.role,
    });
    role = user.role;

    try {
      await logActivity(user.id, "ACTIVATE_ACCOUNT", "pengguna", user.id, {
        nip: user.nip,
      });
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  } catch (e) {
    console.error("aktivasiAkun gagal:", e);
    return { error: "Gagal mengaktifkan akun. Coba lagi." };
  }

  redirect(role === "admin" ? "/admin" : "/dashboard");
}

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
      password_hash: string | null;
      role: Role;
    }[];

    if (rows.length === 0) {
      return { error: "NIP tidak terdaftar." };
    }

    const user = rows[0];
    if (!user.password_hash) {
      return {
        error:
          "Akun belum diaktivasi. Ulangi dari langkah NIP untuk melengkapi nama dan kata sandi.",
      };
    }
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
    
    // Log login activity
    try {
      const { logActivity } = await import("./audit");
      await logActivity(user.id, "LOGIN", "pengguna", user.id);
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  } catch (e) {
    console.error("login gagal:", e);
    return {
      error: "Terjadi gangguan pada sistem. Coba lagi beberapa saat.",
    };
  }

  redirect(role === "admin" ? "/admin" : "/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/* ============================================================
   PERMINTAAN — SISI USER
   ============================================================ */

export async function ajukanPermintaan(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const cartDataStr = String(formData.get("cart_data") ?? "");
  const keperluan = String(formData.get("keperluan") ?? "").trim();
  const tanggalPinjam = String(formData.get("tanggal_pinjam") ?? "").trim();

  let cartItems: { barang_id: number; jumlah: number }[] = [];
  
  if (cartDataStr) {
    try {
      cartItems = JSON.parse(cartDataStr);
    } catch (e) {
      return { error: "Data keranjang tidak valid." };
    }
  } else {
    // Fallback for old forms
    const bId = Number(formData.get("barang_id"));
    const qty = Number(formData.get("jumlah"));
    if (bId && qty) {
      cartItems = [{ barang_id: bId, jumlah: qty }];
    }
  }

  if (cartItems.length === 0) {
    return { error: "Pilih minimal satu barang terlebih dahulu." };
  }
  if (keperluan.length < 5) {
    return { error: "Keperluan wajib diisi (minimal 5 karakter)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalPinjam)) {
    return { error: "Tanggal pinjam tidak valid." };
  }

  let barangNames: string[] = [];
  
  try {
    const sql = db();
    
    // Validasi stok semua barang terlebih dahulu
    for (const item of cartItems) {
      if (!Number.isInteger(item.barang_id) || item.barang_id <= 0) {
        return { error: "ID Barang tidak valid." };
      }
      if (!Number.isInteger(item.jumlah) || item.jumlah <= 0) {
        return { error: "Jumlah harus lebih dari nol." };
      }
      
      const barang = (await sql`
        SELECT id, nama, stok FROM barang WHERE id = ${item.barang_id} LIMIT 1
      `) as { id: number; nama: string; stok: number }[];

      if (barang.length === 0) {
        return { error: "Ada barang yang tidak ditemukan." };
      }
      if (barang[0].stok < item.jumlah) {
        return {
          error: `Stok ${barang[0].nama} tersisa ${barang[0].stok}. Kurangi jumlah permintaan.`,
        };
      }
    }
    
    // Insert setiap item sebagai permintaan terpisah
    for (const item of cartItems) {
      const barang = (await sql`
        SELECT id, nama, stok FROM barang WHERE id = ${item.barang_id} LIMIT 1
      `) as { id: number; nama: string; stok: number }[];
      
      const barangNama = barang[0].nama;
      barangNames.push(barangNama);

      const result = await sql`
        INSERT INTO permintaan (pengguna_id, barang_id, jumlah, keperluan, tanggal_pinjam)
        VALUES (${session.id}, ${item.barang_id}, ${item.jumlah}, ${keperluan}, ${tanggalPinjam})
        RETURNING id
      `;
      
      const newRequestId = (result[0] as { id: number }).id;
      
      // Log activity per item
      await logActivity(
        session.id,
        "CREATE_REQUEST",
        "permintaan",
        newRequestId,
        { barang_id: item.barang_id, barang_nama: barangNama, jumlah: item.jumlah, keperluan }
      );
    }
  } catch (e) {
    console.error("ajukanPermintaan gagal:", e);
    return { error: "Gagal menyimpan permintaan. Coba lagi." };
  }

  revalidatePath("/laporan");
  revalidatePath("/dashboard");
  revalidatePath("/admin/permintaan");
  
  // Notify admins about new requests
  try {
    const { notifyAdminsNewRequest } = await import("./notifications");
    // Only pass first few names to not overflow notification text
    const summaryNames = barangNames.length > 2 
      ? `${barangNames.slice(0, 2).join(", ")} dan ${barangNames.length - 2} lainnya`
      : barangNames.join(", ");
    await notifyAdminsNewRequest(session.nama, summaryNames);
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
  
  redirect("/laporan?ok=diajukan");
}

/* ============================================================
   PERMINTAAN — SISI ADMIN
   ============================================================ */

export async function setujuiPermintaan(
  id: number,
  _formData: FormData
): Promise<void> {
  const session = await requireAdmin();

  let berhasil = false;
  try {
    const sql = db();
    // Satu statement atomik: stok hanya berkurang bila mencukupi,
    // dan status hanya berubah bila stok berhasil dikurangi.
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
        RETURNING b.id
      )
      UPDATE permintaan p
      SET status = 'DISETUJUI', updated_at = now()
      FROM kurangi k
      WHERE p.id = ${id}
      RETURNING p.id
    `) as { id: number }[];
    berhasil = rows.length > 0;
    
    // Log activity if successful
    if (berhasil) {
      await logActivity(
        session.id,
        "APPROVE_REQUEST",
        "permintaan",
        id,
        { action: "approved", status: "DISETUJUI" }
      );
    }
  } catch (e) {
    console.error("setujuiPermintaan gagal:", e);
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin");
  revalidatePath("/admin/barang");
  if (!berhasil) {
    redirect("/admin/permintaan?err=stok");
  }
  
  // Send notification to user
  try {
    const sql = db();
    const [request] = (await sql`
      SELECT p.pengguna_id, p.jumlah, b.nama as barang_nama
      FROM permintaan p
      JOIN barang b ON b.id = p.barang_id
      WHERE p.id = ${id}
      LIMIT 1
    `) as { pengguna_id: number; jumlah: number; barang_nama: string }[];
    
    if (request) {
      const { notifyRequestApproved } = await import("./notifications");
      await notifyRequestApproved(request.pengguna_id, request.barang_nama, request.jumlah);
    }
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}

export async function tolakPermintaan(
  id: number,
  formData: FormData
): Promise<void> {
  const session = await requireAdmin();

  const catatan = String(formData.get("catatan") ?? "").trim() || null;

  try {
    const sql = db();
    await sql`
      UPDATE permintaan
      SET status = 'DITOLAK', catatan_admin = ${catatan}, updated_at = now()
      WHERE id = ${id} AND status = 'MENUNGGU'
    `;
    
    // Log activity
    await logActivity(
      session.id,
      "REJECT_REQUEST",
      "permintaan",
      id,
      { action: "rejected", status: "DITOLAK", catatan }
    );
  } catch (e) {
    console.error("tolakPermintaan gagal:", e);
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin");
  
  // Send notification to user
  try {
    const sql = db();
    const [request] = (await sql`
      SELECT p.pengguna_id, p.jumlah, b.nama as barang_nama
      FROM permintaan p
      JOIN barang b ON b.id = p.barang_id
      WHERE p.id = ${id}
      LIMIT 1
    `) as { pengguna_id: number; jumlah: number; barang_nama: string }[];
    
    if (request) {
      const { notifyRequestRejected } = await import("./notifications");
      await notifyRequestRejected(request.pengguna_id, request.barang_nama, request.jumlah, catatan || undefined);
    }
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}

/* ============================================================
   RETURN WORKFLOW
   ============================================================ */

export async function markAsReturned(
  id: number,
  formData: FormData
): Promise<void> {
  await requireAdmin();

  const tanggalKembali = String(formData.get("tanggal_kembali") ?? "").trim();
  const catatanKembali = String(formData.get("catatan_kembali") ?? "").trim() || null;

  if (!tanggalKembali || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalKembali)) {
    redirect("/admin/permintaan?err=tanggal");
    return;
  }

  try {
    const sql = db();
    
    // Get permintaan details
    const [permintaan] = (await sql`
      SELECT p.barang_id, p.jumlah, p.status
      FROM permintaan p
      WHERE p.id = ${id} AND p.status = 'DISETUJUI' AND p.status_return = 'BELUM_DIKEMBALIKAN'
      LIMIT 1
    `) as { barang_id: number; jumlah: number; status: string }[];
    
    if (!permintaan) {
      redirect("/admin/permintaan?err=not-found");
      return;
    }
    
    // Update permintaan status and return stock
    await sql`
      WITH return_stock AS (
        UPDATE barang
        SET stok = stok + ${permintaan.jumlah}
        WHERE id = ${permintaan.barang_id}
        RETURNING id
      )
      UPDATE permintaan
      SET 
        status_return = 'DIKEMBALIKAN',
        tanggal_kembali = ${tanggalKembali},
        catatan_kembali = ${catatanKembali},
        updated_at = now()
      FROM return_stock
      WHERE permintaan.id = ${id}
    `;
  } catch (e) {
    console.error("markAsReturned gagal:", e);
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin/barang");
  revalidatePath("/admin");
}

export async function markAsNotReturnable(id: number): Promise<void> {
  await requireAdmin();

  try {
    const sql = db();
    await sql`
      UPDATE permintaan
      SET status_return = 'TIDAK_PERLU', updated_at = now()
      WHERE id = ${id} AND status = 'DISETUJUI'
    `;
  } catch (e) {
    console.error("markAsNotReturnable gagal:", e);
  }

  revalidatePath("/admin/permintaan");
}

/* ============================================================
   BULK OPERATIONS — PERMINTAAN
   ============================================================ */

export async function bulkApprovePermintaan(ids: number[]): Promise<void> {
  await requireAdmin();

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("No IDs provided");
  }

  try {
    const sql = db();
    
    // Process each approval with atomic stock deduction
    for (const id of ids) {
      await sql`
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
          RETURNING b.id
        )
        UPDATE permintaan p
        SET status = 'DISETUJUI', updated_at = now()
        FROM kurangi k
        WHERE p.id = ${id}
      `;
    }
  } catch (e) {
    console.error("bulkApprovePermintaan gagal:", e);
    throw e;
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin");
  revalidatePath("/admin/barang");
}

export async function bulkRejectPermintaan(
  ids: number[],
  catatan: string | null
): Promise<void> {
  await requireAdmin();

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("No IDs provided");
  }

  try {
    const sql = db();
    
    // Reject all selected items with the same note
    await sql`
      UPDATE permintaan
      SET status = 'DITOLAK', catatan_admin = ${catatan}, updated_at = now()
      WHERE id = ANY(${ids}) AND status = 'MENUNGGU'
    `;
  } catch (e) {
    console.error("bulkRejectPermintaan gagal:", e);
    throw e;
  }

  revalidatePath("/admin/permintaan");
  revalidatePath("/admin");
}

/* ============================================================
   BARANG — CRUD ADMIN
   ============================================================ */

export async function simpanBarang(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const idRaw = String(formData.get("id") ?? "").trim();
  const id = idRaw ? Number(idRaw) : null;
  const kode = String(formData.get("kode") ?? "").trim().toUpperCase();
  const nama = String(formData.get("nama") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "").trim();
  const jenis = String(formData.get("jenis") ?? "").trim();
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
            jenis = ${jenis}, satuan = ${satuan}, stok = ${stok}
        WHERE id = ${id}
      `;
      
      // Log update activity
      await logActivity(
        session.id,
        "UPDATE_BARANG",
        "barang",
        id,
        { kode, nama, kategori, jenis, satuan, stok }
      );
    } else {
      const result = await sql`
        INSERT INTO barang (kode, nama, kategori, jenis, satuan, stok)
        VALUES (${kode}, ${nama}, ${kategori}, ${jenis}, ${satuan}, ${stok})
        RETURNING id
      `;
      
      const newId = (result[0] as { id: number }).id;
      
      // Log create activity
      await logActivity(
        session.id,
        "CREATE_BARANG",
        "barang",
        newId,
        { kode, nama, kategori, jenis, satuan, stok }
      );
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
  revalidatePath("/permintaan");
  
  // Check for low stock and notify admins
  try {
    const sql = db();
    const [barang] = (await sql`
      SELECT id, nama, stok, min_stok
      FROM barang
      WHERE id = ${id} AND stok <= min_stok
      LIMIT 1
    `) as { id: number; nama: string; stok: number; min_stok: number }[];
    
    if (barang && arah === "kurang") {
      const { notifyAdminsLowStock } = await import("./notifications");
      await notifyAdminsLowStock(barang.nama, barang.stok, barang.min_stok);
    }
  } catch (e) {
    console.error("Failed to check low stock:", e);
  }
}

export async function hapusBarang(id: number, _formData: FormData): Promise<void> {
  const session = await requireAdmin();

  let err: string | null = null;
  try {
    const sql = db();
    
    // Get barang info before deletion for logging
    const barang = (await sql`
      SELECT kode, nama FROM barang WHERE id = ${id} LIMIT 1
    `) as { kode: string; nama: string }[];
    
    await sql`DELETE FROM barang WHERE id = ${id}`;
    
    if (barang.length > 0) {
      // Log delete activity
      await logActivity(
        session.id,
        "DELETE_BARANG",
        "barang",
        id,
        { kode: barang[0].kode, nama: barang[0].nama }
      );
    }
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

/**
 * Pendaftaran NIP oleh admin. Hanya NIP yang dimasukkan; akun tercipta
 * dalam keadaan belum aktif (password_hash NULL) sampai pemilik NIP
 * melengkapi nama + kata sandi lewat halaman login.
 */
export async function daftarkanNip(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const nip = String(formData.get("nip") ?? "").trim();

  if (!/^\d{5,30}$/.test(nip)) {
    return { error: "NIP harus berupa angka 5–30 digit." };
  }

  try {
    const sql = db();
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
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return { error: `NIP ${nip} sudah terdaftar.` };
    }
    console.error("daftarkanNip gagal:", e);
    return { error: "Gagal mendaftarkan NIP. Coba lagi." };
  }

  revalidatePath("/admin/pengguna");
  redirect("/admin/pengguna?ok=nip");
}

/**
 * Reset aktivasi: kata sandi dihapus sehingga akun kembali berstatus
 * belum aktif. Pemilik NIP harus mendaftar ulang (nama + sandi) saat login.
 *
 * Akun admin TIDAK boleh direset: menonaktifkan admin akan membuatnya bisa
 * diklaim ulang oleh siapa pun yang tahu NIP-nya (eskalasi hak akses).
 * Untuk mencabut akses admin, ubah role-nya jadi user lewat formulir edit.
 */
export async function resetAktivasi(
  id: number,
  _formData: FormData
): Promise<void> {
  const session = await requireAdmin();

  let err: string | null = null;
  if (id === session.id) {
    err = "reset-sendiri";
  } else {
    try {
      const sql = db();
      const target = (await sql`
        SELECT nip, role FROM pengguna WHERE id = ${id} LIMIT 1
      `) as { nip: string; role: Role }[];

      if (target.length === 0) {
        err = "gagal";
      } else if (target[0].role === "admin") {
        err = "reset-admin";
      } else {
        await sql`
          UPDATE pengguna
          SET password_hash = NULL
          WHERE id = ${id} AND role = 'user'
        `;
        await logActivity(session.id, "RESET_USER", "pengguna", id, {
          nip: target[0].nip,
          status: "dinonaktifkan",
        });
      }
    } catch (e) {
      console.error("resetAktivasi gagal:", e);
      err = "gagal";
    }
  }

  revalidatePath("/admin/pengguna");
  redirect(err ? `/admin/pengguna?err=${err}` : "/admin/pengguna?ok=reset");
}

export async function simpanPengguna(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();

  const id = Number(formData.get("id"));
  const nip = String(formData.get("nip") ?? "").trim();
  const nama = String(formData.get("nama") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Pengguna baru didaftarkan lewat formulir NIP di atas." };
  }
  if (!/^\d{5,30}$/.test(nip)) {
    return { error: "NIP harus berupa angka 5–30 digit." };
  }
  if (!nama) {
    return { error: "Nama wajib diisi." };
  }
  if (role !== "admin" && role !== "user") {
    return { error: "Role tidak valid." };
  }
  if (password && password.length < 6) {
    return { error: "Kata sandi baru minimal 6 karakter (kosongkan bila tidak diganti)." };
  }

  try {
    const sql = db();
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

    await logActivity(
      session.id,
      "UPDATE_USER",
      "pengguna",
      id,
      { nip, nama, role, password_changed: !!password }
    );
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return { error: `NIP ${nip} sudah terdaftar.` };
    }
    console.error("simpanPengguna gagal:", e);
    return { error: "Gagal menyimpan pengguna. Coba lagi." };
  }

  revalidatePath("/admin/pengguna");
  redirect("/admin/pengguna?ok=ubah");
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
      
      // Get user info before deletion for logging
      const user = (await sql`
        SELECT nip, nama, role FROM pengguna WHERE id = ${id} LIMIT 1
      `) as { nip: string; nama: string; role: string }[];
      
      await sql`DELETE FROM pengguna WHERE id = ${id}`;
      
      if (user.length > 0) {
        // Log delete activity
        await logActivity(
          session.id,
          "DELETE_USER",
          "pengguna",
          id,
          { nip: user[0].nip, nama: user[0].nama, role: user[0].role }
        );
      }
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
   PROFILE & PASSWORD
   ============================================================ */

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const userId = Number(formData.get("user_id"));
  
  // Security: only allow users to update their own profile
  if (userId !== session.id) {
    return { error: "Tidak diizinkan mengubah profil pengguna lain." };
  }
  
  const nama = String(formData.get("nama") ?? "").trim();
  
  if (!nama || nama.length < 3) {
    return { error: "Nama harus minimal 3 karakter." };
  }
  
  try {
    const sql = db();
    await sql`
      UPDATE pengguna
      SET nama = ${nama}
      WHERE id = ${userId}
    `;
    
    // Update session with new name
    await createSession({
      id: session.id,
      nip: session.nip,
      nama: nama,
      role: session.role,
    });
  } catch (e) {
    console.error("updateProfile gagal:", e);
    return { error: "Gagal menyimpan perubahan." };
  }
  
  revalidatePath("/profile");
  revalidatePath("/admin/profile");
  return { success: "Profil berhasil diperbarui!" };
}

export async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const userId = Number(formData.get("user_id"));
  
  // Security: only allow users to change their own password
  if (userId !== session.id) {
    return { error: "Tidak diizinkan mengubah kata sandi pengguna lain." };
  }
  
  const oldPassword = String(formData.get("old_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  
  if (!oldPassword || !newPassword || !confirmPassword) {
    return { error: "Semua field wajib diisi." };
  }
  
  if (newPassword.length < 6) {
    return { error: "Kata sandi baru minimal 6 karakter." };
  }
  
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi kata sandi tidak cocok." };
  }
  
  try {
    const sql = db();
    
    // Verify old password
    const [user] = (await sql`
      SELECT password_hash FROM pengguna WHERE id = ${userId} LIMIT 1
    `) as { password_hash: string }[];
    
    if (!user) {
      return { error: "Pengguna tidak ditemukan." };
    }
    
    const isCorrect = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isCorrect) {
      return { error: "Kata sandi lama salah." };
    }
    
    // Update with new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE pengguna
      SET password_hash = ${newHash}
      WHERE id = ${userId}
    `;
  } catch (e) {
    console.error("changePassword gagal:", e);
    return { error: "Gagal mengubah kata sandi." };
  }
  
  return { success: "Kata sandi berhasil diubah!" };
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
  const code = pgCode(e);
  return code === "23503" || code === "23001";
}
