import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hapusPengguna, resetAktivasi, ubahRole } from "@/lib/actions";
import { PageHeader } from "@/components/page-header";
import { DaftarNipForm } from "@/components/daftar-nip-form";
import { ConfirmButton } from "@/components/confirm-button";
import { Alert } from "@/components/alert";
import { Icon } from "@/components/icon";
import { formatTanggal, type Pengguna } from "@/lib/definitions";

const OK_MSG: Record<string, string> = {
  nip: "NIP berhasil didaftarkan. Pemilik NIP tinggal melakukan aktivasi saat login pertama.",
  "nip-pulih":
    "NIP dipulihkan beserta riwayat permintaannya. Pemilik NIP tinggal melakukan aktivasi ulang saat login.",
  role: "Role pengguna berhasil diperbarui.",
  reset:
    "Akun dinonaktifkan. Pemilik NIP harus mendaftarkan ulang nama dan kata sandi saat login berikutnya.",
  hapus: "Pengguna dihapus. Riwayat permintaannya tetap tersimpan di Laporan.",
};

const ERR_MSG: Record<string, string> = {
  sendiri: "Anda tidak dapat menghapus akun yang sedang dipakai.",
  "reset-sendiri": "Anda tidak dapat menonaktifkan akun yang sedang dipakai.",
  "reset-admin":
    "Akun admin tidak bisa dinonaktifkan (mencegah akun diambil alih). Jadikan User dulu bila ingin mencabut akses admin.",
  "role-sendiri":
    "Anda tidak dapat mengubah role akun yang sedang dipakai. Minta admin lain melakukannya.",
  "role-nonaktif":
    "Akun yang belum aktivasi tidak bisa dijadikan admin — akun tanpa kata sandi masih bisa diklaim siapa pun yang tahu NIP-nya. Tunggu pemiliknya aktivasi lebih dulu.",
  "hapus-admin":
    "Akun admin tidak bisa dihapus. Jadikan User dulu lewat tombol di baris ini.",
  gagal: "Operasi gagal. Coba lagi.",
};

export default async function AdminPenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const sql = db();

  const rows = (await sql`
    SELECT id, nip, nama, role, created_at,
           password_hash IS NOT NULL AS aktif
    FROM pengguna
    WHERE dihapus_pada IS NULL
    ORDER BY role ASC, aktif ASC, nama ASC, nip ASC
  `) as unknown as Pengguna[];

  const belumAktif = rows.filter((u) => !u.aktif).length;

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Daftarkan NIP pegawai baru — pemilik NIP melengkapi nama dan kata sandi sendiri saat login pertama. Gunakan Reset untuk menonaktifkan akun, atau ubah role untuk memberi/mencabut akses admin."
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
                    {u.id !== session.id && (
                      <form
                        action={ubahRole.bind(null, u.id)}
                        className="contents"
                      >
                        <input
                          type="hidden"
                          name="role"
                          value={u.role === "admin" ? "user" : "admin"}
                        />
                        <ConfirmButton
                          message={
                            u.role === "admin"
                              ? `Jadikan ${u.nama || u.nip} sebagai User biasa? Akses admin-nya dicabut dan sesinya langsung berakhir.`
                              : `Jadikan ${u.nama || u.nip} sebagai Admin? Ia akan bisa mengelola barang, permintaan, dan pengguna.`
                          }
                          className="btn px-2.5 py-1 text-xs"
                        >
                          <Icon name={u.role === "admin" ? "user" : "shield"} />
                          {u.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                        </ConfirmButton>
                      </form>
                    )}
                    {u.aktif && u.role !== "admin" && u.id !== session.id && (
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
        kali. Pengguna yang dihapus tidak lagi muncul di sini, tetapi riwayat
        permintaannya tetap tersimpan di Laporan.
      </p>
    </>
  );
}
