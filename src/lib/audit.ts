/**
 * Audit Trail & Activity Logging
 */

import { db } from "./db";

/** Hanya aksi yang benar-benar ditulis lewat logActivity. */
export const ACTION_TYPES = [
  "LOGIN",
  "ACTIVATE_ACCOUNT",
  "CREATE_BARANG",
  "UPDATE_BARANG",
  "DELETE_BARANG",
  "CREATE_REQUEST",
  "APPROVE_REQUEST",
  "REJECT_REQUEST",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "RESET_USER",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

/** Label bahasa Indonesia untuk setiap aksi, dipakai halaman Activity Log. */
export const ACTION_LABELS: Record<ActionType, string> = {
  LOGIN: "Login",
  ACTIVATE_ACCOUNT: "Aktivasi Akun",
  CREATE_BARANG: "Tambah Barang",
  UPDATE_BARANG: "Ubah Barang",
  DELETE_BARANG: "Hapus Barang",
  CREATE_REQUEST: "Ajukan Permintaan",
  APPROVE_REQUEST: "Setujui Permintaan",
  REJECT_REQUEST: "Tolak Permintaan",
  CREATE_USER: "Daftarkan NIP",
  UPDATE_USER: "Ubah Pengguna",
  DELETE_USER: "Hapus Pengguna",
  RESET_USER: "Nonaktifkan Akun",
};

/** Mengembalikan aksi hanya bila dikenal — dipakai untuk menyaring input URL. */
export function parseActionType(value: unknown): ActionType | null {
  return typeof value === "string" &&
    (ACTION_TYPES as readonly string[]).includes(value)
    ? (value as ActionType)
    : null;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: ActionType;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

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

/**
 * Log an activity
 */
export async function logActivity(
  userId: number | null,
  action: ActionType,
  entityType: string,
  entityId?: number,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    const sql = db();
    // Parameter ipAddress tetap ada sebagai penimpa opsional; bila tidak
    // diisi, alamatnya diambil sendiri dari header permintaan.
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
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs(filters?: {
  userId?: number;
  action?: ActionType;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: ActivityLog[]; total: number }> {
  const sql = db();
  const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 200);
  const offset = Math.max(filters?.offset ?? 0, 0);

  // Setiap saringan dikirim sebagai parameter, bukan disambung ke dalam SQL:
  // nilainya berasal dari query string sehingga tidak boleh menyentuh query.
  const userId = filters?.userId ?? null;
  const action = filters?.action ?? null;
  const entityType = filters?.entityType ?? null;
  const startDate = filters?.startDate ?? null;
  const endDate = filters?.endDate ?? null;

  const [logs, countResult] = await Promise.all([
    sql`
      SELECT * FROM activity_logs
      WHERE (${userId}::int IS NULL         OR user_id = ${userId})
        AND (${action}::text IS NULL        OR action = ${action})
        AND (${entityType}::text IS NULL    OR entity_type = ${entityType})
        AND (${startDate}::timestamptz IS NULL OR created_at >= ${startDate})
        AND (${endDate}::timestamptz IS NULL   OR created_at <= ${endDate})
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*)::int AS total FROM activity_logs
      WHERE (${userId}::int IS NULL         OR user_id = ${userId})
        AND (${action}::text IS NULL        OR action = ${action})
        AND (${entityType}::text IS NULL    OR entity_type = ${entityType})
        AND (${startDate}::timestamptz IS NULL OR created_at >= ${startDate})
        AND (${endDate}::timestamptz IS NULL   OR created_at <= ${endDate})
    `,
  ]);

  return {
    logs: logs as unknown as ActivityLog[],
    total: (countResult[0] as { total: number }).total,
  };
}

/**
 * Get activity stats
 */
export async function getActivityStats(): Promise<{
  today: number;
  thisWeek: number;
  thisMonth: number;
  byAction: Record<string, number>;
}> {
  const sql = db();

  const [todayCount, weekCount, monthCount, byAction] = await Promise.all([
    sql`
      SELECT COUNT(*)::int as count
      FROM activity_logs
      WHERE created_at >= CURRENT_DATE
    `,
    sql`
      SELECT COUNT(*)::int as count
      FROM activity_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `,
    sql`
      SELECT COUNT(*)::int as count
      FROM activity_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `,
    sql`
      SELECT action, COUNT(*)::int as count
      FROM activity_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
    `,
  ]);

  const actionCounts: Record<string, number> = {};
  (byAction as { action: string; count: number }[]).forEach((row) => {
    actionCounts[row.action] = row.count;
  });

  return {
    today: (todayCount[0] as { count: number }).count,
    thisWeek: (weekCount[0] as { count: number }).count,
    thisMonth: (monthCount[0] as { count: number }).count,
    byAction: actionCounts,
  };
}
