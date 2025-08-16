// app/waiter/dashboard/waiter/layout.tsx
"use client";

import { TableProvider } from "@/lib/context/TableContext";
import RoleGuard from "@/app/components/guards/RoleGuard";

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["waiter"]}>
      <TableProvider>{children}</TableProvider>
    </RoleGuard>
  );
}
