import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return <AdminShell username={session.username}>{children}</AdminShell>;
}
