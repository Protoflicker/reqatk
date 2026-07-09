import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { PasswordChangeForm } from "@/components/password-change-form";

export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <>
      <PageHeader
        title="Profil Saya"
        description="Kelola informasi akun dan keamanan Anda."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <div className="neu-card hover:transform-none">
          <h2 className="mb-4 font-display text-lg font-extrabold tracking-tight text-text">
            Informasi Akun
          </h2>
          <ProfileForm
            userId={session.id}
            currentNip={session.nip}
            currentNama={session.nama}
          />
        </div>

        {/* Password Change */}
        <div className="neu-card hover:transform-none">
          <h2 className="mb-4 font-display text-lg font-extrabold tracking-tight text-text">
            Ubah Kata Sandi
          </h2>
          <PasswordChangeForm userId={session.id} />
        </div>
      </div>

      {/* Account Info (Read-only) */}
      <div className="neu-card mt-6 hover:transform-none">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-tight text-text">
          Detail Akun
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">
              NIP
            </label>
            <p className="mt-1 font-mono text-text">{session.nip}</p>
          </div>
          <div>
            <label className="label">
              Nama Lengkap
            </label>
            <p className="mt-1 text-text">{session.nama}</p>
          </div>
          <div>
            <label className="label">
              Role
            </label>
            <p className="mt-1 capitalize text-text">{session.role}</p>
          </div>
        </div>
      </div>
    </>
  );
}
