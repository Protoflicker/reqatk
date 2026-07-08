"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions";
import type { ActionState } from "@/lib/definitions";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} noValidate>
      {state.error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-danger bg-[rgba(224,62,62,0.12)] p-3 text-sm font-semibold text-danger"
        >
          ⚠ {state.error}
        </div>
      )}

      <div className="mb-5">
        <label htmlFor="nip" className="label">
          NIP — Nomor Induk Pegawai
        </label>
        <input
          id="nip"
          name="nip"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          required
          placeholder="cth. 199001012015011001"
          className="neu-input w-full"
        />
        <p className="mt-1.5 text-xs text-text-muted">Gunakan NIP yang terdaftar di bagian umum</p>
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="label">
          Kata Sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="neu-input w-full"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="neu-btn-primary w-full justify-center py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Memverifikasi..." : "Masuk Sistem →"}
      </button>
    </form>
  );
}
