"use client";

import { useState } from "react";
import type { StatusPeminjaman } from "@/lib/definitions";

interface FilterOptions {
  status?: StatusPeminjaman | "ALL";
  month?: string;
  kategori?: string;
  search?: string;
}

interface AdvancedFilterProps {
  onFilter: (filters: FilterOptions) => void;
  showKategori?: boolean;
  showMonth?: boolean;
  showStatus?: boolean;
  showSearch?: boolean;
  categories?: string[];
}

export function AdvancedFilter({
  onFilter,
  showKategori = false,
  showMonth = true,
  showStatus = true,
  showSearch = true,
  categories = [],
}: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: "ALL",
    month: "",
    kategori: "",
    search: "",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleClear = () => {
    const cleared: FilterOptions = {
      status: "ALL",
      month: "",
      kategori: "",
      search: "",
    };
    setFilters(cleared);
    onFilter(cleared);
  };

  const hasActiveFilters = 
    filters.status !== "ALL" ||
    filters.month !== "" ||
    filters.kategori !== "" ||
    filters.search !== "";

  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7); // YYYY-MM
      const label = date.toLocaleDateString("id-ID", { 
        year: "numeric", 
        month: "long" 
      });
      months.push({ value, label });
    }
    return months;
  };

  return (
    <div className="neu-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-dark flex items-center gap-2">
          🔍 Filter & Pencarian
          {hasActiveFilters && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
              Aktif
            </span>
          )}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="neu-btn px-3 py-1 text-xs font-bold text-dark-light md:hidden"
        >
          {isExpanded ? "Tutup" : "Buka"}
        </button>
      </div>

      <div className={`space-y-4 ${isExpanded ? "block" : "hidden md:block"}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          {showSearch && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Pencarian
              </label>
              <input
                type="text"
                placeholder="Cari NIP, nama, barang..."
                value={filters.search}
                onChange={(e) => handleChange("search", e.target.value)}
                className="neu-input w-full text-sm text-dark"
              />
            </div>
          )}

          {/* Status */}
          {showStatus && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="neu-input w-full text-sm text-dark"
              >
                <option value="ALL">Semua Status</option>
                <option value="MENUNGGU">Menunggu</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>
          )}

          {/* Month */}
          {showMonth && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Bulan
              </label>
              <select
                value={filters.month}
                onChange={(e) => handleChange("month", e.target.value)}
                className="neu-input w-full text-sm text-dark"
              >
                <option value="">Semua Bulan</option>
                {getMonthOptions().map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Kategori */}
          {showKategori && categories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Kategori
              </label>
              <select
                value={filters.kategori}
                onChange={(e) => handleChange("kategori", e.target.value)}
                className="neu-input w-full text-sm text-dark"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={handleClear}
              className="neu-btn px-4 py-2 text-xs font-bold text-dark-light hover:text-red-600"
            >
              ✕ Hapus Semua Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
