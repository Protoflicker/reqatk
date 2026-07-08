import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hapusPengguna } from "@/lib/actions";
import { PageHeader } from "@/components/page-header";
import { PenggunaForm } from "@/components/pengguna-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Alert } from "@/components/alert";
import { formatTanggal, type Pengguna } from "@/lib/definitions";

const OK_MSG: Record<string, string> = {
  tambah: "Pengguna baru berhasil didaftarkan.",
  ubah: "Data pengguna berhasil diperbarui.",
};

const ERR_MSG: Record<string, string> = {
  sendiri: "Anda tidak dapat menghapus akun yang sedang dipakai.",
  terpakai:
    "Pengguna tidak bisa dihapus karena punya riwayat peminjaman. Ubah role-nya bila perlu mencabut akses.",
  gagal: "Gagal menghapus pengguna. Coba lagi.",
};

export default async function AdminPenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; ok?: string; err?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const sql = db();

  const rows = (await sql`
    SELECT id, nip, nama, role, created_at
    FROM pengguna
    ORDER BY role ASC, nama ASC
  `) as unknown as Pengguna[];

  const editId = params.edit ? Number(params.edit) : null;
  const editData = editId ? (rows.find((u) => u.id === editId) ?? null) : null;

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Daftarkan pegawai baru, ubah data, atau atur ulang kata sandi. Login memakai NIP dan kata sandi yang ditetapkan di sini."
      />

      {params.ok && OK_MSG[params.ok] && (
        <Alert variant="success">{OK_MSG[params.ok]}</Alert>
      )}
      {params.err && ERR_MSG[params.err] && (
        <Alert variant="error">{ERR_MSG[params.err]}</Alert>
      )}

      <div className="mb-10">
        <PenggunaForm editData={editData} />
      </div>

      <h2 className="mb-4 font-display text-xl uppercase tracking-tight">
        Pengguna Terdaftar ({rows.length})
      </h2>

      <div className="overflow-x-auto border-2 border-ink">
        <table className="tbl">
          <thead>
            <tr>
              <th>NIP</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Terdaftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="font-bold">{u.nip}</td>
                <td>
                  {u.nama}
                  {u.id === session.id && (
                    <span className="ml-2 text-[10px] font-bold uppercase text-red">
                      [Anda]
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`inline-block border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                      u.role === "admin"
                        ? "border-red bg-red text-paper"
                        : "border-ink"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="whitespace-nowrap">
                  {formatTanggal(u.created_at)}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/pengguna?edit=${u.id}`}
                      className="btn px-2 py-1"
                    >
                      Ubah
                    </Link>
                    {u.id !== session.id && (
                      <form action={hapusPengguna.bind(null, u.id)}>
                        <ConfirmButton
                          message={`Hapus pengguna ${u.nama} (NIP ${u.nip})?`}
                          className="btn btn-danger px-2 py-1"
                        >
                          Hapus
                        </ConfirmButton>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
