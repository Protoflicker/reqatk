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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-2 border-ink bg-paper md:flex">
        <div className="border-b-2 border-ink p-5">
          <p className="font-display text-3xl leading-[0.9] tracking-tight">
            PINJAM
            <br />
            <span className="text-red">/ATK</span>
            <sup className="text-xs align-super">®</sup>
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-ink/70">
            Sistem Peminjaman
            <br />
            Alat Tulis Kantor
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em]">
            [ AKSES: <span className={role === "admin" ? "text-red" : ""}>{role.toUpperCase()}</span> ]
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul>
            {items.map((item, i) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="border-b border-ink/25">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-baseline gap-3 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                      active
                        ? "bg-ink text-paper"
                        : "hover:bg-paper-dim"
                    }`}
                  >
                    <span className={active ? "text-red" : "text-ink/50"}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{item.label}</span>
                    {active && <span className="ml-auto text-red">&gt;&gt;</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t-2 border-ink p-5">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em]">
            {nama}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.1em] text-ink/70">
            NIP {nip}
          </p>
          <form action={logout} className="mt-4">
            <button type="submit" className="btn btn-danger w-full justify-center">
              Keluar &gt;&gt;&gt;
            </button>
          </form>
        </div>
      </aside>

      {/* ===== Mobile: bar atas + nav gulir horizontal ===== */}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper md:hidden">
        <div className="flex items-center justify-between border-b border-ink/25 px-4 py-3">
          <p className="font-display text-lg leading-none tracking-tight">
            PINJAM<span className="text-red">/ATK</span>
          </p>
          <div className="flex items-center gap-3">
            <p className="text-[10px] uppercase tracking-[0.1em] text-ink/70">
              NIP {nip}
            </p>
            <form action={logout}>
              <button type="submit" className="btn btn-danger px-2 py-1">
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
                <li key={item.href} className="border-r border-ink/25">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap ${
                      active ? "bg-ink text-paper" : ""
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
