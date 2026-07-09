"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icon";

const STORAGE_KEY = "sesdian_theme";

/**
 * Toggle light/dark (docs/style.md §26). Atribut data-theme dipasang
 * sebelum first paint oleh skrip inline di root layout.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* localStorage bisa nonaktif; preferensi cukup berlaku sesesi */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={dark ? "Mode terang" : "Mode gelap"}
      className={`sesd-iconbtn ${className}`}
    >
      <Icon name={dark ? "sun" : "moon"} className="text-[1.05rem]" />
    </button>
  );
}
