"use client";

import { useState, useEffect } from "react";
import { markAsRead, markAllAsRead } from "@/lib/notifications";
import type { Notification } from "@/lib/notifications";

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

  const getIcon = (type: string) => {
    switch (type) {
      case "REQUEST_APPROVED":
        return "✓";
      case "REQUEST_REJECTED":
        return "✕";
      case "LOW_STOCK":
        return "⚠";
      case "NEW_REQUEST":
        return "📬";
      default:
        return "•";
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="neu-btn relative px-3 py-2 text-dark-light"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
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

          {/* Notification Panel */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 neu-card max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-bg px-4 py-3">
              <h3 className="font-bold text-dark">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Tandai semua sudah dibaca
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
                    className={`block border-b border-bg px-4 py-3 transition-colors hover:bg-bg/50 ${
                      !notif.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-dark">
                          {notif.title}
                        </p>
                        <p className="mt-1 text-xs text-dark-light line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {new Date(notif.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
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
