"use client";

import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import type { SessionPayload } from "@/lib/session";
import type { Notification } from "@/lib/notifications";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

export function AppShell({
  session,
  notifications,
  children,
}: {
  session: SessionPayload;
  notifications: Notification[];
  children: React.ReactNode;
}) {
  const [formattedDate, setFormattedDate] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const pathname = usePathname();

  useEffect(() => {
    const now = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    setFormattedDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    setCurrentYear(now.getFullYear().toString());

    // Font size setting
    const savedSize = localStorage.getItem("sesdian_font_size") as "small" | "medium" | "large";
    if (savedSize && ["small", "medium", "large"].includes(savedSize)) {
      setFontSize(savedSize);
      applyFontSize(savedSize);
    }
  }, []);

  const applyFontSize = (size: "small" | "medium" | "large") => {
    const root = document.documentElement;
    if (size === "small") {
      root.style.fontSize = "14px";
    } else if (size === "medium") {
      root.style.fontSize = "16px";
    } else if (size === "large") {
      root.style.fontSize = "18px";
    }
  };

  const handleFontSizeChange = (size: "small" | "medium" | "large") => {
    setFontSize(size);
    applyFontSize(size);
    try {
      localStorage.setItem("sesdian_font_size", size);
    } catch {
      // ignore
    }
  };

  const getPageTitle = (path: string) => {
    if (path.includes("/barang")) return "Barang";
    if (path.includes("/laporan")) return "Laporan";
    if (path.includes("/profile")) return "Profile";
    if (path.includes("/pengguna")) return "Pengguna";
    if (path.includes("/logs")) return "Log Aktivitas";
    if (path.includes("/peminjaman")) return "Peminjaman";
    return "Dashboard";
  };

  const getPageIcon = (path: string) => {
    if (path.includes("/barang")) return "package";
    if (path.includes("/laporan")) return "chart";
    if (path.includes("/profile")) return "user";
    if (path.includes("/pengguna")) return "users";
    if (path.includes("/logs")) return "clipboard";
    if (path.includes("/peminjaman")) return "clipboard";
    return "grid";
  };

  const pageTitle = getPageTitle(pathname || "");
  const pageIcon = getPageIcon(pathname || "");

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar role={session.role} nama={session.nama} nip={session.nip} />
      <div className="md:ml-60">
        <div
          data-topbar
          className="sticky top-0 z-50 hidden items-center justify-between border-b border-border bg-surface/90 px-8 py-3 backdrop-blur-sm md:flex"
        >
          {/* Left Side: Icon + Page Title */}
          <div className="flex items-center gap-2">
            <Icon name={pageIcon} className="text-[1.2rem] text-text-muted mr-1" />
            <span className="font-sans text-sm font-bold text-text">
              {pageTitle}
            </span>
          </div>

          {/* Right Side: Theme Toggle, Font Size, Date, Notifications, Profile */}
          <div className="flex items-center gap-4">
            {/* 1. Theme Toggle */}
            <ThemeToggle />

            {/* 2. Font Size Adjuster */}
            <div className="flex items-center gap-1 rounded-full bg-bg-mid p-1 border border-border">
              <button
                type="button"
                onClick={() => handleFontSizeChange("small")}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold cursor-pointer transition-all ${
                  fontSize === "small"
                    ? "bg-primary text-white font-bold"
                    : "text-text-muted hover:text-text"
                }`}
                title="Teks Kecil"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange("medium")}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold cursor-pointer transition-all ${
                  fontSize === "medium"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-text"
                }`}
                title="Teks Sedang"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange("large")}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-base font-bold cursor-pointer transition-all ${
                  fontSize === "large"
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-text"
                }`}
                title="Teks Besar"
              >
                A
              </button>
            </div>

            {/* 3. Date Display */}
            <div className="flex items-center gap-1.5 font-sans text-xs font-medium text-text-muted select-none">
              <Icon name="calendar" className="text-sm" />
              <span>{formattedDate}</span>
            </div>

            {/* 4. Notification Bell */}
            <NotificationBell userId={session.id} initialNotifications={notifications} />

            {/* 5. User Profile Icon */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white cursor-pointer select-none"
              title={`${session.nama} (${session.nip})`}
            >
              <Icon name="user" className="text-lg" />
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
        <footer className="mt-10 border-t border-border px-4 py-6 text-center md:px-8">
          <p className="text-xs font-medium text-text-muted">
            PINJAM/ATK © {currentYear} · Sistem internal akses berdasarkan NIP
          </p>
        </footer>
      </div>
    </div>
  );
}
