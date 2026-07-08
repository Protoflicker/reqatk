/**
 * Audit Trail & Activity Logging
 */

import { db } from "./db";

export type ActionType =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_BARANG"
  | "UPDATE_BARANG"
  | "DELETE_BARANG"
  | "CREATE_PEMINJAMAN"
  | "APPROVE_PEMINJAMAN"
  | "REJECT_PEMINJAMAN"
  | "RETURN_PEMINJAMAN"
  | "CREATE_PENGGUNA"
  | "UPDATE_PENGGUNA"
  | "DELETE_PENGGUNA"
  | "ADJUST_STOCK"
  | "UPDATE_PROFILE"
  | "CHANGE_PASSWORD";

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
    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (
        ${userId}, 
        ${action}, 
        ${entityType}, 
        ${entityId || null}, 
        ${details ? JSON.stringify(details) : null},
        ${ipAddress || null}
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
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  let whereConditions = [];
  let params: any = {};

  if (filters?.userId) {
    whereConditions.push(`user_id = ${filters.userId}`);
  }
  if (filters?.action) {
    whereConditions.push(`action = '${filters.action}'`);
  }
  if (filters?.entityType) {
    whereConditions.push(`entity_type = '${filters.entityType}'`);
  }
  if (filters?.startDate) {
    whereConditions.push(`created_at >= '${filters.startDate}'`);
  }
  if (filters?.endDate) {
    whereConditions.push(`created_at <= '${filters.endDate}'`);
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  const [logs, countResult] = await Promise.all([
    sql`
      SELECT * FROM activity_logs
      ${whereClause ? sql.unsafe(whereClause) : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*)::int as total FROM activity_logs
      ${whereClause ? sql.unsafe(whereClause) : sql``}
    `,
  ]);

  return {
    logs: logs as unknown as ActivityLog[],
    total: (countResult[0] as { total: number }).total,
  };
}

/**
 * Get recent activities for a user
 */
export async function getUserRecentActivities(
  userId: number,
  limit: number = 10
): Promise<ActivityLog[]> {
  const sql = db();

  const logs = await sql`
    SELECT * FROM activity_logs
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return logs as unknown as ActivityLog[];
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
