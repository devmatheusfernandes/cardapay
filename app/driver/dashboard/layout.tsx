"use client";

import RoleGuard from "@/app/components/guards/RoleGuard";

export default function DriverDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["driver"]}>{children}</RoleGuard>;
}
