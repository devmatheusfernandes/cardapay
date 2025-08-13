// app/dashboard/orders/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useOrders, Order } from "../../../../lib/hooks/useOrders";
import { useDrivers, Driver } from "../../../../lib/hooks/useDrivers";
import {
  LoaderCircle,
  Clock,
  ChefHat,
  ShoppingBag,
  CheckCircle,
  Truck,
  MapPin,
  Store,
  ListFilter,
  UserCheck,
  XCircle,
  Undo2,
  CalendarDays,
  Send,
  AlertTriangle,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TimeAgo from "react-timeago";
import Modal from "@/app/components/ui/Modal";
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";
import { SectionContainer } from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";

const allOrderStatuses: Order["status"][] = [
  "Pending",
  "Confirmed",
  "In Progress",
  "Ready to Serve",
  "Ready for Delivery",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
  "Completed",
  "Returned",
  "Canceled",
];

const statusConfig = {
  Pending: { icon: Clock, color: "text-emerald-500", bg: "bg-emerald-100" },
  Confirmed: {
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-100",
  },
  "In Progress": { icon: ChefHat, color: "text-blue-500", bg: "bg-blue-100" },
  "Ready to Serve": {
    icon: Utensils,
    color: "text-amber-500",
    bg: "bg-amber-100",
  },
  "Ready for Delivery": {
    icon: Send,
    color: "text-orange-500",
    bg: "bg-orange-100",
  },
  "Ready for Pickup": {
    icon: ShoppingBag,
    color: "text-purple-500",
    bg: "bg-purple-100",
  },
  "Out for Delivery": {
    icon: Truck,
    color: "text-cyan-500",
    bg: "bg-cyan-100",
  },
  Delivered: {
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-100",
  },
  Completed: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
  Returned: { icon: Undo2, color: "text-red-500", bg: "bg-red-100" },
  Canceled: { icon: XCircle, color: "text-slate-500", bg: "bg-slate-100" },
};

type ViewFilter = "All" | "Delivery" | "Pickup";

export default function OrdersPage() {
  const { orders, isLoading, updateOrderStatus } = useOrders();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const [view, setView] = useState<ViewFilter>("All");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDayExpansion = (day: string) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(day)) {
      newSet.delete(day);
    } else {
      newSet.add(day);
    }
    setExpandedDays(newSet);
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => order.status !== "In Progress");
    if (view === "Delivery")
      result = result.filter((order) => order.isDelivery);
    if (view === "Pickup") result = result.filter((order) => !order.isDelivery);
    return result;
  }, [orders, view]);

  const ordersByDay = useMemo(() => {
    const daysMap = new Map<string, Order[]>();
    filteredOrders.forEach((order) => {
      const date = order.createdAt.toDate();
      const dayKey = date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!daysMap.has(dayKey)) {
        daysMap.set(dayKey, []);
      }
      daysMap.get(dayKey)?.push(order);
    });
    return Array.from(daysMap.entries()).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  }, [filteredOrders]);

  const displayedStatuses = useMemo(() => {
    let statuses = allOrderStatuses.filter((s) => s !== "In Progress");
    if (view === "Delivery")
      return statuses.filter(
        (s) => s !== "Ready for Pickup" && s !== "Ready to Serve"
      );
    if (view === "Pickup")
      return statuses.filter(
        (s) =>
          s !== "Out for Delivery" &&
          s !== "Ready for Delivery" &&
          s !== "Delivered"
      );
    return statuses;
  }, [view]);

  const handleOpenAssignModal = (order: Order) => {
    setOrderToAssign(order);
    setIsAssignModalOpen(true);
  };

  const handleAssignDriver = (driver: Driver) => {
    if (orderToAssign)
      updateOrderStatus(orderToAssign.id, "Out for Delivery", {
        driverId: driver.id,
        driverName: driver.name,
      });
    setIsAssignModalOpen(false);
    setOrderToAssign(null);
  };

  const handleOpenCancelModal = (order: Order) => {
    setOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) updateOrderStatus(orderToCancel.id, "Canceled");
    setIsCancelModalOpen(false);
    setOrderToCancel(null);
  };

  if (isLoading || driversLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <SectionContainer>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <PageHeader
            title="Gerenciamento de Pedidos"
            subtitle="Visualize e gerencie todos os seus pedidos em um só lugar."
          />
          <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-lg">
            <FilterButton
              label="Todos"
              isActive={view === "All"}
              onClick={() => setView("All")}
            />
            <FilterButton
              label="Entrega"
              icon={Truck}
              isActive={view === "Delivery"}
              onClick={() => setView("Delivery")}
            />
            <FilterButton
              label="Retirada"
              icon={Store}
              isActive={view === "Pickup"}
              onClick={() => setView("Pickup")}
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-20 w-20 text-slate-300" />
              <h2 className="mt-4 text-2xl font-semibold text-slate-700">
                Nenhum pedido encontrado
              </h2>
            </div>
          </div>
        ) : (
          <div className="flex-grow space-y-6 overflow-y-auto">
            {ordersByDay.map(([day, dayOrders]) => (
              <DaySection
                key={day}
                day={day}
                orders={dayOrders}
                displayedStatuses={displayedStatuses}
                isExpanded={expandedDays.has(day)}
                onToggleExpand={() => toggleDayExpansion(day)}
                onUpdateStatus={updateOrderStatus}
                onAssignDriverClick={handleOpenAssignModal}
                onCancelClick={handleOpenCancelModal}
              />
            ))}
          </div>
        )}

        <AssignDriverModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          drivers={drivers}
          onAssign={handleAssignDriver}
        />

        <CancelOrderModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleConfirmCancel}
          order={orderToCancel}
        />
      </SectionContainer>
    </SubscriptionGuard>
  );
}

