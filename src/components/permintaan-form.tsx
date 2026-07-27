"use client";

import { useActionState, useState, useRef, useEffect } from "react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [cart, setCart] = useState<{barang_id: number; jumlah: number; nama: string; satuan: string; kode: string; maxStok: number}[]>([]);

  // Tutup dropdown jika klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBarang = barangList.filter((b) =>
    (b.nama.toLowerCase() + " " + b.kode.toLowerCase()).includes(searchQuery.toLowerCase())
  );

  const handleSelectBarang = (b: typeof barangList[0]) => {
    if (b.stok <= 0) return; // Tidak bisa pilih barang habis
    
    setCart((prev) => {
      const existing = prev.find(item => item.barang_id === b.id);
      if (existing) {
        if (existing.jumlah >= b.stok) return prev; // Maksimal stok
        return prev.map(item => 
          item.barang_id === b.id ? { ...item, jumlah: item.jumlah + 1 } : item
        );
      }
      return [...prev, {
        barang_id: b.id,
        jumlah: 1,
        nama: b.nama,
        satuan: b.satuan,
        kode: b.kode,
        maxStok: b.stok
      }];
    });
    
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const updateQuantity = (id: number, newJumlah: number) => {
    setCart(prev => prev.map(item => {
      if (item.barang_id === id) {
        const validJumlah = Math.max(1, Math.min(newJumlah, item.maxStok));
        return { ...item, jumlah: validJumlah };
      }
      return item;
    }));
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

        {/* Input Hidden untuk Keranjang yang dikirim ke server */}
        <input type="hidden" name="cart_data" value={JSON.stringify(cart)} />

        {/* Combobox Search */}
        <div className="md:col-span-2 relative" ref={dropdownRef}>
          <label htmlFor="search_barang" className="label">Cari & Tambah Barang</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              <Icon name="search" className="text-lg" />
            </div>
            <input
              id="search_barang"
              type="text"
              placeholder="Ketik nama atau kode barang, lalu pilih dari daftar drop-down..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="input w-full pl-10"
              autoComplete="off"
            />
          </div>
          
          {/* Dropdown Scrollable List */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-[var(--radius)] shadow-lg max-h-60 overflow-y-auto">
              {filteredBarang.length === 0 ? (
                <div className="p-4 text-sm text-text-muted text-center italic">Tidak ada barang yang cocok.</div>
              ) : (
                <ul className="py-1">
                  {filteredBarang.map(b => (
                    <li 
                      key={b.id}
                      onClick={() => handleSelectBarang(b)}
                      className={`px-4 py-2.5 text-sm flex justify-between items-center transition-colors ${
                        b.stok === 0 
                          ? 'opacity-50 cursor-not-allowed bg-bg-mid/50' 
                          : 'hover:bg-bg-mid cursor-pointer'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-text">{b.nama}</span>
                        <span className="text-xs text-text-muted ml-2 font-mono bg-border px-1.5 py-0.5 rounded">{b.kode}</span>
                      </div>
                      <div className="text-xs">
                        {b.stok === 0 ? (
                          <span className="text-danger font-bold uppercase tracking-wider text-[10px]">Habis</span>
                        ) : (
                          <span className="text-text-muted font-medium">Stok: {b.stok} {b.satuan}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Tabel Keranjang */}
        <div className="md:col-span-2">
          <label className="label">Daftar Barang yang Diminta</label>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 mt-1 border-2 border-dashed border-border rounded-[var(--radius)] text-text-muted text-sm bg-bg-mid/30">
              <Icon name="package" className="text-4xl mb-2 opacity-50" />
              <span>Belum ada barang yang dipilih.</span>
              <span className="text-xs mt-1 opacity-75">Silakan cari dan pilih barang dari kolom pencarian di atas.</span>
            </div>
          ) : (
            <div className="overflow-hidden border border-border rounded-[var(--radius)] mt-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-bg-mid text-text-muted text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b border-border">Nama Barang</th>
                    <th className="px-4 py-3 border-b border-border w-32 text-center">Jumlah</th>
                    <th className="px-4 py-3 border-b border-border w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.barang_id} className="border-b border-border/50 last:border-0 hover:bg-bg-mid/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">{item.nama}</div>
                        <div className="font-mono text-xs text-text-muted mt-0.5">{item.kode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                           <input 
                             type="number" 
                             min={1} 
                             max={item.maxStok}
                             value={item.jumlah}
                             onChange={(e) => updateQuantity(item.barang_id, parseInt(e.target.value) || 1)}
                             className="w-16 bg-surface border border-border-light rounded px-2 py-1.5 text-center text-sm font-semibold text-text focus:outline-none focus:border-primary transition-colors"
                           />
                           <span className="text-xs text-text-muted font-medium w-8">{item.satuan}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.barang_id)}
                          className="text-text-muted hover:text-danger transition-colors p-1.5 rounded hover:bg-danger/10"
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
            className="input font-mono mt-1"
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
            className="input resize-y mt-1"
          />
          <p className="helper mt-1.5">
            Jelaskan singkat untuk apa barang-barang ini digunakan (minimal 5 karakter).
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-bg-mid/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="helper order-2 sm:order-1 sm:max-w-xs">
          Permintaan berstatus <strong className="text-warning font-semibold">Menunggu</strong> sampai disetujui admin. Stok baru berkurang setelah disetujui.
        </p>
        <button
          type="submit"
          disabled={pending || cart.length === 0}
          className="neu-btn-primary order-1 sm:order-2 w-full sm:w-auto py-2.5 px-6 text-sm disabled:cursor-wait disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {pending ? "Mengirim..." : `Ajukan Permintaan (${cart.length} Item)`}
          {!pending && <Icon name="arrow_right" />}
        </button>
      </div>
    </form>
  );
}
