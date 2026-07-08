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
        <div className="hidden items-center justify-between border-b border-border bg-surface px-8 py-4 md:flex">
          <p className="font-mono text-xs font-medium tracking-wide text-text-muted">
            {today}
          </p>
          <div className="flex items-center gap-4">
            <NotificationBell userId={session.id} initialNotifications={notifications} />
            <div className="flex items-center gap-2.5 rounded-lg bg-bg px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
              <p className="font-mono text-xs font-semibold text-text">
                {session.nama} · {session.nip}
              </p>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
        <footer className="mt-10 border-t border-border bg-surface px-4 py-6 text-center md:px-8">
          <p className="text-xs font-medium text-text-muted">
            PINJAM/ATK © {currentYear} · Sistem internal akses berdasarkan NIP
          </p>
        </footer>
      </div>
    </div>
  );
}
