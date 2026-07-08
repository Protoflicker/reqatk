import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";
import { getNotifications } from "@/lib/actions";

export default async function UserAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (session.role === "admin") redirect("/admin");
  
  const notifications = await getNotifications(session.id);
  
  return <AppShell session={session} notifications={notifications}>{children}</AppShell>;
}
