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
      CREATE_PEMINJAMAN: "Ajukan Peminjaman",
      APPROVE_PEMINJAMAN: "Setujui Peminjaman",
      REJECT_PEMINJAMAN: "Tolak Peminjaman",
      RETURN_PEMINJAMAN: "Kembalikan Barang",
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
    if (action.includes("CREATE") || action.includes("APPROVE")) return "text-green-600";
    if (action.includes("DELETE") || action.includes("REJECT")) return "text-red-600";
    if (action.includes("UPDATE") || action.includes("ADJUST")) return "text-blue-600";
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
        <div className="neu-card text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Hari Ini</p>
          <p className="mt-2 font-display text-3xl font-bold text-dark">{stats.today}</p>
        </div>
        <div className="neu-card text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Minggu Ini</p>
          <p className="mt-2 font-display text-3xl font-bold text-dark">{stats.thisWeek}</p>
        </div>
        <div className="neu-card text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Bulan Ini</p>
          <p className="mt-2 font-display text-3xl font-bold text-dark">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="neu-card mb-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/logs"
            className={`neu-btn px-4 py-2 text-xs font-bold ${
              !params.action ? "neu-btn-primary text-white" : "text-dark-light"
            }`}
          >
            Semua
          </Link>
          {Object.keys(stats.byAction).slice(0, 8).map((action) => (
            <Link
              key={action}
              href={`/admin/logs?action=${action}`}
              className={`neu-btn px-4 py-2 text-xs font-bold ${
                params.action === action ? "neu-btn-primary text-white" : "text-dark-light"
              }`}
            >
              {getActionLabel(action)} ({stats.byAction[action]})
            </Link>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="neu-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-bg text-xs uppercase tracking-wider text-text-muted">
              <th className="pb-3">Waktu</th>
              <th className="pb-3">User</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Entity</th>
              <th className="pb-3">Details</th>
              <th className="pb-3">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-bg last:border-0">
                <td className="py-3 text-xs text-text-muted">
                  {new Date(log.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3">
                  <span className="text-dark">User #{log.user_id || "-"}</span>
                </td>
                <td className="py-3">
                  <span className={`font-bold ${getActionColor(log.action)}`}>
                    {getActionLabel(log.action)}
                  </span>
                </td>
                <td className="py-3 text-dark-light">
                  {log.entity_type}
                  {log.entity_id && ` #${log.entity_id}`}
                </td>
                <td className="py-3 text-xs text-text-muted">
                  {log.details ? (
                    <details className="cursor-pointer">
                      <summary>View</summary>
                      <pre className="neu-inset mt-2 max-w-xs overflow-auto p-2 text-[10px]">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-3 text-xs font-mono text-text-muted">
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
