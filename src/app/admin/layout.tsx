import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { getNotifications } from "@/lib/actions";

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const notifications = await getNotifications(session.id);
  
  return <AppShell session={session} notifications={notifications}>{children}</AppShell>;
}
