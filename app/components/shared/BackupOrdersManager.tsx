"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
} from "lucide-react";
import { useOrderBackup, BackupOrder } from "@/lib/hooks/useOrderBackup";
import { toast } from "react-hot-toast";
import { safeTimestampToDate } from "@/lib/utils/timestamp";

interface BackupOrdersManagerProps {
  restaurantId?: string; // Optional filter by restaurant
  isAdmin?: boolean; // Whether this is for admin/support use
}

export function BackupOrdersManager({
  restaurantId,
  isAdmin = false,
}: BackupOrdersManagerProps) {
  const [orders, setOrders] = useState<BackupOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<BackupOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<BackupOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    getBackupOrders,
    cleanupOldBackups,
    exportBackupOrders,
    updateOrderStatus,
    isFetching,
  } = useOrderBackup();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Loading orders for restaurant:", restaurantId);

      // Now getBackupOrders is async and fetches from Firebase
      const allOrders: BackupOrder[] = await getBackupOrders(restaurantId);

      console.log(
        `📦 Loaded ${allOrders.length} orders from Firebase/localStorage`
      );

      // Sort by creation date (newest first)
      allOrders.sort(
        (a, b) =>
          safeTimestampToDate(b.createdAt).getTime() -
          safeTimestampToDate(a.createdAt).getTime()
      );

      setOrders(allOrders);
    } catch (error) {
      console.error("Failed to load backup orders:", error);
      toast.error("Falha ao carregar pedidos de backup");
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order: BackupOrder) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.clientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order: BackupOrder) => order.status === statusFilter
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusIcon = (status: BackupOrder["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "processing":
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: BackupOrder["status"]) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "failed":
        return "Falhou";
      case "pending":
        return "Pendente";
      case "processing":
        return "Processando";
      default:
        return "Backup";
    }
  };

  const getStatusColor = (status: BackupOrder["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCleanup = async () => {
    try {
      await cleanupOldBackups();
      await loadOrders(); // Reload orders after cleanup
      toast.success("Backup antigos removidos com sucesso");
    } catch (error) {
      toast.error("Falha ao limpar backups antigos");
    }
  };

  const handleExport = async () => {
    try {
      await exportBackupOrders();
    } catch (error) {
      toast.error("Falha ao exportar pedidos de backup");
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: BackupOrder["status"]
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Reload orders after update
      toast.success(
        `Status do pedido atualizado para ${getStatusText(newStatus)}`
      );
    } catch (error) {
      toast.error("Falha ao atualizar status do pedido");
    }
  };

  const formatDate = (date: Date | string | any) => {
    const d = safeTimestampToDate(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const isLoadingData = isLoading || isFetching;

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Pedidos de Backup
            </h2>
            <p className="text-gray-600 mt-1">
              Sistema de backup para recuperação de pedidos
              {restaurantId && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Restaurant: {restaurantId.slice(-8)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCleanup}
              disabled={isLoadingData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Limpar Antigos
            </button>
            <button
              onClick={handleExport}
              disabled={isLoadingData}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2 inline" />
              Exportar
            </button>
            <button
              onClick={loadOrders}
              disabled={isLoadingData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 inline ${
                  isLoadingData ? "animate-spin" : ""
                }`}
              />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por ID, cliente ou item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isLoadingData}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={isLoadingData}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-6">
        {isLoadingData ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {isFetching
                ? "Buscando pedidos no Firebase..."
                : "Carregando pedidos..."}
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Não há pedidos de backup para exibir"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Exibindo {filteredOrders.length} de {orders.length} pedidos
            </div>
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(order.status)}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                        {order.confirmationCode && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            #{order.confirmationCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">ID:</span>
                        <span className="ml-2 font-mono text-gray-600">
                          {order.id.slice(-8)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Cliente:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {order.clientId
                            ? order.clientId.slice(-8)
                            : "Anônimo"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Total:
                        </span>
                        <span className="ml-2 font-semibold text-emerald-600">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Itens:</span>
                      <span className="ml-2">
                        {order.items.length} item(s) -{" "}
                        {order.items.map((item) => item.name).join(", ")}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      Criado em: {formatDate(order.createdAt)}
                      {order.isDelivery && (
                        <span className="ml-4">📍 {order.deliveryAddress}</span>
                      )}
                    </div>

                    {order.metadata?.backupReason && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium">Motivo:</span>
                        <span className="ml-2">
                          {order.metadata.backupReason}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isAdmin && order.status === "failed" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "pending")}
                        className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Marcar como pendente"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      Detalhes do Pedido
                    </h3>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">ID:</span>
                      <p className="font-mono text-gray-900">
                        {selectedOrder.id}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(selectedOrder.status)}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            selectedOrder.status
                          )}`}
                        >
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">Itens:</span>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Qtd: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-emerald-600">
                            {formatCurrency(item.finalPrice * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Total:</span>
                      <p className="text-xl font-bold text-emerald-600">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <p className="text-gray-900">
                        {selectedOrder.isDelivery ? "Entrega" : "Retirada"}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.deliveryAddress && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Endereço:
                      </span>
                      <p className="text-gray-900 mt-1">
                        {selectedOrder.deliveryAddress}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-gray-700">
                      Metadados:
                    </span>
                    <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedOrder.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
