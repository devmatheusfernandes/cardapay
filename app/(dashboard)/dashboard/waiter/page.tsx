// app/dashboard/waiter/page.tsx - VERSÃO ATUALIZADA COM useTableStatus
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTableStatus } from "@/lib/hooks/useTableStatus";
import {
  Square,
  Users,
  PlusCircle,
  Activity,
  ChefHat,
  Clock,
  CheckCircle,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";
import AddTableModal from "@/app/components/waiter/AddTableModal";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function WaiterPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);

  // Estado local para as mesas físicas do restaurante
  const [physicalTables, setPhysicalTables] = useState(
    Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }))
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para notificações que já foram visualizadas
  const [dismissedNotifications, setDismissedNotifications] = useState<
    string[]
  >([]);

  // Novo hook para status das mesas
  const physicalTableIds = useMemo(
    () => physicalTables.map((t) => t.id),
    [physicalTables]
  );
  const { tablesWithStatus, isLoading, statusCounts, tablesWithNotifications } =
    useTableStatus(physicalTableIds);

  // Filtrar notificações que ainda não foram dispensadas
  const activeNotifications = useMemo(() => {
    return tablesWithNotifications.filter(
      (tableId) => !dismissedNotifications.includes(tableId)
    );
  }, [tablesWithNotifications, dismissedNotifications]);

  // Debug logs
  useEffect(() => {
    console.log("🔥 Status atual das mesas:", tablesWithStatus);
    console.log("📊 Contadores de status:", statusCounts);
    console.log("🔔 Mesas com notificações:", tablesWithNotifications);
  }, [tablesWithStatus, statusCounts, tablesWithNotifications]);

  const handleSelectTable = (tableId: number) => {
    // Marcar notificação como dispensada ao acessar a mesa
    const tableIdStr = tableId.toString();
    if (tablesWithNotifications.includes(tableIdStr)) {
      setDismissedNotifications((prev) => [...prev, tableIdStr]);
    }

    router.push(`/dashboard/waiter/${tableId}`);
  };

  const handleAddTable = (tableId: number) => {
    setPhysicalTables((prev) =>
      [...prev, { id: tableId }].sort((a, b) => a.id - b.id)
    );
  };

  const handleDismissNotification = (tableId: string) => {
    setDismissedNotifications((prev) => [...prev, tableId]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando estados das mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SubscriptionGuard>
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
          <div className="flex justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-slate-700" />
              <h1 className="text-3xl font-bold text-slate-800">
                Gerenciamento de Mesas
              </h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition"
            >
              <PlusCircle className="w-5 h-5" />
              Adicionar Mesa
            </button>
          </div>

          {/* Resumo de Status */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
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

          {/* Notificações de pedidos prontos */}
          {activeNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-yellow-600 mt-0.5 animate-bounce" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">
                      Pedidos Prontos para Servir!
                    </h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      {activeNotifications.length === 1
                        ? `Mesa ${activeNotifications[0]} tem pedidos prontos`
                        : `Mesas ${activeNotifications.join(
                            ", "
                          )} têm pedidos prontos`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    activeNotifications.forEach((tableId) =>
                      handleDismissNotification(tableId)
                    );
                  }}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                >
                  Dispensar
                </button>
              </div>
            </motion.div>
          )}

          {/* Legenda dos status */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200 rounded border-2 border-slate-300"></div>
              <span className="text-slate-600">Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded border-2 border-green-400"></div>
              <span className="text-slate-600">Ativa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-100 rounded border-2 border-emerald-400"></div>
              <span className="text-slate-600">Na Cozinha</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded border-2 border-red-500"></div>
              <span className="text-slate-600">Pedidos Não Enviados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded border-2 border-yellow-500"></div>
              <span className="text-slate-600">Pronto para Servir</span>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
          >
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
                unsent: {
                  iconColor: "text-red-600",
                  borderColor: "border-red-500",
                  bgColor: "bg-red-50 hover:bg-red-100",
                },
                "ready-to-serve": {
                  iconColor: "text-yellow-600",
                  borderColor: "border-yellow-500",
                  bgColor: "bg-yellow-50 hover:bg-yellow-100",
                },
              };
              const currentStyle = statusStyles[table.status];

              const hasActiveNotification = activeNotifications.includes(
                table.id.toString()
              );

              return (
                <motion.button
                  key={table.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectTable(table.id)}
                  className={`relative aspect-square rounded-xl shadow-sm border-2 flex flex-col items-center justify-center p-4 transition-colors ${
                    currentStyle.borderColor
                  } ${currentStyle.bgColor} ${
                    hasActiveNotification ? "animate-pulse" : ""
                  }`}
                >
                  {/* Tags de status */}
                  {table.status === "active" && (
                    <Tag icon={Activity} text="Ativa" color="bg-green-500" />
                  )}
                  {table.status === "pending" && (
                    <Tag icon={ChefHat} text="Cozinha" color="bg-emerald-500" />
                  )}
                  {table.status === "unsent" && (
                    <Tag
                      icon={Clock}
                      text={`${table.unsentItemsCount} Não Enviados`}
                      color="bg-red-500"
                    />
                  )}
                  {table.status === "ready-to-serve" && (
                    <Tag
                      icon={CheckCircle}
                      text="Pronto!"
                      color="bg-yellow-500"
                    />
                  )}

                  {/* Indicador de notificação ativa */}
                  {hasActiveNotification && (
                    <div className="absolute top-1 left-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  )}

                  <Square className={`w-12 h-12 ${currentStyle.iconColor}`} />
                  <p className="mt-2 text-xl font-bold text-slate-700">
                    Mesa {table.id}
                  </p>

                  {/* Informações adicionais para debug */}
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
          </motion.div>
        </div>
      </SubscriptionGuard>
      <AddTableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTable={handleAddTable}
        existingTableIds={physicalTableIds}
      />
    </>
  );
}

// Componente para as tags de status
const Tag = ({
  icon: Icon,
  text,
  color,
}: {
  icon: React.ElementType;
  text: string;
  color: string;
}) => (
  <div
    className={`absolute top-2 right-2 flex items-center gap-1.5 text-white text-xs font-bold px-2 py-1 rounded-full ${color}`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{text}</span>
  </div>
);
