import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";

export default async function UserAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (session.role === "admin") redirect("/admin");
  return <AppShell session={session}>{children}</AppShell>;
}
