"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import {
  LoaderCircle,
  LogOut,
  Key,
  Copy,
  Users,
  Square,
  Activity,
  ChefHat,
  Clock,
  CheckCircle,
  Bell,
} from "lucide-react";
import { useTableStatus } from "@/lib/hooks/useTableStatus";
import { useWaiterSelfRemove } from "@/lib/hooks/useWaiterSelfRemove";

const useWaiterProfile = () => {
  const [user, authLoading] = useAuthState(auth);
  const [profile, setProfile] = useState<{
    code: string;
    restaurantId: string | null;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    const docRef = doc(db, "waiters", user.uid);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists())
        setProfile(
          doc.data() as {
            code: string;
            restaurantId: string | null;
            name: string;
          }
        );
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading]);
  return { profile, isLoading: authLoading || isLoading };
};

export default function WaiterDashboardPage() {
  const { profile, isLoading: profileLoading } = useWaiterProfile();
  const { removeSelfFromRestaurant, isRemoving } = useWaiterSelfRemove();
  const router = useRouter();

  // Use the existing useTableStatus hook to get real table data
  const physicalTableIds = profile?.restaurantId
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : [];
  const {
    tablesWithStatus,
    isLoading: tablesLoading,
    statusCounts,
  } = useTableStatus(physicalTableIds);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/waiter-login");
  };

  const handleCopyCode = () => {
    if (profile?.code) {
      navigator.clipboard.writeText(profile.code);
      toast.success("Código copiado!");
    }
  };

  const handleTableClick = (tableId: number) => {
    if (profile?.restaurantId) {
      router.push(`/waiter/dashboard/waiter/${tableId}`);
    }
  };

  const isLoading = profileLoading || (profile?.restaurantId && tablesLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <Users className="w-6 h-6" />
            <span>Bem vindo, {profile?.name || "Garçom"}!</span>
          </h1>
          {profile?.restaurantId && (
            <>
              <button
                onClick={() => router.push("/waiter/dashboard/waiter")}
                className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Activity className="w-4 h-4" />
                <span>Dashboard Completo</span>
              </button>
              <button
                onClick={async () => {
                  if (
                    confirm(
                      "Tem certeza que deseja se remover deste restaurante?"
                    )
                  ) {
                    try {
                      await removeSelfFromRestaurant();
                      router.push("/waiter-login");
                    } catch (error) {
                      console.error("Falha ao remover do restaurante:", error);
                    }
                  }
                }}
                disabled={isRemoving}
                className="flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isRemoving ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span>
                  {isRemoving ? "Removendo..." : "Sair do Restaurante"}
                </span>
              </button>
            </>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {!profile?.restaurantId ? (
          <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="bg-emerald-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center">
              <Key className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">
              Seu Código de Garçom
            </h2>
            <p className="mt-2 text-gray-500">
              Compartilhe este código com o proprietário do restaurante.
            </p>
            <div className="mt-6 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-2xl font-mono font-bold text-emerald-600 tracking-widest">
                {profile?.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition"
                aria-label="Copiar código"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Status das Mesas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-slate-600">
                    {statusCounts.free}
                  </div>
                  <div className="text-sm text-slate-500">Livres</div>
                </div>
                <div className="bg-green-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {statusCounts.active}
                  </div>
                  <div className="text-sm text-green-500">Ativas</div>
                </div>
                <div className="bg-red-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {statusCounts.unsent}
                  </div>
                  <div className="text-sm text-red-500">Não Enviados</div>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {statusCounts.pending}
                  </div>
                  <div className="text-sm text-emerald-500">Na Cozinha</div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {statusCounts["ready-to-serve"]}
                  </div>
                  <div className="text-sm text-yellow-500">Prontos</div>
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Mesas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {tablesWithStatus.map((table) => {
                  const statusStyles = {
                    free: {
                      iconColor: "text-slate-400",
                      borderColor: "border-slate-200",
                      bgColor: "bg-slate-50 hover:bg-emerald-50",
                    },
                    active: {
                      iconColor: "text-green-500",
                      borderColor: "border-green-400",
                      bgColor: "bg-green-50 hover:bg-green-100",
                    },
                    pending: {
                      iconColor: "text-emerald-500",
                      borderColor: "border-emerald-400",
                      bgColor: "bg-emerald-50 hover:bg-emerald-100",
                    },
                    "ready-to-serve": {
                      iconColor: "text-yellow-600",
                      borderColor: "border-yellow-500",
                      bgColor: "bg-yellow-50 hover:bg-yellow-100",
                    },
                    unsent: {
                      iconColor: "text-red-600",
                      borderColor: "border-red-500",
                      bgColor: "bg-red-50 hover:bg-red-100",
                    },
                  };
                  const currentStyle = statusStyles[table.status];

                  return (
                    <motion.button
                      key={table.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTableClick(table.id)}
                      className={`relative aspect-square rounded-xl shadow-sm border-2 flex flex-col items-center justify-center p-4 transition-colors ${currentStyle.borderColor} ${currentStyle.bgColor}`}
                    >
                      {table.status === "active" && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-white text-xs font-bold px-2 py-1 rounded-full bg-green-500">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Ativa</span>
                        </div>
                      )}
                      {table.status === "pending" && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-white text-xs font-bold px-2 py-1 rounded-full bg-emerald-500">
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Cozinha</span>
                        </div>
                      )}
                      {table.status === "ready-to-serve" && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-white text-xs font-bold px-2 py-1 rounded-full bg-yellow-500">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Pronto!</span>
                        </div>
                      )}
                      {table.status === "unsent" && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-white text-xs font-bold px-2 py-1 rounded-full bg-red-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{table.unsentItemsCount} Não Enviados</span>
                        </div>
                      )}
                      <Square
                        className={`w-12 h-12 ${currentStyle.iconColor}`}
                      />
                      <p className="mt-2 text-xl font-bold text-slate-700">
                        Mesa {table.id}
                      </p>
                      {(table.activeOrdersCount > 0 ||
                        table.unsentItemsCount > 0) && (
                        <div className="absolute bottom-1 right-1 text-xs text-slate-500 bg-white/80 px-1 rounded">
                          {table.unsentItemsCount > 0 &&
                            `${table.unsentItemsCount}📝`}
                          {table.activeOrdersCount > 0 &&
                            ` ${table.activeOrdersCount}🍽️`}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
