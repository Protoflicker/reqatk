"use client";

import { useState } from "react";
import { markAsRead, markAllAsRead } from "@/lib/notifications";
import type { Notification } from "@/lib/notifications";
import { Icon, type IconName } from "./icon";

interface NotificationBellProps {
  userId: number;
  initialNotifications: Notification[];
}

export function NotificationBell({ userId, initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (type: string): IconName => {
    switch (type) {
      case "REQUEST_APPROVED":
        return "check";
      case "REQUEST_REJECTED":
        return "x";
      case "LOW_STOCK":
        return "alert";
      case "NEW_REQUEST":
        return "inbox";
      default:
        return "bell";
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifikasi"
        className="sesd-iconbtn relative"
      >
        <Icon name="bell" className="text-[1.05rem]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel (docs/style.md §20) */}
          <div className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-(--shadow-hover)">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-extrabold tracking-tight text-text">
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-muted">
                  Tidak ada notifikasi
                </div>
              ) : (
                notifications.map((notif) => (
                  <a
                    key={notif.id}
                    href={notif.link || "#"}
                    onClick={() => {
                      handleMarkAsRead(notif.id);
                      setIsOpen(false);
                    }}
                    className={`block border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-bg ${
                      !notif.read ? "bg-[rgba(0,117,222,0.06)]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                        <Icon name={getIcon(notif.type)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text">
                          {notif.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                          {notif.message}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-text-muted">
                          {new Date(notif.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
