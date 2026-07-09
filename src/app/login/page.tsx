import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Masuk — PINJAM/ATK",
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="grid min-h-dvh md:grid-cols-[1.2fr_1fr]"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 15% 0%, var(--color-primary-glow), transparent 60%)," +
          "radial-gradient(ellipse 50% 40% at 100% 100%, rgba(0,117,222,0.06), transparent 65%)," +
          "var(--color-bg)",
      }}
    >
      {/* ===== Panel kiri: identitas sistem ===== */}
      <section className="relative flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-start justify-between">
          <p className="font-mono text-xs font-medium tracking-wide text-text-muted">
            Sistem Internal · Bagian Umum
          </p>
          <ThemeToggle />
        </div>

        <div className="py-10 md:py-0">
          <h1
            className="font-display text-[clamp(3.5rem,9vw,9rem)] font-extrabold leading-[0.85] text-text"
            style={{ letterSpacing: "-0.03em" }}
          >
            Pinjam
            <br />
            <span className="text-primary">/ATK</span>
          </h1>
          <p className="mt-8 max-w-[46ch] text-base leading-relaxed text-text-muted">
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
          <div className="animate-bounce-in rounded-[var(--radius-xl)] border border-border bg-surface p-8 shadow-(--shadow-hover) md:p-10">
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-xs text-text-muted">
            Lupa kata sandi? Hubungi admin bagian umum untuk reset aktivasi.
          </p>
        </div>
      </section>
    </div>
  );
}
