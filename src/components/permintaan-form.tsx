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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [barangId, setBarangId] = useState<string>("");
  const [jumlahStr, setJumlahStr] = useState<string>("1");
  const [cart, setCart] = useState<{barang_id: number; jumlah: number; nama: string; satuan: string; kode: string; maxStok: number}[]>([]);

  const filteredBarang = barangList.filter((b) =>
    (b.nama.toLowerCase() + " " + b.kode.toLowerCase()).includes(searchQuery.toLowerCase())
  );

  const dipilih = barangList.find((b) => String(b.id) === barangId);
  const jumlah = parseInt(jumlahStr) || 0;

  const handleAddToCart = () => {
    if (!dipilih || jumlah <= 0) return;
    
    // Check if already in cart
    const existingIndex = cart.findIndex((c) => c.barang_id === dipilih.id);
    let newCart = [...cart];
    
    if (existingIndex >= 0) {
      const newJumlah = newCart[existingIndex].jumlah + jumlah;
      if (newJumlah > dipilih.stok) {
        alert(`Total permintaan untuk ${dipilih.nama} melebihi stok (${dipilih.stok}).`);
        return;
      }
      newCart[existingIndex].jumlah = newJumlah;
    } else {
      if (jumlah > dipilih.stok) {
        alert(`Jumlah melebihi stok (${dipilih.stok}).`);
        return;
      }
      newCart.push({
        barang_id: dipilih.id,
        jumlah,
        nama: dipilih.nama,
        satuan: dipilih.satuan,
        kode: dipilih.kode,
        maxStok: dipilih.stok,
      });
    }
    
    setCart(newCart);
    setBarangId("");
    setJumlahStr("1");
    setSearchQuery("");
  };

  const removeFromCart = (idToRemove: number) => {
    setCart(cart.filter(c => c.barang_id !== idToRemove));
  };

  return (
    <form
      action={formAction}
      noValidate
      className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-(--shadow-card)"
    >
      <div className="border-b border-border bg-bg-mid px-5 py-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-text-muted">
          Formulir Permintaan Alat Tulis Kantor
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

        {/* Input Hidden untuk Keranjang */}
        <input type="hidden" name="cart_data" value={JSON.stringify(cart)} />

        <div className="md:col-span-2 border border-border-light p-4 rounded-xl bg-bg-mid/30">
          <h4 className="text-sm font-bold text-text mb-4">Tambahkan Barang ke Daftar</h4>
          <div className="grid gap-4 md:grid-cols-12 items-end">
            <div className="md:col-span-7">
              <label htmlFor="search_barang" className="label">Cari & Pilih Barang</label>
              <input
                id="search_barang"
                type="text"
                placeholder="Ketik nama atau kode barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input mb-2"
              />
              <select
                value={barangId}
                onChange={(e) => setBarangId(e.target.value)}
                className="input"
              >
                <option value="">— pilih dari hasil pencarian ({filteredBarang.length}) —</option>
                {filteredBarang.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.stok === 0}>
                    {b.kode} / {b.nama}
                    {b.stok === 0 ? " (HABIS)" : ` (stok: ${b.stok} ${b.satuan})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-3">
              <label htmlFor="jumlah_temp" className="label">
                Jumlah {dipilih ? `(${dipilih.satuan})` : ""}
              </label>
              <input
                id="jumlah_temp"
                type="number"
                min={1}
                max={dipilih?.stok ?? undefined}
                value={jumlahStr}
                onChange={(e) => setJumlahStr(e.target.value)}
                className="input"
                disabled={!dipilih}
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!dipilih || jumlah <= 0 || jumlah > (dipilih?.stok || 0)}
                className="neu-btn-solid w-full py-2.5 text-xs disabled:opacity-50"
              >
                <Icon name="plus" /> Tambah
              </button>
            </div>
          </div>
        </div>

        {/* Tabel Keranjang */}
        <div className="md:col-span-2">
          <label className="label">Daftar Barang yang Diminta</label>
          {cart.length === 0 ? (
            <div className="text-center p-6 border-2 border-dashed border-border rounded-xl text-text-muted text-sm">
              Keranjang masih kosong. Tambahkan barang dari form di atas.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-bg-mid text-text-muted text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-2 border-b border-border">Kode</th>
                    <th className="px-4 py-2 border-b border-border">Nama Barang</th>
                    <th className="px-4 py-2 border-b border-border w-24">Jumlah</th>
                    <th className="px-4 py-2 border-b border-border w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.barang_id} className="border-b border-border-light last:border-0 hover:bg-bg-mid/50 transition-colors">
                      <td className="px-4 py-2 font-mono text-xs">{item.kode}</td>
                      <td className="px-4 py-2 font-medium">{item.nama}</td>
                      <td className="px-4 py-2">
                        {item.jumlah} {item.satuan}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.barang_id)}
                          className="text-danger hover:text-red-700 transition-colors p-1"
                          title="Hapus"
                        >
                          <Icon name="trash" className="text-base" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="md:col-span-2 h-px bg-border my-2"></div>

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
            Keperluan (Untuk Semua Barang)
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
            Jelaskan singkat untuk apa barang-barang ini digunakan (minimal 5 karakter).
          </p>
        </div>
      </div>

      <div className="border-t border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="submit"
          disabled={pending || cart.length === 0}
          className="neu-btn-primary w-full py-3 text-sm disabled:cursor-wait disabled:opacity-60 md:w-auto"
        >
          {pending ? "Mengirim..." : `Ajukan Permintaan (${cart.length} Item)`}
          {!pending && <Icon name="arrow_right" />}
        </button>
        <p className="helper mt-3 sm:mt-0">
          Permintaan berstatus Menunggu sampai disetujui admin. Stok baru berkurang setelah disetujui.
        </p>
      </div>
    </form>
  );
}
