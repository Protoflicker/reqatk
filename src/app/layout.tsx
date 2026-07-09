import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PINJAM/ATK — Sistem Peminjaman Alat Tulis Kantor",
  description:
    "Sistem permintaan dan peminjaman alat tulis kantor berbasis NIP.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        {/* Anti-flash: pasang tema tersimpan sebelum konten dirender */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("sesdian_theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}',
          }}
        />
        {children}
      </body>
    </html>
  );
}
