"use client";

import RoleGuard from "@/app/components/guards/RoleGuard";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard allowedRoles={["client"]}>{children}</RoleGuard>;
}
