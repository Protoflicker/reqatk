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
        <div className="neu-card">
          <h2 className="mb-4 font-display text-lg font-bold text-dark">
            Informasi Akun
          </h2>
          <ProfileForm
            userId={session.id}
            currentNip={session.nip}
            currentNama={session.nama}
          />
        </div>

        {/* Password Change */}
        <div className="neu-card">
          <h2 className="mb-4 font-display text-lg font-bold text-dark">
            Ubah Kata Sandi
          </h2>
          <PasswordChangeForm userId={session.id} />
        </div>
      </div>

      {/* Account Info (Read-only) */}
      <div className="neu-card mt-6">
        <h2 className="mb-4 font-display text-lg font-bold text-dark">
          Detail Akun
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              NIP
            </label>
            <p className="mt-1 font-mono text-dark">{session.nip}</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              Nama Lengkap
            </label>
            <p className="mt-1 text-dark">{session.nama}</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              Role
            </label>
            <p className="mt-1 text-dark capitalize">{session.role}</p>
          </div>
        </div>
      </div>
    </>
  );
}
