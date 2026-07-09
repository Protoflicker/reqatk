"use client";

import { useActionState } from "react";
import Link from "next/link";
import { simpanPengguna } from "@/lib/actions";
import type { ActionState, Pengguna } from "@/lib/definitions";
import { Icon } from "./icon";

const initialState: ActionState = {};

/** Form ubah data pengguna yang sudah terdaftar (nama, role, sandi opsional). */
export function PenggunaForm({ editData }: { editData: Pengguna }) {
  const [state, formAction, pending] = useActionState(
    simpanPengguna,
    initialState
  );

  return (
    <form
      action={formAction}
      noValidate
      key={editData.id}
      className="animate-fade-up overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-(--shadow-card)"
    >
      <div className="flex items-center justify-between border-b border-border bg-bg-mid px-5 py-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
          Ubah Pengguna — <span className="font-mono">{editData.nip}</span>
        </p>
        <Link
          href="/admin/pengguna"
          className="text-[11px] font-bold text-primary hover:underline"
        >
          Batal ubah
        </Link>
      </div>

      <input type="hidden" name="id" value={editData.id} />

      <div className="grid gap-5 p-5 md:grid-cols-4">
        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] p-3 text-sm font-medium text-danger md:col-span-4"
          >
            <Icon name="alert" className="mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <div>
          <label htmlFor="nip" className="label">
            NIP
          </label>
          <input
            id="nip"
            name="nip"
            type="text"
            inputMode="numeric"
            required
            defaultValue={editData.nip}
            placeholder="angka 5–30 digit"
            className="input font-mono"
          />
        </div>

        <div>
          <label htmlFor="nama" className="label">
            Nama Lengkap
          </label>
          <input
            id="nama"
            name="nama"
            type="text"
            required
            defaultValue={editData.nama}
            placeholder="cth. Budi Santoso"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Kata Sandi Baru
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="kosongkan bila tetap"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="role" className="label">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue={editData.role}
            className="input"
          >
            <option value="user">User — pegawai</option>
            <option value="admin">Admin — pengelola</option>
          </select>
        </div>

        <div className="md:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="neu-btn-primary w-full disabled:cursor-wait disabled:opacity-60 md:w-auto"
          >
            {pending ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>
      </div>
    </form>
  );
}
