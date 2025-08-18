"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeTimestampToDate } from "@/lib/utils/timestamp";
import {
  LoaderCircle,
  CheckCircle,
  Clock,
  ChefHat,
  ShoppingBag,
  Truck,
  Copy,
} from "lucide-react";
import { toast } from "react-hot-toast";
import TimeAgo from "react-timeago";
import { useRouter } from "next/navigation";

interface OrderListItemProps {
  orderId: string;
}

interface OrderData {
  status: string;
  restaurantId: string;
  createdAt: Date;
}

interface RestaurantData {
  name: string;
}

const statusConfig: {
  [key: string]: { icon: React.ElementType; color: string };
} = {
  Pending: { icon: Clock, color: "text-amber-500" },
  "In Progress": { icon: ChefHat, color: "text-blue-500" },
  "Ready for Pickup": { icon: ShoppingBag, color: "text-purple-500" },
  "Out for Delivery": { icon: Truck, color: "text-cyan-500" },
  Completed: { icon: CheckCircle, color: "text-green-500" },
  Canceled: { icon: CheckCircle, color: "text-slate-500" },
  Returned: { icon: CheckCircle, color: "text-red-500" },
};

export default function OrderListItem({ orderId }: OrderListItemProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const orderRef = doc(db, "orders", orderId);
    const unsubscribeOrder = onSnapshot(orderRef, async (orderDoc) => {
      if (orderDoc.exists()) {
        const orderData = orderDoc.data(); // Pega os dados brutos

        // Verifica se createdAt precisa ser convertido e o converte
        if (orderData.createdAt) {
          orderData.createdAt = safeTimestampToDate(orderData.createdAt);
        }

        // Agora, orderData.createdAt é um objeto Date garantido
        setOrder(orderData as OrderData);

        // O resto do código continua igual
        const restaurantRef = doc(db, "restaurants", orderData.restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);
        if (restaurantDoc.exists()) {
          setRestaurant(restaurantDoc.data() as RestaurantData);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribeOrder();
  }, [orderId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(orderId);
    setIsCopied(true);
    toast.success("ID do pedido copiado!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão ative o link do card
    copyToClipboard();
  };

  if (isLoading) {
    return (
      <li className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-center h-24">
        <LoaderCircle className="w-6 h-6 text-slate-400 animate-spin" />
      </li>
    );
  }

  if (!order || !restaurant) {
    return null;
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusColor = statusConfig[order.status]?.color || "text-slate-500";

  return (
    <li
      key={orderId}
      onClick={() => router.push(`/track/${orderId}`)}
      className="bg-white rounded-xl shadow-sm transition-all hover:shadow-md relative cursor-pointer"
    >
      {/* Link que cobre todo o card */}

      {/* Conteúdo do card */}
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 text-lg">
              {restaurant.name}
            </p>
            <p className="text-sm text-slate-500">
              Pedido{" "}
              <span className="font-mono">{orderId.substring(0, 12)}...</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Feito <TimeAgo date={order.createdAt} />
            </p>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center justify-end gap-2 font-semibold ${statusColor}`}
            >
              <StatusIcon className="w-5 h-5" />
              <span>{order.status}</span>
            </div>
            <button
              onClick={handleCopyClick}
              className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
            >
              {isCopied ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {isCopied ? "Copiado!" : "Copiar ID"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
