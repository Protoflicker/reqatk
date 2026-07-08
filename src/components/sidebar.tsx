"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import type { Role } from "@/lib/definitions";

interface NavItem {
  href: string;
  label: string;
}

const NAV_USER: NavItem[] = [
  { href: "/dashboard", label: "Dasbor" },
  { href: "/barang", label: "Daftar Barang" },
  { href: "/peminjaman", label: "Form Peminjaman" },
  { href: "/laporan", label: "Laporan Peminjaman" },
  { href: "/profile", label: "Profil Saya" },
];

const NAV_ADMIN: NavItem[] = [
  { href: "/admin", label: "Dasbor" },
  { href: "/admin/barang", label: "Daftar Barang" },
  { href: "/admin/barang/import", label: "Import Barang" },
  { href: "/admin/peminjaman", label: "Persetujuan" },
  { href: "/admin/laporan", label: "Laporan Peminjaman" },
  { href: "/admin/pengguna", label: "Pengguna" },
  { href: "/admin/logs", label: "Activity Log" },
  { href: "/admin/profile", label: "Profil Admin" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  role,
  nama,
  nip,
}: {
  role: Role;
  nama: string;
  nip: string;
}) {
  const pathname = usePathname();
  const items = role === "admin" ? NAV_ADMIN : NAV_USER;

  return (
    <>
      {/* ===== Desktop: sidebar tetap di kiri ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-surface border-r border-border-light md:flex" style={{
        borderRadius: '0 0 16px 16px'
      }}>
        <div className="border-b border-border p-5">
          <p className="font-display text-2xl font-extrabold leading-tight tracking-tight text-text">
            PINJAM
            <span className="text-primary">/ATK</span>
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Sistem Peminjaman ATK
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            <span className={role === "admin" ? "inline-block h-1.5 w-1.5 rounded-full bg-primary" : "inline-block h-1.5 w-1.5 rounded-full bg-text-muted"}></span>
            {role === "admin" ? "Admin" : "User"}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? "bg-primary-light text-primary shadow-sm"
                        : "text-text-muted hover:bg-bg hover:text-text hover:translate-x-1"
                    }`}
                  >
                    <span className={`text-xs ${active ? "text-primary" : "text-text-muted"}`}>
                      ●
                    </span>
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto text-primary">→</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-bg p-3">
            <p className="truncate text-sm font-bold text-text">
              {nama}
            </p>
            <p className="mt-0.5 font-mono text-xs text-text-muted">
              {nip}
            </p>
          </div>
          <form action={logout} className="mt-3">
            <button type="submit" className="neu-btn-danger w-full justify-center text-sm">
              Keluar →
            </button>
          </form>
        </div>
      </aside>

      {/* ===== Mobile: bar atas + nav gulir horizontal ===== */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface md:hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-lg font-extrabold tracking-tight text-text">
            PINJAM<span className="text-primary">/ATK</span>
          </p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] text-text-muted">
              {nip}
            </p>
            <form action={logout}>
              <button type="submit" className="neu-btn-danger px-3 py-1.5 text-xs">
                Keluar
              </button>
            </form>
          </div>
        </div>
        <nav className="overflow-x-auto">
          <ul className="flex w-max">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="border-r border-border">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                      active ? "bg-primary text-white" : "text-text-muted hover:text-text hover:bg-bg"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
