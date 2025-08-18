"use client";
import { ReactNode } from "react";
import Sidebar from "@/app/components/shared/Sidebar";
import RoleGuard from "@/app/components/guards/RoleGuard";
import WelcomeModal from "@/app/components/profile/WelcomeModal";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { shouldShowWelcome, markWelcomeAsSeen } = useOnboarding();

  return (
    <RoleGuard allowedRoles={["owner"]}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <WelcomeModal isOpen={shouldShowWelcome} onClose={markWelcomeAsSeen} />
    </RoleGuard>
  );
}
