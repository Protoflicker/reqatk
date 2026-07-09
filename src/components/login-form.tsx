"use client";

import { useActionState, useState } from "react";
import { aktivasiAkun, cekNip, login } from "@/lib/actions";
import type { ActionState, CekNipState } from "@/lib/definitions";
import { Icon } from "./icon";

const initialCek: CekNipState = {};
const initialAksi: ActionState = {};

/**
 * Login dua langkah: NIP diperiksa dulu, lalu kartu berubah menjadi
 * form kata sandi (akun aktif) atau form aktivasi (akun baru dari admin).
 */
export function LoginForm() {
  const [attempt, setAttempt] = useState(0);
  return <LoginSteps key={attempt} onReset={() => setAttempt((a) => a + 1)} />;
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="animate-fade-up mb-5 flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] p-3 text-sm font-medium text-danger"
    >
      <Icon name="alert" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function StepEyebrow({ step, label }: { step: 1 | 2; label: string }) {
  return (
    <div className="mb-6 flex items-center gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light font-mono text-[11px] font-bold text-primary">
        {step}
      </span>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}

function LoginSteps({ onReset }: { onReset: () => void }) {
  const [cek, cekAction, cekPending] = useActionState(cekNip, initialCek);
  const [masuk, masukAction, masukPending] = useActionState(login, initialAksi);
  const [aktivasi, aktivasiAction, aktivasiPending] = useActionState(
    aktivasiAkun,
    initialAksi
  );

  /* ===== Langkah 1: NIP ===== */
  if (!cek.mode) {
    return (
      <form action={cekAction} noValidate className="animate-fade-up">
        <StepEyebrow step={1} label="Identifikasi NIP" />
        {cek.error && <FormError>{cek.error}</FormError>}

        <div className="mb-6">
          <label htmlFor="nip" className="label">
            NIP — Nomor Induk Pegawai
          </label>
          <input
            id="nip"
            name="nip"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            autoFocus
            required
            defaultValue={cek.nip ?? ""}
            placeholder="cth. 199001012015011001"
            className="input font-mono tracking-wide"
          />
          <p className="helper">
            Sistem mengecek status NIP Anda: langsung masuk, atau aktivasi
            akun bila baru didaftarkan.
          </p>
        </div>

        <button
          type="submit"
          disabled={cekPending}
          className="neu-btn-primary w-full py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
        >
          {cekPending ? "Memeriksa..." : "Lanjutkan"}
          {!cekPending && <Icon name="arrow_right" />}
        </button>
      </form>
    );
  }

  /* Chip identitas NIP yang sudah dicek + tombol kembali */
  const identitas = (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-bg px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon name="idcard" className="shrink-0 text-lg text-primary" />
        <div className="min-w-0">
          {cek.mode === "login" && cek.nama && (
            <p className="truncate text-sm font-bold text-text">{cek.nama}</p>
          )}
          <p className="truncate font-mono text-xs text-text-muted">
            {cek.nip}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="shrink-0 text-xs font-semibold text-primary hover:underline"
      >
        Ganti NIP
      </button>
    </div>
  );

  /* ===== Langkah 2a: akun aktif → kata sandi ===== */
  if (cek.mode === "login") {
    return (
      <form action={masukAction} noValidate className="animate-fade-up">
        <StepEyebrow step={2} label="Kata Sandi" />
        {identitas}
        {masuk.error && <FormError>{masuk.error}</FormError>}

        <input type="hidden" name="nip" value={cek.nip} />

        <div className="mb-6">
          <label htmlFor="password" className="label">
            Kata Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            placeholder="••••••••"
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={masukPending}
          className="neu-btn-primary w-full py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
        >
          {masukPending ? "Memverifikasi..." : "Masuk"}
        </button>
      </form>
    );
  }

  /* ===== Langkah 2b: akun belum aktif → aktivasi ===== */
  return (
    <form action={aktivasiAction} noValidate className="animate-fade-up">
      <StepEyebrow step={2} label="Aktivasi Akun" />
      {identitas}

      <div className="mb-5 rounded-[var(--radius)] bg-primary-light px-4 py-3">
        <p className="text-xs font-semibold leading-relaxed text-primary">
          NIP Anda sudah didaftarkan admin tetapi akun belum aktif. Lengkapi
          nama dan kata sandi untuk mulai menggunakan sistem.
        </p>
      </div>

      {aktivasi.error && <FormError>{aktivasi.error}</FormError>}

      <input type="hidden" name="nip" value={cek.nip} />

      <div className="mb-5">
        <label htmlFor="nama" className="label">
          Nama Lengkap
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          autoComplete="name"
          autoFocus
          required
          defaultValue={cek.nama ?? ""}
          placeholder="cth. Budi Santoso"
          className="input"
        />
      </div>

      <div className="mb-5">
        <label htmlFor="password" className="label">
          Kata Sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="min. 6 karakter"
          className="input"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="konfirmasi" className="label">
          Konfirmasi Kata Sandi
        </label>
        <input
          id="konfirmasi"
          name="konfirmasi"
          type="password"
          autoComplete="new-password"
          required
          placeholder="ulangi kata sandi"
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={aktivasiPending}
        className="neu-btn-primary w-full py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
      >
        {aktivasiPending ? "Mengaktifkan..." : "Aktifkan akun & masuk"}
      </button>
    </form>
  );
}
