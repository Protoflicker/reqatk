/**
 * Pemberitahuan di dalam aplikasi.
 *
 * Modul ini hanya boleh dipanggil dari kode server (Server Component atau
 * Server Action di lib/actions.ts) karena menyentuh basis data secara
 * langsung. Untuk menandai pemberitahuan sudah dibaca dari sisi klien,
 * gunakan Server Action markNotificationAsRead / markAllNotificationsAsRead.
 */

import { db } from "./db";

export type NotificationType = "REQUEST_APPROVED" | "REQUEST_REJECTED" | "LOW_STOCK" | "NEW_REQUEST";

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

/**
 * Menyimpan satu pemberitahuan untuk seorang pengguna.
 */
async function sendNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  const sql = db();
  
  await sql`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (${userId}, ${type}, ${title}, ${message}, ${link || null})
  `;
}

/**
 * Notify user about request approval
 */
export async function notifyRequestApproved(userId: number, barangNama: string, jumlah: number): Promise<void> {
  await sendNotification(
    userId,
    "REQUEST_APPROVED",
    "✓ Permintaan Disetujui",
    `Permintaan Anda untuk ${jumlah}x ${barangNama} telah disetujui. Silakan ambil di bagian umum.`,
    "/laporan"
  );
}

/**
 * Notify user about request rejection
 */
export async function notifyRequestRejected(
  userId: number,
  barangNama: string,
  jumlah: number,
  reason?: string
): Promise<void> {
  const message = reason
    ? `Permintaan ${jumlah}x ${barangNama} ditolak. Alasan: ${reason}`
    : `Permintaan ${jumlah}x ${barangNama} ditolak.`;
    
  await sendNotification(
    userId,
    "REQUEST_REJECTED",
    "✕ Permintaan Ditolak",
    message,
    "/laporan"
  );
}

/**
 * Notify admins about new request
 */
export async function notifyAdminsNewRequest(pemohonNama: string, barangNama: string): Promise<void> {
  const sql = db();
  
  // Get all admin users
  const admins = await sql`
    SELECT id FROM pengguna WHERE role = 'admin'
  `;
  
  for (const admin of admins) {
    await sendNotification(
      (admin as { id: number }).id,
      "NEW_REQUEST",
      "📬 Permintaan Baru",
      `${pemohonNama} mengajukan permintaan ${barangNama}`,
      "/admin/permintaan"
    );
  }
}

/**
 * Notify admins about low stock
 */
export async function notifyAdminsLowStock(barangNama: string, stok: number, minStok: number): Promise<void> {
  const sql = db();
  
  const admins = await sql`
    SELECT id FROM pengguna WHERE role = 'admin'
  `;
  
  for (const admin of admins) {
    await sendNotification(
      (admin as { id: number }).id,
      "LOW_STOCK",
      "⚠️ Stok Menipis",
      `${barangNama} tinggal ${stok} (minimum: ${minStok}). Perlu restock!`,
      "/admin/barang"
    );
  }
}
