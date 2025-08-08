"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LoaderCircle,
  Clock,
  ChefHat,
  ShoppingBag,
  CheckCircle,
  Truck,
  Store,
  Key,
} from "lucide-react";
import TimeAgo from "react-timeago";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  status:
    | "Pending"
    | "In Progress"
    | "Ready for Pickup"
    | "Out for Delivery"
    | "Completed"
    | "Returned"
    | "Canceled";
  createdAt: Timestamp;
  isDelivery: boolean;
  deliveryAddress?: string;
  confirmationCode?: string;
}

const statusConfig = {
  Pending: {
    icon: Clock,
    text: "Seu pedido foi recebido.",
    color: "text-amber-500",
    bgColor: "bg-amber-200/50",
  },
  "In Progress": {
    icon: ChefHat,
    text: "A cozinha está preparando seu pedido.",
    color: "text-blue-500",
    bgColor: "bg-blue-300/50",
  },
  "Ready for Pickup": {
    icon: ShoppingBag,
    text: "Seu pedido está pronto para retirada!",
    color: "text-purple-500",
    bgColor: "bg-purple-300/50",
  },
  "Out for Delivery": {
    icon: Truck,
    text: "Seu pedido saiu para entrega!",
    color: "text-indigo-500",
    bgColor: "bg-indigo-300/50",
  },
  Completed: {
    icon: CheckCircle,
    text: "Seu pedido foi concluído. Obrigado!",
    color: "text-green-500",
    bgColor: "bg-green-300/50",
  },
  Returned: {
    icon: CheckCircle,
    text: "O pedido foi devolvido.",
    color: "text-red-500",
    bgColor: "bg-red-300/50",
  },
  Canceled: {
    icon: CheckCircle,
    text: "Este pedido foi cancelado.",
    color: "text-slate-500",
    bgColor: "bg-slate-300/50",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string | undefined;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Nenhum ID de pedido fornecido.");
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          // Verifica e garante que createdAt é Timestamp
          if (!data.createdAt || !(data.createdAt instanceof Timestamp)) {
            setError("Dados do pedido inválidos.");
            setIsLoading(false);
            return;
          }
          setOrder({
            id: doc.id,
            status: data.status,
            createdAt: data.createdAt,
            isDelivery: data.isDelivery,
            deliveryAddress: data.deliveryAddress,
            confirmationCode: data.confirmationCode,
          });
        } else {
          setError("Desculpe, não conseguimos encontrar seu pedido.");
        }
        setIsLoading(false);
      },
      (err) => {
        setError("Ocorreu um erro ao rastrear seu pedido.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          key={orderId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className={`p-6 sm:p-10 rounded-2xl shadow-xl max-w-md w-full mx-auto ${
            order ? statusConfig[order.status].bgColor : "bg-white"
          }`}
        >
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 p-4 bg-red-50 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          {order && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-center gap-3 text-slate-600"
              >
                {order.isDelivery ? (
                  <Truck className="w-6 h-6 text-slate-600" />
                ) : (
                  <Store className="w-6 h-6 text-slate-600" />
                )}
                <span className="text-xl font-bold">
                  {order.isDelivery ? "Entrega" : "Retirada"}
                </span>
              </motion.div>

              {order.isDelivery && order.deliveryAddress && (
                <motion.p
                  variants={itemVariants}
                  className="text-sm text-slate-600 mt-3 font-bold text-center p-3 rounded-md"
                >
                  Para: {order.deliveryAddress}
                </motion.p>
              )}

              <motion.div variants={itemVariants} className="mt-8">
                <StatusDisplay status={order.status} />
              </motion.div>

              {order.isDelivery &&
                order.status === "Out for Delivery" &&
                order.confirmationCode &&
                (() => {
                  const config = statusConfig[order.status];
                  return (
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col items-center mt-6 border-1 border-white p-4 rounded-lg"
                    >
                      <p className="font-semibold text-slate-700 flex items-center justify-center gap-2">
                        <Key className="w-5 h-5 text-amber-500" />
                        Código de Confirmação
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Informe este código ao entregador.
                      </p>
                      <motion.p
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className={`text-4xl font-mono font-bold tracking-widest mt-2 ${config.color}`}
                      >
                        {order.confirmationCode}
                      </motion.p>
                    </motion.div>
                  );
                })()}

              <motion.p
                variants={itemVariants}
                className="text-xs mt-8 text-slate-500 text-center"
              >
                Feito <TimeAgo date={order.createdAt.toDate()} />.
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const StatusDisplay = ({ status }: { status: Order["status"] }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className={`w-24 h-24 rounded-full flex items-center justify-center ${config.bgColor}`}
        whileHover={{ scale: 1.05 }}
      >
        <Icon className={`w-12 h-12 ${config.color}`} />
      </motion.div>
      <motion.h2
        className={`mt-4 text-2xl font-bold ${config.color}`}
        initial={{ y: 10 }}
        animate={{ y: 0 }}
      >
        {status}
      </motion.h2>
      <motion.p
        className="text-slate-600 mt-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {config.text}
      </motion.p>
    </motion.div>
  );
};
