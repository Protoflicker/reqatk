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
    title: "Permintaan",
    items: [
      { href: "/barang", label: "Daftar Barang", subtitle: "Lihat semua aset", icon: "package" },
      { href: "/permintaan", label: "Form Permintaan", subtitle: "Request baru", icon: "clipboard" },
      { href: "/laporan", label: "Laporan Permintaan", subtitle: "Riwayat permintaan", icon: "chart" },
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
    title: "Permintaan",
    items: [
      { href: "/admin/permintaan", label: "Persetujuan", subtitle: "Review request", icon: "check" },
      { href: "/admin/laporan", label: "Laporan Permintaan", subtitle: "Riwayat permintaan", icon: "chart" },
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
  isCollapsed,
  onToggleCollapse,
}: {
  role: Role;
  nama: string;
  nip: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const sections = role === "admin" ? NAV_ADMIN : NAV_USER;
  const flatItems = sections.flatMap((s) => s.items);

  // Helper to extract initials
  const initials = nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      {/* ===== Desktop: sidebar tetap di kiri ===== */}
      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border-light bg-surface md:flex ${isCollapsed ? 'w-[4.5rem]' : 'w-[16rem]'}`}>
        {/* Header / Logo + Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-5' : 'justify-between p-6'}`}>
          {!isCollapsed && (
            <p className="font-display text-2xl font-extrabold tracking-tight text-text">
              PINJAM<span className="text-primary">/ATK</span>
            </p>
          )}
          <button 
            onClick={onToggleCollapse}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isCollapsed 
                ? 'bg-primary text-white shadow-md hover:bg-primary-dark' 
                : 'bg-bg-mid text-text-muted hover:bg-border'
            }`}
          >
            <Icon name="chevron_left" className={`text-lg transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className={`flex-1 overflow-y-auto pb-4 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          {sections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? (isCollapsed ? "mt-2" : "mt-4") : ""}>
              {/* Divider with Text — hidden when collapsed */}
              {!isCollapsed && (
                <div className="mb-3 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border-light"></div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
                    {section.title}
                  </p>
                  <div className="h-px flex-1 bg-border-light"></div>
                </div>
              )}

              <ul className={isCollapsed ? "space-y-1 flex flex-col items-center" : "space-y-1.5"}>
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.label} className={isCollapsed ? "w-full" : ""}>
                      <Link
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center hover:-translate-y-0.5 transition-transform ${
                          isCollapsed 
                            ? `justify-center rounded-xl p-2.5 ${
                                active 
                                  ? "bg-primary/10 text-primary" 
                                  : "text-text-muted hover:bg-bg-mid hover:text-text"
                              }` 
                            : `gap-4 rounded-xl border p-3 ${
                                active
                                  ? "border-primary/22 bg-primary/10"
                                  : "border-transparent hover:bg-bg-mid"
                              }`
                        }`}
                      >
                        <div className={`flex items-center justify-center ${active ? "text-primary" : isCollapsed ? "" : "text-text-muted"}`}>
                          <Icon name={item.icon} className={isCollapsed ? "text-[1.4rem]" : "text-[1.3rem]"} />
                        </div>
                        {!isCollapsed && (
                          <div className="flex flex-col">
                            <span className={`text-[15px] font-bold ${active ? "text-primary" : "text-text"}`}>
                              {item.label}
                            </span>
                            <span className={`text-xs ${active ? "text-primary" : "text-text-muted"}`}>
                              {item.subtitle}
                            </span>
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile Card */}
        <div className={`p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
            /* Collapsed: just show avatar circle */
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white cursor-pointer" title={`${nama} — Keluar`}>
              <Icon name="user" className="text-lg" />
            </div>
          ) : (
            /* Expanded: full profile card */
            <div className="flex items-center justify-between rounded-2xl bg-bg-mid p-3 border border-border-light">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <p className="truncate text-sm font-bold text-text">{nama}</p>
                  <div className="text-[11px] font-mono text-text-muted leading-tight">
                    <p>NIP</p>
                    <p className="truncate">{nip}</p>
                  </div>
                </div>
              </div>
              <form action={logout} className="ml-2 shrink-0">
                <button type="submit" className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-bg-mid hover:text-text">
                  Keluar
                </button>
              </form>
            </div>
          )}
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
