"use client";
import { BackupOrdersManager } from "@/app/components/shared/BackupOrdersManager";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { redirect } from "next/navigation";
import PageHeader from "@/app/components/shared/PageHeader";

export default function BackupOrdersPage() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <PageHeader
        title="Pedidos de Backup"
        subtitle="Sistema de backup para recuperação de pedidos em caso de falhas"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackupOrdersManager restaurantId={user.uid} isAdmin={false} />
      </div>
    </div>
  );
}