const DaySection = ({
  day,
  orders,
  displayedStatuses,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onAssignDriverClick,
  onCancelClick,
}: {
  day: string;
  orders: Order[];
  displayedStatuses: Order["status"][];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: (id: string, newStatus: Order["status"]) => void;
  onAssignDriverClick: (order: Order) => void;
  onCancelClick: (order: Order) => void;
}) => (
  <div className="bg-emerald-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <button
      onClick={onToggleExpand}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-slate-400" />
        <h2 className="font-semibold text-slate-800">{day}</h2>
        <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {orders.length} pedido{orders.length !== 1 ? "s" : ""}
        </span>
      </div>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </motion.div>
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedStatuses.map((status) => {
              const statusOrders = orders.filter((o) => o.status === status);
              if (statusOrders.length === 0) return null;
              return (
                <OrderColumn
                  key={status}
                  status={status}
                  orders={statusOrders}
                  onUpdateStatus={onUpdateStatus}
                  onAssignDriverClick={onAssignDriverClick}
                  onCancelClick={onCancelClick}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FilterButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon?: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition ${
      isActive
        ? "bg-white shadow-sm text-slate-800"
        : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {" "}
    {Icon && <Icon className="w-5 h-5" />} {label}{" "}
  </button>
);

const OrderColumn = ({
  status,
  orders,
  onUpdateStatus,
  onAssignDriverClick,
  onCancelClick,
}: {
  status: Order["status"];
  orders: Order[];
  onUpdateStatus: (id: string, newStatus: Order["status"]) => void;
  onAssignDriverClick: (order: Order) => void;
  onCancelClick: (order: Order) => void;
}) => {
  const config = statusConfig[status];
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <config.icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <h2 className={`font-bold ${config.color}`}>{status}</h2>
        <span
          className={`ml-auto text-xs font-semibold ${config.color} ${config.bg} px-2 py-1 rounded-full`}
        >
          {orders.length}
        </span>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onUpdateStatus={onUpdateStatus}
            onAssignDriverClick={onAssignDriverClick}
            onCancelClick={onCancelClick}
          />
        ))}
      </div>
    </div>
  );
};

