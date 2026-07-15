import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { getActivityLogs, getActivityStats } from "@/lib/audit";
import { Pagination } from "@/components/pagination";
import Link from "next/link";

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  
  const currentPage = Number(params.page) || 1;
  const itemsPerPage = 50;
  const offset = (currentPage - 1) * itemsPerPage;

  const { logs, total } = await getActivityLogs({
    action: params.action as any,
    limit: itemsPerPage,
    offset,
  });

  const stats = await getActivityStats();
  const totalPages = Math.ceil(total / itemsPerPage);

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: "Login",
      LOGOUT: "Logout",
      CREATE_BARANG: "Tambah Barang",
      UPDATE_BARANG: "Update Barang",
      DELETE_BARANG: "Hapus Barang",
      CREATE_PERMINTAAN: "Ajukan Permintaan",
      APPROVE_PERMINTAAN: "Setujui Permintaan",
      REJECT_PERMINTAAN: "Tolak Permintaan",
      RETURN_PERMINTAAN: "Kembalikan Barang",
      CREATE_PENGGUNA: "Tambah Pengguna",
      UPDATE_PENGGUNA: "Update Pengguna",
      DELETE_PENGGUNA: "Hapus Pengguna",
      ADJUST_STOCK: "Sesuaikan Stok",
      UPDATE_PROFILE: "Update Profil",
      CHANGE_PASSWORD: "Ubah Password",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("APPROVE") || action.includes("ACTIVATE")) return "text-success";
    if (action.includes("DELETE") || action.includes("REJECT")) return "text-danger";
    if (action.includes("UPDATE") || action.includes("ADJUST") || action.includes("RESET")) return "text-primary";
    return "text-text-muted";
  };

  return (
    <>
      <PageHeader
        title="Activity Logs"
        description="Audit trail untuk semua aktivitas di sistem. Track perubahan dan akses."
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="sesd-stat">
          <p className="sesd-stat-num">{stats.today}</p>
          <p className="sesd-stat-label">Hari Ini</p>
        </div>
        <div className="sesd-stat is-neutral">
          <p className="sesd-stat-num">{stats.thisWeek}</p>
          <p className="sesd-stat-label">Minggu Ini</p>
        </div>
        <div className="sesd-stat is-neutral">
          <p className="sesd-stat-num">{stats.thisMonth}</p>
          <p className="sesd-stat-label">Bulan Ini</p>
        </div>
      </div>

      {/* Filter */}
      <div className="neu-card mb-6 hover:transform-none">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/logs"
            className={`${!params.action ? "neu-btn-primary" : "btn"} px-4 py-1.5 text-xs`}
          >
            Semua
          </Link>
          {Object.keys(stats.byAction).slice(0, 8).map((action) => (
            <Link
              key={action}
              href={`/admin/logs?action=${action}`}
              className={`${params.action === action ? "neu-btn-primary" : "btn"} px-4 py-1.5 text-xs`}
            >
              {getActionLabel(action)} ({stats.byAction[action]})
            </Link>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap font-mono text-xs text-text-muted">
                  {new Date(log.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td>
                  <span className="text-text">User #{log.user_id || "-"}</span>
                </td>
                <td>
                  <span className={`font-bold ${getActionColor(log.action)}`}>
                    {getActionLabel(log.action)}
                  </span>
                </td>
                <td className="text-text-muted">
                  {log.entity_type}
                  {log.entity_id && ` #${log.entity_id}`}
                </td>
                <td className="text-xs text-text-muted">
                  {log.details ? (
                    <details className="cursor-pointer">
                      <summary>Lihat</summary>
                      <pre className="neu-inset mt-2 max-w-xs overflow-auto p-2 font-mono text-[10px]">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="font-mono text-xs text-text-muted">
                  {log.ip_address || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              const url = new URL(window.location.href);
              url.searchParams.set("page", page.toString());
              window.location.href = url.toString();
            }}
          />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-text-muted">
        Total {total} aktivitas tercatat
      </p>
    </>
  );
}
