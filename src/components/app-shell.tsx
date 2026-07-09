import { Sidebar } from "./sidebar";
import type { SessionPayload } from "@/lib/session";

export function AppShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-dvh">
      <Sidebar role={session.role} nama={session.nama} nip={session.nip} />
      <div className="md:ml-60">
        <div className="hidden items-center justify-between border-b-2 border-ink px-8 py-2 md:flex">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink/70">
            {today}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
            SESI AKTIF / {session.nama} / NIP {session.nip}
          </p>
        </div>
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
        <footer className="border-t-2 border-ink px-4 py-3 md:px-8">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink/60">
            PINJAM/ATK © {new Date().getFullYear()} /// Sistem internal — akses
            berdasarkan NIP
          </p>
        </footer>
      </div>
    </div>
  );
}
