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
          className="mb-5 border-2 border-red bg-red p-3 text-xs font-bold text-paper"
        >
          !! {state.error}
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
          className="input"
        />
        <p className="helper">Gunakan NIP yang terdaftar di bagian umum.</p>
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
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-solid w-full justify-center py-3 text-sm disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Memverifikasi..." : "Masuk Sistem >>>"}
      </button>
    </form>
  );
}
