"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import type { Role } from "@/lib/definitions";
import { Icon, type IconName } from "./icon";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_USER: NavSection[] = [
  {
    title: "Utama",
    items: [{ href: "/dashboard", label: "Dasbor", icon: "zap" }],
  },
  {
    title: "Peminjaman",
    items: [
      { href: "/barang", label: "Daftar Barang", icon: "package" },
      { href: "/peminjaman", label: "Form Peminjaman", icon: "clipboard" },
      { href: "/laporan", label: "Laporan Peminjaman", icon: "chart" },
    ],
  },
  {
    title: "Akun",
    items: [{ href: "/profile", label: "Profil Saya", icon: "user" }],
  },
];

const NAV_ADMIN: NavSection[] = [
  {
    title: "Utama",
    items: [{ href: "/admin", label: "Dasbor", icon: "zap" }],
  },
  {
    title: "Inventaris",
    items: [
      { href: "/admin/barang", label: "Daftar Barang", icon: "package" },
      { href: "/admin/barang/import", label: "Import Barang", icon: "upload" },
    ],
  },
  {
    title: "Peminjaman",
    items: [
      { href: "/admin/peminjaman", label: "Persetujuan", icon: "check" },
      { href: "/admin/laporan", label: "Laporan Peminjaman", icon: "chart" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", icon: "users" },
      { href: "/admin/logs", label: "Activity Log", icon: "clock" },
      { href: "/admin/profile", label: "Profil Admin", icon: "user" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  if (href === "/admin/barang") {
    return pathname === href || (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/import`));
  }
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
  const sections = role === "admin" ? NAV_ADMIN : NAV_USER;
  const flatItems = sections.flatMap((s) => s.items);

  return (
    <>
      {/* ===== Desktop: sidebar tetap di kiri ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col rounded-b-[16px] border-r border-border-light bg-surface md:flex">
        <div className="border-b border-border p-5">
          <p className="font-display text-2xl font-extrabold leading-tight tracking-tight text-text">
            PINJAM
            <span className="text-primary">/ATK</span>
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Sistem Peminjaman ATK
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-muted/80">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                          active
                            ? "border-[rgba(0,117,222,0.22)] bg-[rgba(0,117,222,0.10)] text-primary"
                            : "border-transparent text-text-muted hover:translate-x-1 hover:bg-[rgba(0,117,222,0.07)] hover:text-text"
                        }`}
                      >
                        <Icon name={item.icon} className="shrink-0 text-base" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-bg p-3">
            <p className="truncate text-sm font-bold text-text">{nama}</p>
            <p className="mt-0.5 font-mono text-xs text-text-muted">{nip}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                role === "admin"
                  ? "bg-primary-light text-primary"
                  : "bg-bg-mid text-text-muted"
              }`}
            >
              <Icon name={role === "admin" ? "shield" : "user"} />
              {role === "admin" ? "Admin" : "User"}
            </span>
          </div>
          <form action={logout} className="mt-3">
            <button type="submit" className="neu-btn-danger w-full text-sm">
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* ===== Mobile: bar atas + nav gulir horizontal ===== */}
      <header data-mobilebar className="sticky top-0 z-40 border-b border-border bg-surface md:hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-lg font-extrabold tracking-tight text-text">
            PINJAM<span className="text-primary">/ATK</span>
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle className="!h-[34px] !w-[34px]" />
            <p className="font-mono text-[10px] text-text-muted">{nip}</p>
            <form action={logout}>
              <button type="submit" className="neu-btn-danger px-3 py-1.5 text-xs">
                Keluar
              </button>
            </form>
          </div>
        </div>
        <nav className="overflow-x-auto">
          <ul className="flex w-max gap-1 px-2 py-2">
            {flatItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-transparent bg-primary text-white"
                        : "border-border text-text-muted hover:bg-bg-mid hover:text-text"
                    }`}
                  >
                    <Icon name={item.icon} />
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
