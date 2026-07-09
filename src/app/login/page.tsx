import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk — PINJAM/ATK",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.2fr_1fr]">
      {/* ===== Panel kiri: identitas sistem ===== */}
      <section className="relative flex flex-col justify-between border-b-2 border-ink p-6 md:border-b-0 md:border-r-2 md:p-10">
        <div className="flex items-start justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
            Sistem Internal /// Bagian Umum
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            REV 1.0
          </p>
        </div>

        <div className="py-10 md:py-0">
          <h1 className="font-display text-[clamp(3.5rem,9vw,9rem)] uppercase leading-[0.85] tracking-tight">
            Pinjam
            <br />
            <span className="text-red">/ATK</span>
            <sup className="align-super text-[0.25em]">®</sup>
          </h1>
          <div className="mt-6 h-2 w-32 bg-red" aria-hidden="true" />
          <p className="mt-6 max-w-[46ch] text-sm leading-relaxed text-ink/80">
            Sistem permintaan dan peminjaman alat tulis kantor. Ajukan
            kebutuhan, pantau persetujuan, dan lihat riwayat — semua tercatat
            berdasarkan NIP.
          </p>
        </div>

        <div className="hidden items-end justify-between md:flex">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            + AKSES TERBATAS — PEGAWAI TERDAFTAR
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/60">
            © {new Date().getFullYear()}
          </p>
        </div>
      </section>

      {/* ===== Panel kanan: formulir masuk ===== */}
      <section className="flex items-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="border-2 border-ink">
            <div className="border-b-2 border-ink bg-ink px-5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-paper">
                [ Otentikasi Pegawai ]
              </p>
            </div>
            <div className="p-5 md:p-6">
              <LoginForm />
            </div>
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-ink/60">
            Lupa kata sandi? Hubungi admin bagian umum.
          </p>
        </div>
      </section>
    </div>
  );
}
