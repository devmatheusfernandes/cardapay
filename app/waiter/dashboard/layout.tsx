"use client";

import RoleGuard from "@/app/components/guards/RoleGuard";

export default function WaiterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["waiter"]}>{children}</RoleGuard>;
}
