"use client";

import { useActionState } from "react";
import Link from "next/link";
import { simpanBarang } from "@/lib/actions";
import type { ActionState, Barang } from "@/lib/definitions";
import { Icon } from "./icon";

const initialState: ActionState = {};

export function BarangForm({ editData }: { editData: Barang | null }) {
  const [state, formAction, pending] = useActionState(
    simpanBarang,
    initialState
  );

  return (
    <form
      action={formAction}
      noValidate
      key={editData?.id ?? "baru"}
      className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-(--shadow-card)"
    >
      <div className="flex items-center justify-between border-b border-border bg-bg-mid px-5 py-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
          {editData ? (
            <>
              Ubah Barang — <span className="font-mono">{editData.kode}</span>
            </>
          ) : (
            "Tambah Barang Baru"
          )}
        </p>
        {editData && (
          <Link
            href="/admin/barang"
            className="text-[11px] font-bold text-primary hover:underline"
          >
            Batal ubah
          </Link>
        )}
      </div>

      {editData && <input type="hidden" name="id" value={editData.id} />}

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
          <label htmlFor="kode" className="label">
            Kode
          </label>
          <input
            id="kode"
            name="kode"
            type="text"
            required
            maxLength={20}
            defaultValue={editData?.kode ?? ""}
            placeholder="ATK-001"
            className="input font-mono uppercase"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="nama" className="label">
            Nama Barang
          </label>
          <input
            id="nama"
            name="nama"
            type="text"
            required
            defaultValue={editData?.nama ?? ""}
            placeholder="cth. Pulpen Gel Hitam 0.5"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="kategori" className="label">
            Kategori
          </label>
          <input
            id="kategori"
            name="kategori"
            type="text"
            required
            defaultValue={editData?.kategori ?? ""}
            placeholder="cth. Alat Tulis"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="satuan" className="label">
            Satuan
          </label>
          <input
            id="satuan"
            name="satuan"
            type="text"
            required
            defaultValue={editData?.satuan ?? "pcs"}
            placeholder="pcs / rim / box"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="stok" className="label">
            Stok
          </label>
          <input
            id="stok"
            name="stok"
            type="number"
            min={0}
            required
            defaultValue={editData?.stok ?? 0}
            className="input"
          />
        </div>

        <div className="flex items-end md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="neu-btn-primary w-full disabled:cursor-wait disabled:opacity-60"
          >
            {pending
              ? "Menyimpan..."
              : editData
                ? "Simpan perubahan"
                : "Tambah barang"}
          </button>
        </div>
      </div>
    </form>
  );
}
