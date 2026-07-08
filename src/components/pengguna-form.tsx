"use client";

import { useActionState } from "react";
import Link from "next/link";
import { simpanPengguna } from "@/lib/actions";
import type { ActionState, Pengguna } from "@/lib/definitions";

const initialState: ActionState = {};

export function PenggunaForm({ editData }: { editData: Pengguna | null }) {
  const [state, formAction, pending] = useActionState(
    simpanPengguna,
    initialState
  );

  return (
    <form
      action={formAction}
      noValidate
      key={editData?.id ?? "baru"}
      className="border-2 border-ink"
    >
      <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-paper">
          [ {editData ? `Ubah Pengguna — NIP ${editData.nip}` : "Daftarkan Pengguna Baru"} ]
        </p>
        {editData && (
          <Link
            href="/admin/pengguna"
            className="text-[11px] font-bold uppercase tracking-[0.1em] text-red underline underline-offset-2"
          >
            Batal Ubah
          </Link>
        )}
      </div>

      {editData && <input type="hidden" name="id" value={editData.id} />}

      <div className="grid gap-5 p-5 md:grid-cols-4">
        {state.error && (
          <div
            role="alert"
            className="border-2 border-red bg-red p-3 text-xs font-bold text-paper md:col-span-4"
          >
            !! {state.error}
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
            defaultValue={editData?.nip ?? ""}
            placeholder="angka 5-30 digit"
            className="input"
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
            defaultValue={editData?.nama ?? ""}
            placeholder="cth. Budi Santoso"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Kata Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required={!editData}
            placeholder={editData ? "kosongkan bila tetap" : "min. 6 karakter"}
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
            defaultValue={editData?.role ?? "user"}
            className="input"
          >
            <option value="user">USER — pegawai</option>
            <option value="admin">ADMIN — pengelola</option>
          </select>
        </div>

        <div className="md:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-solid w-full justify-center disabled:cursor-wait disabled:opacity-60 md:w-auto"
          >
            {pending
              ? "Menyimpan..."
              : editData
                ? "Simpan Perubahan >>>"
                : "Daftarkan Pengguna >>>"}
          </button>
        </div>
      </div>
    </form>
  );
}