// OrderCard component with enhanced actions for all statuses
const OrderCard = ({
  order,
  onUpdateStatus,
  onAssignDriverClick,
  onCancelClick,
}: {
  order: Order;
  onUpdateStatus: (id: string, newStatus: Order["status"]) => void;
  onAssignDriverClick: (order: Order) => void;
  onCancelClick: (order: Order) => void;
}) => {
  let mainAction = null;
  let secondaryActions = [];

  if (order.status === "Pending") {
    mainAction = {
      text: "Confirmar Pedido",
      onClick: () => onUpdateStatus(order.id, "Confirmed"),
      color: "bg-emerald-500 hover:bg-emerald-600",
    };
    secondaryActions.push({
      text: "Cancelar",
      onClick: () => onCancelClick(order),
      color: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    });
  } else if (order.status === "Confirmed") {
    mainAction = {
      text: "Mandar para Cozinha",
      onClick: () => onUpdateStatus(order.id, "In Progress"),
      color: "bg-emerald-500 hover:bg-emerald-600",
    };
    secondaryActions.push({
      text: "Cancelar",
      onClick: () => onCancelClick(order),
      color: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    });
  } else if (order.status === "Ready to Serve" && !order.isDelivery) {
    mainAction = {
      text: "Marcar como Pronto p/ Retirada",
      onClick: () => onUpdateStatus(order.id, "Ready for Pickup"),
      color: "bg-purple-500 hover:bg-purple-600",
    };
  } else if (order.status === "Ready to Serve" && order.isDelivery) {
    mainAction = {
      text: "Marcar como Pronto p/ Entrega",
      onClick: () => onUpdateStatus(order.id, "Ready for Delivery"),
      color: "bg-orange-500 hover:bg-orange-600",
    };
  } else if (order.status === "Ready for Delivery") {
    mainAction = {
      text: "Atribuir Entrega",
      onClick: () => onAssignDriverClick(order),
      color: "bg-cyan-500 hover:bg-cyan-600",
    };
  } else if (order.status === "Ready for Pickup") {
    mainAction = {
      text: "Concluir Pedido",
      onClick: () => onUpdateStatus(order.id, "Completed"),
      color: "bg-green-500 hover:bg-green-600",
    };
  } else if (order.status === "Out for Delivery") {
    secondaryActions.push(
      {
        text: "Marcar como Entregue",
        onClick: () => onUpdateStatus(order.id, "Delivered"),
        color: "bg-emerald-500 hover:bg-emerald-600 text-white",
      },
      {
        text: "Marcar como Devolvido",
        onClick: () => onUpdateStatus(order.id, "Returned"),
        color: "bg-red-50 hover:bg-red-100 text-red-700",
      },
      {
        text: "Cancelar Pedido",
        onClick: () => onCancelClick(order),
        color: "bg-slate-100 hover:bg-slate-200 text-slate-700",
      }
    );
  } else if (order.status === "Delivered") {
    mainAction = {
      text: "Concluir Pedido",
      onClick: () => onUpdateStatus(order.id, "Completed"),
      color: "bg-green-500 hover:bg-green-600",
    };
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-xs border border-slate-200 p-3 hover:shadow-sm transition-shadow"
    >
      <div className="flex justify-between items-start">
        <p className="text-sm font-bold text-slate-800">
          Pedido #{order.id.substring(0, 6)}
        </p>
        <p className="text-xs text-slate-500">
          {" "}
          <TimeAgo date={order.createdAt.toDate()} />{" "}
        </p>
      </div>
      <div
        className={`mt-2 flex items-center gap-2 text-xs font-semibold ${
          order.isDelivery ? "text-blue-600" : "text-purple-600"
        }`}
      >
        {order.isDelivery ? (
          <Truck className="w-3.5 h-3.5" />
        ) : (
          <Store className="w-3.5 h-3.5" />
        )}
        <span>{order.isDelivery ? "Entrega" : "Retirada"}</span>
      </div>
      {order.isDelivery && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700 text-xs flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{" "}
          {order.deliveryAddress}
        </div>
      )}
      {order.assignedDriverName && (
        <div className="mt-2 text-xs text-slate-500 font-semibold flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-green-600" />
          <span>Atribuído a: {order.assignedDriverName}</span>
        </div>
      )}
      <ul className="mt-3 space-y-1 text-sm text-slate-600 border-t border-b border-slate-100 py-2">
        {order.items.map((item, index) => (
          <li key={index} className="flex justify-between">
            <span className="truncate max-w-[180px]">
              {" "}
              {item.quantity}x {item.name}{" "}
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-right font-bold text-slate-800">
        {" "}
        Total: ${order.totalAmount.toFixed(2)}{" "}
      </p>

      <div className="mt-3 space-y-2">
        {mainAction && (
          <button
            onClick={mainAction.onClick}
            className={`w-full py-1.5 px-3 text-xs font-semibold text-white rounded-md shadow-sm transition ${mainAction.color}`}
          >
            {mainAction.text}
          </button>
        )}
        {secondaryActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`w-full py-1.5 px-3 text-xs font-semibold rounded-md transition ${action.color}`}
          >
            {action.text}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const AssignDriverModal = ({
  isOpen,
  onClose,
  drivers,
  onAssign,
}: {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  onAssign: (driver: Driver) => void;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Atribuir Entregador">
    {" "}
    {drivers.length === 0 ? (
      <p className="text-slate-500">Você não tem entregadores cadastrados.</p>
    ) : (
      <ul className="space-y-2">
        {" "}
        {drivers.map((driver) => (
          <li key={driver.id}>
            {" "}
            <button
              onClick={() => onAssign(driver)}
              className="w-full text-left p-3 rounded-lg hover:bg-slate-100 transition flex items-center gap-3"
            >
              {" "}
              <div className="bg-blue-100 p-2 rounded-full">
                {" "}
                <Truck className="w-4 h-4 text-blue-600" />{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="font-semibold text-slate-800">
                  {driver.name}
                </p>{" "}
                <p className="text-xs text-slate-500">{driver.phone}</p>{" "}
              </div>{" "}
            </button>{" "}
          </li>
        ))}{" "}
      </ul>
    )}{" "}
  </Modal>
);

const CancelOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: Order | null;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Cancelar Pedido">
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>
      <div className="mt-3 text-center sm:mt-5">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Confirmar cancelamento
        </h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Você tem certeza que deseja cancelar o pedido #
            {order?.id.substring(0, 6)}? Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>
    </div>
    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
      <button
        type="button"
        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:col-start-2 sm:text-sm"
        onClick={onConfirm}
      >
        Confirmar Cancelamento
      </button>
      <button
        type="button"
        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm"
        onClick={onClose}
      >
        Voltar
      </button>
    </div>
  </Modal>
);
