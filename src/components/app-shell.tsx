"use client";

import { Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import type { SessionPayload } from "@/lib/session";
import type { Notification } from "@/lib/notifications";
import { useEffect, useState } from "react";

export function AppShell({
  session,
  notifications,
  children,
}: {
  session: SessionPayload;
  notifications: Notification[];
  children: React.ReactNode;
}) {
  const [today, setToday] = useState("");
  const [currentYear, setCurrentYear] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    );
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar role={session.role} nama={session.nama} nip={session.nip} />
      <div className="md:ml-60">
        <div className="neu-raised-sm hidden items-center justify-between px-8 py-3 md:flex">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {today}
          </p>
          <div className="flex items-center gap-4">
            <NotificationBell userId={session.id} initialNotifications={notifications} />
            <p className="text-xs font-bold uppercase tracking-wider text-dark">
              SESI AKTIF / {session.nama} / NIP {session.nip}
            </p>
          </div>
        </div>
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
        <footer className="neu-raised-sm mt-10 px-4 py-4 text-center md:px-8">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            PINJAM/ATK © {currentYear} /// Sistem internal — akses berdasarkan NIP
          </p>
        </footer>
      </div>
    </div>
  );
}
