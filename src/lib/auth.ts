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
