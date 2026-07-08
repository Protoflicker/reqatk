"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions";
import type { ActionState } from "@/lib/definitions";

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
        <div className="neu-inset border-2 border-red-500 p-3 text-xs font-bold text-red-600">
          ⚠ {state.error}
        </div>
      )}

      {state.success && (
        <div className="neu-inset border-2 border-green-500 p-3 text-xs font-bold text-green-600">
          ✓ {state.success}
        </div>
      )}

      <div>
        <label htmlFor="nama" className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
          Nama Lengkap
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          defaultValue={currentNama}
          required
          className="neu-input w-full text-sm text-dark"
        />
        <p className="mt-1 text-xs text-text-muted">
          Nama akan ditampilkan di sistem
        </p>
      </div>

      <div>
        <label htmlFor="nip" className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
          NIP (Nomor Induk Pegawai)
        </label>
        <input
          id="nip"
          name="nip"
          type="text"
          defaultValue={currentNip}
          disabled
          className="neu-input w-full text-sm text-dark opacity-60 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-text-muted">
          NIP tidak dapat diubah. Hubungi admin jika ada kesalahan.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="neu-btn-primary w-full py-2 text-sm font-bold disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
