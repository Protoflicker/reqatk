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
      className="space-y-6 md:space-y-8"
    >
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border-2 border-[rgba(224,62,62,0.3)] bg-[rgba(224,62,62,0.1)] p-4 text-base font-bold text-danger"
        >
          <Icon name="alert" className="mt-0.5 shrink-0 text-xl" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Input Hidden untuk Keranjang */}
      <input type="hidden" name="cart_data" value={JSON.stringify(cart)} />

      {/* Langkah 1 */}
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-sm">
        <div className="border-b-2 border-border bg-bg-mid px-5 py-4 sm:px-6 sm:py-5">
          <h3 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-text">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-white text-base sm:text-lg">1</span>
            Pilih Barang yang Dibutuhkan
          </h3>
          <p className="mt-2 text-sm sm:text-base text-text-muted pl-11 sm:pl-13">
            Cari barang yang ingin Anda minta, lalu tentukan jumlahnya.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="search_barang" className="block text-base font-semibold text-text">
              Langkah 1A: Cari Nama / Kode Barang
            </label>
            <div className="relative">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-xl" />
              <input
                id="search_barang"
                type="text"
                placeholder="Ketik nama barang disini (contoh: Kertas A4)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-2 border-border-light bg-surface py-3 sm:py-4 pl-12 pr-4 text-base sm:text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="rounded-xl border-2 border-border-light bg-bg-mid/50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label className="block text-base font-semibold text-text">
                  Langkah 1B: Pilih Barang dari Hasil Pencarian
                </label>
                <select
                  value={barangId}
                  onChange={(e) => setBarangId(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-surface p-3 sm:p-4 text-base sm:text-lg font-medium focus:border-primary focus:outline-none transition-all"
                >
                  <option value="">— Klik disini untuk memilih barang ({filteredBarang.length} hasil) —</option>
                  {filteredBarang.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.stok === 0}>
                      {b.kode} - {b.nama} {b.stok === 0 ? "(HABIS)" : `(Sisa Stok: ${b.stok} ${b.satuan})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-32 space-y-2">
                <label htmlFor="jumlah_temp" className="block text-base font-semibold text-text">
                  Jumlah
                </label>
                <input
                  id="jumlah_temp"
                  type="number"
                  min={1}
                  max={dipilih?.stok ?? undefined}
                  value={jumlahStr}
                  onChange={(e) => setJumlahStr(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-surface p-3 sm:p-4 text-center text-lg font-bold focus:border-primary focus:outline-none transition-all disabled:opacity-50"
                  disabled={!dipilih}
                />
              </div>

              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!dipilih || jumlah <= 0 || jumlah > (dipilih?.stok || 0)}
                  className="w-full rounded-xl bg-primary px-6 py-3 sm:py-4 text-base sm:text-lg font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Icon name="plus" className="text-xl" /> Tambahkan ke Daftar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Langkah 2 */}
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-sm">
        <div className="border-b-2 border-border bg-bg-mid px-5 py-4 sm:px-6 sm:py-5">
          <h3 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-text">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-white text-base sm:text-lg">2</span>
            Daftar Barang yang Diminta
          </h3>
          <p className="mt-2 text-sm sm:text-base text-text-muted pl-11 sm:pl-13">
            Periksa kembali barang-barang yang sudah Anda tambahkan sebelum diajukan.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-light bg-bg-mid/50 py-10 sm:py-16 text-center">
              <Icon name="package" className="mb-4 text-5xl text-border" />
              <p className="text-lg font-semibold text-text">Daftar masih kosong</p>
              <p className="mt-1 text-base text-text-muted">
                Silakan tambahkan barang pada Langkah 1 di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.barang_id}
                  className="flex flex-col gap-4 rounded-xl border-2 border-border-light bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 transition-all hover:border-primary/50 shadow-sm"
                >
                  <div className="flex flex-col">
                    <span className="text-lg sm:text-xl font-bold text-text">
                      {item.nama}
                    </span>
                    <span className="text-sm sm:text-base text-text-muted font-mono mt-1">
                      Kode Barang: {item.kode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 border-t-2 border-border-light pt-4 sm:border-t-0 sm:pt-0">
                    <div className="text-center sm:text-right">
                      <span className="block text-sm text-text-muted">Jumlah Diminta</span>
                      <div className="flex items-baseline gap-1 justify-center sm:justify-end">
                        <span className="text-2xl font-black text-primary">{item.jumlah}</span>
                        <span className="text-base font-semibold text-text-muted">{item.satuan}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.barang_id)}
                      className="group flex items-center justify-center rounded-xl bg-[rgba(224,62,62,0.1)] p-3 sm:p-4 text-danger transition-all hover:bg-danger hover:text-white"
                      title="Batal / Hapus Barang"
                    >
                      <Icon name="trash" className="text-xl sm:text-2xl group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Langkah 3 */}
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-sm">
        <div className="border-b-2 border-border bg-bg-mid px-5 py-4 sm:px-6 sm:py-5">
          <h3 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-text">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-white text-base sm:text-lg">3</span>
            Keterangan & Finalisasi
          </h3>
          <p className="mt-2 text-sm sm:text-base text-text-muted pl-11 sm:pl-13">
            Isi tanggal penggunaan dan untuk apa barang ini diminta.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="space-y-3">
            <label htmlFor="tanggal_pinjam" className="block text-base sm:text-lg font-semibold text-text">
              Tanggal Kebutuhan / Penggunaan
            </label>
            <input
              id="tanggal_pinjam"
              name="tanggal_pinjam"
              type="date"
              required
              defaultValue={today}
              min={today}
              className="w-full sm:w-1/2 rounded-xl border-2 border-border bg-surface p-3 sm:p-4 text-base sm:text-lg font-medium focus:border-primary focus:outline-none transition-all"
            />
            <p className="text-sm sm:text-base text-text-muted">
              Pilih tanggal kapan barang ini akan mulai dipakai.
            </p>
          </div>

          <div className="space-y-3">
            <label htmlFor="keperluan" className="block text-base sm:text-lg font-semibold text-text">
              Keperluan / Tujuan Permintaan
            </label>
            <textarea
              id="keperluan"
              name="keperluan"
              rows={4}
              required
              minLength={5}
              placeholder="Contoh: Kebutuhan ATK untuk operasional bulanan Divisi Keuangan..."
              className="w-full rounded-xl border-2 border-border bg-surface p-4 text-base sm:text-lg focus:border-primary focus:outline-none transition-all resize-y"
            />
            <p className="text-sm sm:text-base text-text-muted">
              Jelaskan secara singkat untuk kegiatan atau acara apa barang-barang ini diminta (wajib diisi).
            </p>
          </div>
        </div>
      </div>

      {/* Tombol Submit */}
      <div className="pb-10 pt-4 flex flex-col items-center gap-4">
        <button
          type="submit"
          disabled={pending || cart.length === 0}
          className="group flex w-full sm:w-2/3 lg:w-1/2 items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 sm:py-5 text-lg sm:text-xl font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            "Sedang Mengirim..."
          ) : (
            <>
              Kirim Permintaan Sekarang ({cart.length} Barang)
              <Icon name="arrow_right" className="text-2xl group-hover:translate-x-2 transition-transform" />
            </>
          )}
        </button>
        <p className="text-center text-sm sm:text-base font-medium text-text-muted max-w-lg">
          Setelah dikirim, permintaan ini akan masuk ke status <strong>Menunggu</strong>. Anda dapat mengambil barang setelah mendapat persetujuan dari Admin.
        </p>
      </div>
    </form>
  );
}
