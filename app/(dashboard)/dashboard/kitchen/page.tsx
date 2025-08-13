"use client";

import { useMemo } from "react";
import {
  useOrders,
  Order,
  OrderItem,
  AddonOption,
} from "@/lib/hooks/useOrders";
import { useMenu, MenuItem } from "@/lib/hooks/useMenu";
import {
  LoaderCircle,
  ChefHat,
  Clock,
  Truck,
  Store,
  User,
  Check,
  MessageSquare,
  Plus,
  Package,
  HelpCircle,
  Ban,
} from "lucide-react";
import { motion } from "framer-motion";
import TimeAgo from "react-timeago";
import ptBrStrings from "react-timeago/lib/language-strings/pt-br";
import buildFormatter from "react-timeago/lib/formatters/buildFormatter";
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";

const formatter = buildFormatter(ptBrStrings);

export default function KitchenPage() {
  const { orders, isLoading: isLoadingOrders, updateOrderStatus } = useOrders();
  const { menuItems, isLoading: isLoadingMenu } = useMenu();

  const kitchenOrders = useMemo(() => {
    return orders
      .filter((order) => order.status === "In Progress")
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  }, [orders]);

  if (isLoadingOrders || isLoadingMenu) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-slate-50">
        <div className="flex items-center gap-4 mb-8">
          <ChefHat className="w-8 h-8 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-800">Cozinha</h1>
        </div>

        {kitchenOrders.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <ChefHat className="mx-auto h-20 w-20 text-slate-300" />
              <h2 className="mt-4 text-2xl font-semibold text-slate-700">
                Nenhum pedido na cozinha
              </h2>
              <p className="mt-1 text-slate-500">
                Novos pedidos aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {kitchenOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  menuItems={menuItems}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </SubscriptionGuard>
  );
}

// --- CARD DE PEDIDO PARA A COZINHA ---
const KitchenOrderCard = ({
  order,
  onUpdateStatus,
  menuItems,
}: {
  order: Order;
  onUpdateStatus: (id: string, newStatus: Order["status"]) => void;
  menuItems: MenuItem[];
}) => {
  let nextAction;
  if (order.source === "waiter") {
    nextAction = {
      text: "Pronto para Servir",
      onClick: () => onUpdateStatus(order.id, "Ready to Serve"),
      color: "bg-green-500 hover:bg-green-600",
      icon: Check,
    };
  } else if (order.isDelivery) {
    nextAction = {
      text: "Pronto para Entrega",
      onClick: () => onUpdateStatus(order.id, "Ready for Delivery"),
      color: "bg-cyan-500 hover:bg-cyan-600",
      icon: Truck,
    };
  } else {
    nextAction = {
      text: "Pronto para Retirada",
      onClick: () => onUpdateStatus(order.id, "Ready for Pickup"),
      color: "bg-purple-500 hover:bg-purple-600",
      icon: Store,
    };
  }

  // Função segura para obter a data
  const getOrderDate = () => {
    try {
      if (order.createdAt && typeof order.createdAt.toDate === "function") {
        return order.createdAt.toDate();
      }
      // Fallback para timestamp atual se não conseguir converter
      return new Date();
    } catch (error) {
      console.error("Erro ao converter data do pedido:", error);
      return new Date();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-md border border-slate-200 p-4 flex flex-col h-full"
    >
      <div className="flex justify-between items-start">
        <p className="text-lg font-bold text-slate-800">
          {order.source === "waiter"
            ? `Mesa ${order.tableId}`
            : `Pedido #${order.id.substring(0, 6)}`}
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <TimeAgo date={getOrderDate()} formatter={formatter} />
        </p>
      </div>
      {order.source === "waiter" && (
        <div className="mt-1 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <User className="w-3 h-3" /> Pedido do Garçom
        </div>
      )}

      <div className="my-3 py-3 border-t border-b border-slate-100 space-y-3 text-sm text-slate-700 flex-grow">
        {order.items.map((item, index) => {
          const fullMenuItem = menuItems.find((mi) => mi.id === item.productId);
          return (
            <OrderItemDetailsResolver
              key={index}
              item={item}
              fullMenuItem={fullMenuItem}
              orderSource={order.source}
            />
          );
        })}
      </div>

      <div className="mt-auto">
        <button
          onClick={nextAction.onClick}
          className={`w-full flex items-center justify-center gap-2 py-3 px-3 text-sm font-semibold text-white rounded-lg shadow-sm transition ${nextAction.color}`}
        >
          <nextAction.icon className="w-4 h-4" />
          {nextAction.text}
        </button>
      </div>
    </motion.div>
  );
};

// --- COMPONENTE "RESOLVER" PARA EXIBIR OS DETALHES DE CADA ITEM ---
const OrderItemDetailsResolver = ({
  item,
  fullMenuItem,
  orderSource,
}: {
  item: OrderItem;
  fullMenuItem: MenuItem | undefined;
  orderSource?: string;
}) => {
  if (!fullMenuItem) {
    // ... (código para item não encontrado permanece o mesmo)
    return (
      <div className="border-l-2 border-red-300 pl-3 text-red-600">
        <div className="flex items-center gap-2">
          <span className="font-bold bg-red-100 px-2 py-0.5 rounded-full text-xs">
            {item.quantity}x
          </span>
          <span className="font-semibold">{item.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-2">
          <HelpCircle className="w-3 h-3" /> Item não encontrado no cardápio.
        </div>
      </div>
    );
  }

  // --- LÓGICA DE NORMALIZAÇÃO CORRIGIDA ---
  const options = item.options;

  // Normalização do Tamanho
  const sizeDetails =
    item.selectedSize ||
    (options?.size
      ? fullMenuItem.sizes?.find((s) => s.id === options.size)
      : undefined);

  // Normalização da Borda
  const crustDetails =
    item.selectedStuffedCrust ||
    (options?.stuffedCrust && fullMenuItem.stuffedCrust?.options
      ? fullMenuItem.stuffedCrust.options.find(
          (c) =>
            c.id === options.stuffedCrust || c.name === options.stuffedCrust
        )
      : undefined);

  // Normalização dos Adicionais
  const addonDetails =
    item.selectedAddons ||
    (options?.addons
      ? options.addons
          .map((addonId) => fullMenuItem.addons?.find((a) => a.id === addonId))
          .filter((a): a is AddonOption => !!a)
      : []);

  // Normalização dos Ingredientes Removidos
  const removedIngredients =
    item.removedIngredients || options?.removableIngredients || [];

  // Normalização das Observações
  const notes = item.notes || options?.notes;

  // Verifica se é um item padrão (sem customizações)
  const isStandard =
    !sizeDetails &&
    !crustDetails &&
    addonDetails.length === 0 &&
    removedIngredients.length === 0 &&
    !notes;

  return (
    <div className="border-l-2 border-emerald-200 pl-3">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
            {item.quantity}x
          </span>
          <span className="font-semibold text-slate-800">{item.name}</span>
          {orderSource === "waiter" && item.seat && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              P{item.seat}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5 ml-1">
        {isStandard ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
            <Check className="w-3 h-3" /> Padrão
          </span>
        ) : (
          <>
            {sizeDetails && (
              <div className="flex items-center gap-1.5 text-xs">
                <Package className="w-3 h-3 text-orange-500 flex-shrink-0" />
                <span className="text-orange-700 font-medium">
                  Tamanho: {sizeDetails.name}
                </span>
              </div>
            )}

            {crustDetails && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full border border-yellow-500 flex-shrink-0" />
                <span className="text-yellow-700 font-medium">
                  Borda: {crustDetails.name}
                </span>
              </div>
            )}

            {addonDetails.length > 0 && (
              <div className="text-xs">
                <span className="text-green-700 font-medium flex items-center gap-1.5">
                  <Plus className="w-3 h-3 text-green-500" /> Adicionar:
                </span>
                <span className="ml-4 text-green-600">
                  {addonDetails.map((a) => a.name).join(", ")}
                </span>
              </div>
            )}

            {removedIngredients.length > 0 && (
              <div className="text-xs">
                <span className="text-red-700 font-medium flex items-center gap-1.5">
                  <Ban className="w-3 h-3 text-red-500" /> Remover:
                </span>
                <span className="ml-4 text-red-600">
                  {removedIngredients.join(", ")}
                </span>
              </div>
            )}

            {notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-blue-700 mb-1">
                      Observações:
                    </div>
                    <div className="text-xs text-blue-800 leading-relaxed">
                      {notes}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
