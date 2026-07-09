import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hapusPengguna, resetAktivasi } from "@/lib/actions";
import { PageHeader } from "@/components/page-header";
import { PenggunaForm } from "@/components/pengguna-form";
import { DaftarNipForm } from "@/components/daftar-nip-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Alert } from "@/components/alert";
import { Icon } from "@/components/icon";
import { formatTanggal, type Pengguna } from "@/lib/definitions";

const OK_MSG: Record<string, string> = {
  nip: "NIP berhasil didaftarkan. Pemilik NIP tinggal melakukan aktivasi saat login pertama.",
  ubah: "Data pengguna berhasil diperbarui.",
  reset:
    "Akun dinonaktifkan. Pemilik NIP harus mendaftarkan ulang nama dan kata sandi saat login berikutnya.",
};

const ERR_MSG: Record<string, string> = {
  sendiri: "Anda tidak dapat menghapus akun yang sedang dipakai.",
  "reset-sendiri": "Anda tidak dapat menonaktifkan akun yang sedang dipakai.",
  terpakai:
    "Pengguna tidak bisa dihapus karena punya riwayat peminjaman. Gunakan Reset untuk mencabut aksesnya.",
  gagal: "Operasi gagal. Coba lagi.",
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
    SELECT id, nip, nama, role, created_at,
           password_hash IS NOT NULL AS aktif
    FROM pengguna
    ORDER BY role ASC, aktif ASC, nama ASC, nip ASC
  `) as unknown as Pengguna[];

  const editId = params.edit ? Number(params.edit) : null;
  const editData = editId ? (rows.find((u) => u.id === editId) ?? null) : null;

  const belumAktif = rows.filter((u) => !u.aktif).length;

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Daftarkan NIP pegawai baru — pemilik NIP melengkapi nama dan kata sandi sendiri saat login pertama. Gunakan Reset untuk menonaktifkan akun agar aktivasi diulang."
      />

      {params.ok && OK_MSG[params.ok] && (
        <Alert variant="success">{OK_MSG[params.ok]}</Alert>
      )}
      {params.err && ERR_MSG[params.err] && (
        <Alert variant="error">{ERR_MSG[params.err]}</Alert>
      )}

      <div className="mb-8">
        <DaftarNipForm />
      </div>

      {editData && (
        <div className="mb-8">
          <PenggunaForm editData={editData} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-text">
          Pengguna Terdaftar{" "}
          <span className="text-text-muted">({rows.length})</span>
        </h2>
        {belumAktif > 0 && (
          <span className="badge badge-warning">
            <Icon name="clock" />
            {belumAktif} menunggu aktivasi
          </span>
        )}
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>NIP</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Status</th>
              <th>Terdaftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="whitespace-nowrap font-mono text-[13px] font-semibold">
                  {u.nip}
                </td>
                <td>
                  {u.nama ? (
                    <span className="font-semibold">{u.nama}</span>
                  ) : (
                    <span className="text-text-muted">— belum diisi —</span>
                  )}
                  {u.id === session.id && (
                    <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                      Anda
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${
                      u.role === "admin" ? "badge-primary" : "badge-muted"
                    }`}
                  >
                    <Icon name={u.role === "admin" ? "shield" : "user"} />
                    {u.role === "admin" ? "Admin" : "User"}
                  </span>
                </td>
                <td>
                  {u.aktif ? (
                    <span className="badge badge-success whitespace-nowrap">
                      <Icon name="check" />
                      Aktif
                    </span>
                  ) : (
                    <span className="badge badge-warning whitespace-nowrap">
                      <Icon name="clock" />
                      Belum aktivasi
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap text-text-muted">
                  {formatTanggal(u.created_at)}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/pengguna?edit=${u.id}`}
                      className="btn px-2.5 py-1 text-xs"
                    >
                      <Icon name="pencil" />
                      Ubah
                    </Link>
                    {u.aktif && u.id !== session.id && (
                      <form action={resetAktivasi.bind(null, u.id)}>
                        <ConfirmButton
                          message={`Nonaktifkan akun ${u.nama || u.nip}? Kata sandinya dihapus dan pemilik NIP harus mendaftar ulang saat login.`}
                          className="btn px-2.5 py-1 text-xs text-warning"
                        >
                          <Icon name="refresh" />
                          Reset
                        </ConfirmButton>
                      </form>
                    )}
                    {u.id !== session.id && (
                      <form action={hapusPengguna.bind(null, u.id)}>
                        <ConfirmButton
                          message={`Hapus pengguna ${u.nama || "tanpa nama"} (NIP ${u.nip})?`}
                          className="btn-danger px-2.5 py-1 text-xs"
                        >
                          <Icon name="trash" />
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

      <p className="helper mt-3">
        Akun berstatus <strong>Belum aktivasi</strong> hanya berisi NIP.
        Pemiliknya diminta mengisi nama dan kata sandi ketika login pertama
        kali.
      </p>
    </>
  );
}
