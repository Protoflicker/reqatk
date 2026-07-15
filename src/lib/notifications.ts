/**
 * Notification System
 * Support: Email, In-app notifications
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
 * Send in-app notification
 */
export async function sendNotification(
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
 * Get unread notifications for user
 */
export async function getUnreadNotifications(userId: number): Promise<Notification[]> {
  const sql = db();
  
  const rows = await sql`
    SELECT * FROM notifications
    WHERE user_id = ${userId} AND read = false
    ORDER BY created_at DESC
    LIMIT 20
  `;
  
  return rows as unknown as Notification[];
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: number): Promise<void> {
  const sql = db();
  
  await sql`
    UPDATE notifications
    SET read = true
    WHERE id = ${notificationId}
  `;
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(userId: number): Promise<void> {
  const sql = db();
  
  await sql`
    UPDATE notifications
    SET read = true
    WHERE user_id = ${userId} AND read = false
  `;
}

/**
 * Send email notification (placeholder - need to configure SMTP)
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  // TODO: Configure nodemailer with SMTP settings
  // For now, just log
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  
  // Example implementation:
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: Number(process.env.SMTP_PORT),
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });
  // await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html: htmlContent });
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
