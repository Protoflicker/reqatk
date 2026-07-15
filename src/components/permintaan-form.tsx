"use client";

import { useActionState, useState } from "react";
import { ajukanPermintaan } from "@/lib/actions";
import type { ActionState, Barang } from "@/lib/definitions";
import { Icon } from "./icon";

const initialState: ActionState = {};

export function PermintaanForm({
  barangList,
  today,
}: {
  barangList: Pick<Barang, "id" | "kode" | "nama" | "stok" | "satuan">[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    ajukanPermintaan,
    initialState
  );
  const [barangId, setBarangId] = useState<string>("");

  const dipilih = barangList.find((b) => String(b.id) === barangId);

  return (
    <form
      action={formAction}
      noValidate
      className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-(--shadow-card)"
    >
      <div className="border-b border-border bg-bg-mid px-5 py-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
          Formulir Permintaan Permintaan
        </p>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-2">
        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] p-3 text-sm font-medium text-danger md:col-span-2"
          >
            <Icon name="alert" className="mt-0.5 shrink-0" />
            <span>{state.error}</span>
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
          <p className="helper">Barang dengan stok habis tidak dapat dipilih.</p>
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
            className="input font-mono"
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

      <div className="border-t border-border p-5">
        <button
          type="submit"
          disabled={pending}
          className="neu-btn-primary w-full py-3 text-sm disabled:cursor-wait disabled:opacity-60 md:w-auto"
        >
          {pending ? "Mengirim..." : "Ajukan permintaan"}
          {!pending && <Icon name="arrow_right" />}
        </button>
        <p className="helper mt-3">
          Permintaan berstatus Menunggu sampai disetujui admin. Stok baru
          berkurang setelah persetujuan.
        </p>
      </div>
    </form>
  );
}
