"use client";

import { useActionState, useState } from "react";
import { ajukanPeminjaman } from "@/lib/actions";
import type { ActionState, Barang } from "@/lib/definitions";

const initialState: ActionState = {};

export function PeminjamanForm({
  barangList,
  today,
}: {
  barangList: Pick<Barang, "id" | "kode" | "nama" | "stok" | "satuan">[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    ajukanPeminjaman,
    initialState
  );
  const [barangId, setBarangId] = useState<string>("");

  const dipilih = barangList.find((b) => String(b.id) === barangId);

  return (
    <form action={formAction} noValidate className="border-2 border-ink">
      <div className="border-b-2 border-ink bg-ink px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-paper">
          [ Formulir Permintaan Peminjaman ]
        </p>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-2">
        {state.error && (
          <div
            role="alert"
            className="border-2 border-red bg-red p-3 text-xs font-bold text-paper md:col-span-2"
          >
            !! {state.error}
          </div>
        )}

        <div className="md:col-span-2">
          <label htmlFor="barang_id" className="label">
            Barang
          </label>
          <select
            id="barang_id"
            name="barang_id"
            required
            value={barangId}
            onChange={(e) => setBarangId(e.target.value)}
            className="input"
          >
            <option value="">— pilih barang —</option>
            {barangList.map((b) => (
              <option key={b.id} value={b.id} disabled={b.stok === 0}>
                {b.kode} / {b.nama}
                {b.stok === 0 ? " — STOK HABIS" : ` — stok ${b.stok} ${b.satuan}`}
              </option>
            ))}
          </select>
          <p className="helper">
            Barang dengan stok habis tidak dapat dipilih.
          </p>
        </div>

        <div>
          <label htmlFor="jumlah" className="label">
            Jumlah{dipilih ? ` (${dipilih.satuan})` : ""}
          </label>
          <input
            id="jumlah"
            name="jumlah"
            type="number"
            min={1}
            max={dipilih?.stok ?? undefined}
            required
            defaultValue={1}
            className="input"
          />
          {dipilih && (
            <p className="helper">
              Maksimal {dipilih.stok} {dipilih.satuan} sesuai stok saat ini.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="tanggal_pinjam" className="label">
            Tanggal Pinjam
          </label>
          <input
            id="tanggal_pinjam"
            name="tanggal_pinjam"
            type="date"
            required
            defaultValue={today}
            min={today}
            className="input"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="keperluan" className="label">
            Keperluan
          </label>
          <textarea
            id="keperluan"
            name="keperluan"
            rows={3}
            required
            minLength={5}
            placeholder="cth. Kebutuhan rapat koordinasi bulanan divisi umum"
            className="input resize-y"
          />
          <p className="helper">
            Jelaskan singkat untuk apa barang digunakan (minimal 5 karakter).
          </p>
        </div>
      </div>

      <div className="border-t-2 border-ink p-5">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-solid w-full justify-center py-3 text-sm disabled:cursor-wait disabled:opacity-60 md:w-auto"
        >
          {pending ? "Mengirim..." : "Ajukan Permintaan >>>"}
        </button>
        <p className="helper mt-3">
          Permintaan berstatus MENUNGGU sampai disetujui admin. Stok baru
          berkurang setelah persetujuan.
        </p>
      </div>
    </form>
  );
}
