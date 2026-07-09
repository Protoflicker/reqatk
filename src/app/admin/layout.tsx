import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return <AppShell session={session}>{children}</AppShell>;
}
