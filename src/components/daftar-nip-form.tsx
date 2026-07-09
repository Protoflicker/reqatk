"use client";

import { useActionState } from "react";
import { daftarkanNip } from "@/lib/actions";
import type { ActionState } from "@/lib/definitions";
import { Icon } from "./icon";

const initialState: ActionState = {};

/**
 * Pendaftaran pengguna baru oleh admin: cukup NIP.
 * Akun tercipta nonaktif; pemilik NIP melengkapi nama + sandi saat login.
 */
export function DaftarNipForm() {
  const [state, formAction, pending] = useActionState(daftarkanNip, initialState);

  return (
    <form action={formAction} noValidate className="neu-card hover:transform-none">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-light text-lg text-primary">
          <Icon name="idcard" />
        </span>
        <div>
          <h2 className="text-sm font-extrabold tracking-tight text-text">
            Daftarkan NIP Pegawai
          </h2>
          <p className="text-xs text-text-muted">
            Akun dibuat nonaktif — pemilik NIP melengkapi nama dan kata sandi
            saat login pertama.
          </p>
        </div>
      </div>

      {state.error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] p-3 text-sm font-medium text-danger"
        >
          <Icon name="alert" className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="nip-baru" className="label">
            NIP — Nomor Induk Pegawai
          </label>
          <input
            id="nip-baru"
            name="nip"
            type="text"
            inputMode="numeric"
            required
            placeholder="angka 5–30 digit"
            className="input font-mono tracking-wide"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="neu-btn-primary disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Mendaftarkan..." : "Daftarkan NIP"}
        </button>
      </div>
    </form>
  );
}
