"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions";
import type { ActionState } from "@/lib/definitions";
import { Icon } from "./icon";

interface ProfileFormProps {
  userId: number;
  currentNip: string;
  currentNama: string;
}

const initialState: ActionState = {};

export function ProfileForm({ userId, currentNip, currentNama }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="user_id" value={userId} />

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] p-3 text-sm font-medium text-danger"
        >
          <Icon name="alert" className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(26,174,57,0.3)] bg-[rgba(26,174,57,0.12)] p-3 text-sm font-medium text-success"
        >
          <Icon name="check" className="mt-0.5 shrink-0" />
          <span>{state.success}</span>
        </div>
      )}

      <div>
        <label htmlFor="nama" className="label">
          Nama Lengkap
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          defaultValue={currentNama}
          required
          className="input text-sm"
        />
        <p className="helper">Nama akan ditampilkan di sistem</p>
      </div>

      <div>
        <label htmlFor="nip" className="label">
          NIP (Nomor Induk Pegawai)
        </label>
        <input
          id="nip"
          name="nip"
          type="text"
          defaultValue={currentNip}
          disabled
          className="input cursor-not-allowed font-mono text-sm opacity-60"
        />
        <p className="helper">
          NIP tidak dapat diubah. Hubungi admin jika ada kesalahan.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="neu-btn-primary w-full py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
