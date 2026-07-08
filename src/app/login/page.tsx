import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk — PINJAM/ATK",
};

export default function LoginPage() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="grid min-h-dvh bg-bg md:grid-cols-[1.2fr_1fr]">
      {/* ===== Panel kiri: identitas sistem ===== */}
      <section className="relative flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-start justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Sistem Internal /// Bagian Umum
          </p>
          <p className="text-xs uppercase tracking-widest text-text-muted">
            REV 2.0
          </p>
        </div>

        <div className="py-10 md:py-0">
          <h1 className="font-display text-[clamp(3.5rem,9vw,9rem)] uppercase leading-[0.85] tracking-tight text-dark">
            Pinjam
            <br />
            <span className="text-primary">/ATK</span>
            <sup className="align-super text-[0.25em]">®</sup>
          </h1>
          <div className="mt-6 h-2 w-32 rounded-full bg-gradient-to-r from-primary to-primary-dark" />
          <p className="mt-6 max-w-[46ch] text-sm leading-relaxed text-dark-light">
            Sistem permintaan dan peminjaman alat tulis kantor. Ajukan
            kebutuhan, pantau persetujuan, dan lihat riwayat — semua tercatat
            berdasarkan NIP.
          </p>
        </div>

        <div className="hidden items-end justify-between md:flex">
          <p className="text-xs uppercase tracking-widest text-text-muted">
            + AKSES TERBATAS — PEGAWAI TERDAFTAR
          </p>
          <p className="text-xs uppercase tracking-widest text-text-muted">
            © {currentYear}
          </p>
        </div>
      </section>

      {/* ===== Panel kanan: formulir masuk ===== */}
      <section className="flex items-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="neu-card">
            <div className="mb-6 neu-inset px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                [ Otentikasi Pegawai ]
              </p>
            </div>
            <div className="px-6 pb-6">
              <LoginForm />
            </div>
          </div>
          <p className="mt-4 text-center text-xs uppercase tracking-widest text-text-muted">
            Lupa kata sandi? Hubungi admin bagian umum.
          </p>
        </div>
      </section>
    </div>
  );
}
