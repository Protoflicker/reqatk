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
  subtitle: string;
  icon: IconName;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_USER: NavSection[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", subtitle: "Ringkasan & statistik", icon: "grid" }
    ],
  },
  {
    title: "Peminjaman",
    items: [
      { href: "/barang", label: "Daftar Barang", subtitle: "Lihat semua aset", icon: "package" },
      { href: "/peminjaman", label: "Form Peminjaman", subtitle: "Request baru", icon: "clipboard" },
      { href: "/laporan", label: "Laporan Peminjaman", subtitle: "Riwayat peminjaman", icon: "chart" },
    ],
  },
  {
    title: "Akun",
    items: [
      { href: "/profile", label: "Profil Saya", subtitle: "Pengaturan akun", icon: "user" }
    ],
  },
];

const NAV_ADMIN: NavSection[] = [
  {
    title: "Utama",
    items: [{ href: "/admin", label: "Dashboard", subtitle: "Ringkasan & statistik", icon: "grid" }],
  },
  {
    title: "Inventaris",
    items: [
      { href: "/admin/barang", label: "Daftar Barang", subtitle: "Kelola semua barang", icon: "package" },
      { href: "/admin/barang/import", label: "Import Barang", subtitle: "Upload data massal", icon: "upload" },
    ],
  },
  {
    title: "Peminjaman",
    items: [
      { href: "/admin/peminjaman", label: "Persetujuan", subtitle: "Review request", icon: "check" },
      { href: "/admin/laporan", label: "Laporan Peminjaman", subtitle: "Riwayat peminjaman", icon: "chart" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", subtitle: "Kelola akun", icon: "users" },
      { href: "/admin/logs", label: "Activity Log", subtitle: "Log aktivitas sistem", icon: "clock" },
      { href: "/admin/profile", label: "Profil Admin", subtitle: "Pengaturan akun", icon: "user" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "#") return false;
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

  // Helper to extract initials
  const initials = nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      {/* ===== Desktop: sidebar tetap di kiri ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16rem] flex-col border-r border-border-light bg-white md:flex">
        {/* Header / Logo */}
        <div className="flex items-center justify-between p-6">
          <p className="font-display text-2xl font-extrabold tracking-tight text-text">
            PINJAM<span className="text-primary">/ATK</span>
          </p>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
            <Icon name="chevron_left" className="text-lg" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          {sections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "mt-4" : ""}>
              {/* Divider with Text */}
              <div className="mb-3 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500">
                  {section.title}
                </p>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              <ul className="space-y-1.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-4 rounded-xl border p-3 transition-all ${
                          active
                            ? "border-[rgba(0,117,222,0.22)] bg-[rgba(0,117,222,0.10)]"
                            : "border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <div className={`flex items-center justify-center ${active ? "text-[#0075DE]" : "text-gray-500"}`}>
                          <Icon name={item.icon} className="text-[1.3rem]" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[15px] font-bold ${active ? "text-[#0075DE]" : "text-gray-700"}`}>
                            {item.label}
                          </span>
                          <span className={`text-xs ${active ? "text-[#0075DE]" : "text-gray-500"}`}>
                            {item.subtitle}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile Card */}
        <div className="p-4">
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 border border-gray-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0075DE] text-sm font-bold text-white">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-gray-900">{nama}</p>
                <div className="text-[11px] font-mono text-gray-500 leading-tight">
                  <p>NIP</p>
                  <p className="truncate">{nip}</p>
                </div>
              </div>
            </div>
            <form action={logout} className="ml-2 shrink-0">
              <button type="submit" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                Keluar
              </button>
            </form>
          </div>
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
                <li key={item.label}>
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
