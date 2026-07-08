import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk — PINJAM/ATK",
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="grid min-h-dvh bg-bg md:grid-cols-[1.2fr_1fr]">
      {/* ===== Panel kiri: identitas sistem ===== */}
      <section className="relative flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-start justify-between">
          <p className="font-mono text-xs font-medium tracking-wide text-text-muted">
            Sistem Internal · Bagian Umum
          </p>
          <span className="rounded-full bg-primary-light px-2.5 py-1 font-mono text-[10px] font-bold text-primary">
            v2.0
          </span>
        </div>

        <div className="py-10 md:py-0">
          <h1 className="font-display text-[clamp(3.5rem,9vw,9rem)] font-extrabold leading-[0.85] tracking-tight text-text" style={{
            letterSpacing: '-0.03em'
          }}>
            Pinjam
            <br />
            <span className="text-primary">/ATK</span>
          </h1>
          <div className="mt-6 h-1.5 w-32 rounded-full bg-gradient-to-r from-primary to-primary-dark" />
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-text-muted">
            Sistem permintaan dan peminjaman alat tulis kantor. Ajukan
            kebutuhan, pantau persetujuan, dan lihat riwayat — semua tercatat
            berdasarkan NIP.
          </p>
        </div>

        <div className="hidden items-end justify-between md:flex">
          <p className="font-mono text-xs text-text-muted">
            Akses terbatas — Pegawai terdaftar
          </p>
          <p className="font-mono text-xs text-text-muted">
            © {currentYear} PINJAM/ATK
          </p>
        </div>
      </section>

      {/* ===== Panel kanan: formulir masuk ===== */}
      <section className="flex items-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-surface p-8 shadow-lg">
            <div className="mb-6 rounded-lg bg-primary-light px-4 py-3">
              <p className="text-xs font-bold tracking-wide text-primary">
                Otentikasi Pegawai
              </p>
            </div>
            <LoginForm />
          </div>
          <p className="mt-4 text-center font-mono text-xs text-text-muted">
            Lupa kata sandi? Hubungi admin bagian umum
          </p>
        </div>
      </section>
    </div>
  );
}
