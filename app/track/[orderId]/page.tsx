"use client";

import React, { useState, useEffect } from "react";
import {
  doc,
  onSnapshot,
  Timestamp,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Clock,
  ChefHat,
  ShoppingBag,
  CheckCircle,
  Truck,
  Store,
  Key,
  ChevronLeft,
  MapPin,
  Utensils,
  Send,
  Star,
  Check,
  Eye,
  AlertCircle,
  MessageCircle,
  RefreshCw,
  X,
  CreditCard,
  Phone,
  Mail,
  ExternalLink,
  ReceiptText,
} from "lucide-react";
import TimeAgo from "react-timeago";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import OrderDetailsModal from "@/app/components/track/OrderDetailsModal";
import { Order } from "@/lib/types/track/order";
import { MenuItem } from "@/lib/hooks/useMenu";

const BackButton = () => (
  <Link
    href="/track"
    className="absolute top-4 left-4 md:top-6 md:left-6 cursor-pointer z-10"
  >
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer flex items-center gap-1 text-slate-600 hover:text-emerald-600 transition-colors"
    >
      <ChevronLeft className="w-8 h-8" />
      <span className="text-md font-medium">Voltar</span>
    </motion.button>
  </Link>
);

interface FailedPayment {
  id: string;
  sessionId: string;
  paymentIntentId: string;
  amountTotal: number;
  metadata: any;
  error: string;
  status: string;
  createdAt: Timestamp;
  needsManualProcessing: boolean;
}

interface Restaurant {
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
}

const statusConfig = {
  Pending: {
    icon: Clock,
    text: "Seu pedido foi recebido.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-200/50",
  },
  Confirmed: {
    icon: Check,
    text: "O restaurante confirmou seu pedido.",
    color: "text-amber-600",
    bgColor: "bg-amber-200/50",
  },
  "In Progress": {
    icon: ChefHat,
    text: "A cozinha está preparando seu pedido.",
    color: "text-blue-500",
    bgColor: "bg-blue-300/50",
  },
  "Ready for Delivery": {
    icon: Send,
    text: "Seu pedido está pronto e aguardando o entregador.",
    color: "text-orange-500",
    bgColor: "bg-orange-200/50",
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
    color: "text-cyan-500",
    bgColor: "bg-cyan-300/50",
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

const statusTranslations = {
  Pending: "Pendente",
  Confirmed: "Confirmado",
  "In Progress": "Em Preparo",
  "Ready for Delivery": "Pronto para Entrega",
  "Ready for Pickup": "Pronto para Retirada",
  "Out for Delivery": "Saiu para Entrega",
  Completed: "Concluído",
  Returned: "Devolvido",
  Canceled: "Cancelado",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string | undefined;
  const [order, setOrder] = useState<Order | null>(null);
  const [failedPayment, setFailedPayment] = useState<FailedPayment | null>(
    null
  );
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const loadMenuItems = async (restaurantId: string) => {
    if (!restaurantId) return;
    try {
      const q = query(
        collection(db, "menuItems"),
        where("ownerId", "==", restaurantId)
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as MenuItem)
      );
      setMenuItems(items);
    } catch (error) {
      console.error("Erro ao buscar itens do cardápio:", error);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setError("Nenhum ID de pedido fornecido.");
      setIsLoading(false);
      return;
    }

    // Primeiro, tenta encontrar o pedido na coleção orders
    const orderDocRef = doc(db, "orders", orderId);

    const unsubscribeOrder = onSnapshot(
      orderDocRef,
      async (orderDoc) => {
        // DENTRO DO onSnapshot...
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();

          // 1. Validação mais robusta que aceita os dois formatos de timestamp
          const isValidTimestamp =
            orderData.createdAt &&
            (orderData.createdAt instanceof Timestamp ||
              typeof orderData.createdAt._seconds === "number");

          if (!isValidTimestamp || !orderData.restaurantId) {
            setError("Dados do pedido inválidos ou incompletos.");
            setIsLoading(false);
            return;
          }

          // 2. Garante que 'createdAt' seja um objeto Timestamp antes de salvar no estado
          // Isso evita erros futuros em locais que usam .toDate()
          const finalCreatedAt =
            orderData.createdAt instanceof Timestamp
              ? orderData.createdAt
              : new Timestamp(
                  orderData.createdAt._seconds,
                  orderData.createdAt._nanoseconds
                );

          const typedOrderData: Order = {
            id: orderDoc.id,
            ...orderData,
            createdAt: finalCreatedAt, // Usamos o timestamp normalizado
          } as Order;

          setOrder(typedOrderData);
          setFailedPayment(null);

          if (typedOrderData.restaurantId) {
            await loadMenuItems(typedOrderData.restaurantId);
          }

          if (!restaurant && typedOrderData.restaurantId) {
            await loadRestaurantData(typedOrderData.restaurantId);
          }
          setIsLoading(false);
        } else {
          // Pedido não encontrado na coleção orders, verifica failed_payments
          await checkFailedPayments();
        }
      },
      (err) => {
        console.error("Firebase snapshot error:", err);
        // Se erro no orders, ainda tenta verificar failed_payments
        checkFailedPayments();
      }
    );

    return () => unsubscribeOrder();
  }, [orderId, restaurant]);

  const checkFailedPayments = async () => {
    if (!orderId) return;

    try {
      const failedPaymentDoc = await getDoc(
        doc(db, "failed_payments", orderId)
      );

      // Corrigido
      if (failedPaymentDoc.exists()) {
        // Use Omit para informar que os dados do Firestore não incluem o 'id'
        const failedPaymentData = failedPaymentDoc.data() as Omit<
          FailedPayment,
          "id"
        >;

        setFailedPayment({
          id: failedPaymentDoc.id, // Agora você adiciona o id que veio de fora
          ...failedPaymentData, // E espalha o resto dos dados, que não têm 'id'
        });

        setOrder(null); // Limpa order se failed payment foi encontrado

        // Carrega dados do restaurante se disponível
        if (failedPaymentData.metadata?.restaurantId) {
          await loadRestaurantData(failedPaymentData.metadata.restaurantId);
        }
      } else {
        setError("Desculpe, não conseguimos encontrar seu pedido.");
      }
    } catch (err) {
      console.error("Error checking failed payments:", err);
      setError("Ocorreu um erro ao rastrear seu pedido.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRestaurantData = async (restaurantId: string) => {
    try {
      const restaurantRef = doc(db, "restaurants", restaurantId);
      const restaurantDoc = await getDoc(restaurantRef);
      if (restaurantDoc.exists()) {
        setRestaurant(restaurantDoc.data() as Restaurant);
      }
    } catch (e) {
      console.error("Erro ao buscar dados do restaurante:", e);
    }
  };

  const handleOpenRating = async () => {
    if (!order) return;

    if (order.isReviewed) {
      const toastId = toast.loading("Carregando sua avaliação...");
      try {
        const q = query(
          collection(db, "reviews"),
          where("orderId", "==", order.id),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const reviewDoc = querySnapshot.docs[0];
          setExistingReview({
            id: reviewDoc.id,
            ...reviewDoc.data(),
          } as Review);
        }
        toast.dismiss(toastId);
      } catch (error) {
        toast.error("Não foi possível carregar sua avaliação anterior.", {
          id: toastId,
        });
      }
    } else {
      setExistingReview(null);
    }
    setIsFlipped(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!order || !order.restaurantId) {
      toast.error("Não foi possível identificar o pedido ou restaurante.");
      return;
    }

    const reviewData = {
      restaurantId: order.restaurantId,
      orderId: order.id,
      rating,
      comment,
      createdAt: serverTimestamp(),
    };

    if (existingReview) {
      const toastId = toast.loading("Atualizando sua avaliação...");
      try {
        const reviewRef = doc(db, "reviews", existingReview.id);
        await updateDoc(reviewRef, reviewData);
        toast.success("Avaliação atualizada!", { id: toastId });
        setIsFlipped(false);
      } catch (err) {
        console.error("Erro ao atualizar avaliação:", err);
        toast.error("Ocorreu um erro. Tente novamente.", { id: toastId });
      }
    } else {
      const toastId = toast.loading("Enviando sua avaliação...");
      try {
        await addDoc(collection(db, "reviews"), reviewData);
        // Também atualiza o pedido para marcar como avaliado
        await updateDoc(doc(db, "orders", order.id), { isReviewed: true });
        toast.success("Obrigado pela sua avaliação!", { id: toastId });
        setIsFlipped(false);
      } catch (err) {
        console.error("Erro ao enviar avaliação:", err);
        toast.error("Ocorreu um erro. Tente novamente.", { id: toastId });
      }
    }
  };

  const handleContactSupport = (method: "whatsapp" | "phone" | "email") => {
    const restaurantInfo = restaurant?.name || "o restaurante";
    const amount = failedPayment
      ? (failedPayment.amountTotal / 100).toFixed(2)
      : "N/A";
    const paymentId = failedPayment?.paymentIntentId || orderId;

    const message = `Olá! Preciso de ajuda com meu pedido.
    
Detalhes:
- Pedido: ${orderId}
- Restaurante: ${restaurantInfo}
- Valor: R$ ${amount}
- Pagamento ID: ${paymentId}
- Problema: Pagamento processado mas pedido não registrado

Por favor, me ajudem a resolver esta situação.`;

    switch (method) {
      case "whatsapp":
        const whatsappNumber = restaurant?.phone || "5511999999999"; // Fallback number
        const encodedMessage = encodeURIComponent(message);
        window.open(
          `https://wa.me/${whatsappNumber}?text=${encodedMessage}`,
          "_blank"
        );
        break;
      case "phone":
        if (restaurant?.phone) {
          window.open(`tel:${restaurant.phone}`);
        }
        break;
      case "email":
        if (restaurant?.email) {
          const encodedSubject = encodeURIComponent(
            `Problema com pedido ${orderId}`
          );
          const encodedBody = encodeURIComponent(message);
          window.open(
            `mailto:${restaurant.email}?subject=${encodedSubject}&body=${encodedBody}`
          );
        }
        break;
    }
  };

  // ==========================================================
  // Componentes Internos Adicionados
  // ==========================================================

  const StatusDisplay = ({ status }: { status: Order["status"] }) => {
    const config = statusConfig[status];
    if (!config) return null;

    const { icon: Icon, text, color } = config;
    const translatedStatus = statusTranslations[status] || status;

    return (
      <div className="flex flex-col items-center">
        <motion.div
          key={status} // Chave para re-animar na mudança de status
          className={`w-24 h-24 rounded-full flex items-center justify-center ${statusConfig[status].bgColor}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Icon className={`w-12 h-12 ${color}`} />
        </motion.div>
        <motion.h2
          key={`${status}-h2`}
          className={`mt-4 text-2xl font-bold ${color}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {translatedStatus}
        </motion.h2>
        <motion.p
          key={`${status}-p`}
          className="text-slate-600 mt-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      </div>
    );
  };

  const ReviewForm = ({
    onSubmit,
    onCancel,
    existingReview,
    restaurantName,
  }: {
    onSubmit: (rating: number, comment: string) => void;
    onCancel: () => void;
    existingReview: Review | null;
    restaurantName: string;
  }) => {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || "");
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (rating === 0) {
        toast.error("Por favor, selecione uma avaliação de estrelas.");
        return;
      }
      onSubmit(rating, comment);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-6 sm:p-8 rounded-2xl flex flex-col h-full bg-white shadow-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">
            {existingReview ? "Editar Avaliação" : "Avalie sua Experiência"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Sua opinião sobre{" "}
          <span className="font-semibold">{restaurantName}</span> é muito
          importante!
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="mb-6">
            <p className="text-md font-medium text-slate-700 mb-3 text-center">
              Sua nota
            </p>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  whileHover={{ scale: 1.2, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star
                    className={`w-8 h-8 cursor-pointer transition-colors ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300"
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
          <div className="mb-6 flex-grow flex flex-col">
            <label
              htmlFor="comment"
              className="block text-md font-medium text-slate-700 mb-2"
            >
              Seu comentário (opcional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva sua experiência..."
              className="w-full flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
              rows={5}
            ></textarea>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed"
              disabled={rating === 0}
            >
              {existingReview ? "Atualizar" : "Enviar"} Avaliação
            </button>
          </div>
        </form>
      </motion.div>
    );
  };

  // ==========================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const finalStatuses: Order["status"][] = [
    "Completed",
    "Canceled",
    "Returned",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
      <BackButton />
      {order && (
        <button
          onClick={() => setIsDetailsModalOpen(true)}
          className="fixed top-4 right-4 z-30 flex items-center justify-center rounded-full bg-white/80 py-2 px-2 shadow-xs backdrop-blur-sm transition-all hover:shadow-lg hover:bg-white md:px-4"
          aria-label="Ver detalhes do pedido"
        >
          {/* O texto "Detalhes" só aparece em telas médias (md) ou maiores */}
          <span className="hidden font-medium text-slate-700 md:inline">
            Detalhes
          </span>

          {/* Ícone, com uma pequena margem à esquerda quando o texto estiver visível */}
          <ReceiptText className="h-6 w-6 text-emerald-600 md:ml-2" />
        </button>
      )}

      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={order}
        menuItems={menuItems}
      />

      <div
        className="max-w-md w-full mx-auto"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{
            transformStyle: "preserve-3d",
            minHeight: "500px",
          }}
          className="relative w-full"
        >
          {/* Lado da Frente - Rastreamento */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              className={`h-full p-6 sm:p-10 rounded-2xl flex flex-col shadow-xl ${
                order && statusConfig[order.status]
                  ? statusConfig[order.status].bgColor
                  : failedPayment
                  ? "bg-amber-50"
                  : "bg-white"
              }`}
            >
              {/* Exibição de Pagamento com Falha */}
              {failedPayment && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col h-full"
                >
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-center gap-3 text-amber-600"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xl font-bold">
                      Pagamento Processado
                    </span>
                  </motion.div>

                  {restaurant && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-center gap-2 mt-4 text-slate-700 bg-black/5 p-2 rounded-md"
                    >
                      <Utensils className="w-5 h-5 flex-shrink-0" />
                      <p className="font-semibold text-center">
                        {restaurant.name}
                      </p>
                    </motion.div>
                  )}

                  <motion.div
                    variants={itemVariants}
                    className="mt-8 flex-grow flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center">
                      <motion.div
                        className="w-24 h-24 rounded-full flex items-center justify-center bg-amber-200/50"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Clock className="w-12 h-12 text-amber-600" />
                      </motion.div>
                      <motion.h2
                        className="mt-4 text-2xl font-bold text-amber-600"
                        initial={{ y: 10 }}
                        animate={{ y: 0 }}
                      >
                        Processando Pedido
                      </motion.h2>
                      <motion.p
                        className="text-slate-600 mt-2 text-center max-w-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Seu pagamento foi aprovado! Estamos finalizando o
                        registro do seu pedido.
                      </motion.p>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="mt-6 p-4 bg-white/60 rounded-lg border border-amber-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-600">
                        Valor Pago:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        R$ {(failedPayment.amountTotal / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-600">
                        ID do Pagamento:
                      </span>
                      <span className="text-sm font-mono text-slate-500">
                        {failedPayment.paymentIntentId?.slice(-8) || "N/A"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 text-center">
                      Processado{" "}
                      <TimeAgo date={failedPayment.createdAt.toDate()} />
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <p className="text-sm text-blue-700 mb-3 font-medium">
                      🔔 O que está acontecendo?
                    </p>
                    <p className="text-xs text-blue-600 mb-4">
                      Houve um pequeno atraso no registro do pedido. Nossa
                      equipe já foi notificada e está trabalhando para
                      processá-lo manualmente.
                    </p>
                    <div className="text-xs text-blue-500">
                      Tempo estimado: 5-15 minutos
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="mt-auto pt-4">
                    <p className="text-sm font-medium text-slate-700 text-center mb-3">
                      Precisa de ajuda? Entre em contato:
                    </p>
                    <div className="flex justify-center space-x-2">
                      {restaurant?.phone && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleContactSupport("whatsapp")}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </motion.button>
                      )}
                      {restaurant?.phone && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleContactSupport("phone")}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Ligar
                        </motion.button>
                      )}
                      {restaurant?.email && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleContactSupport("email")}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </motion.button>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.reload()}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Atualizar Status
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* Exibição de Erro Regular */}
              {error && !failedPayment && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="m-auto flex flex-col items-center justify-center text-center p-6 bg-red-50 border border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    Ops! Algo deu errado
                  </h3>
                  <p className="text-sm text-red-700 mb-6">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.reload()}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tentar novamente
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleContactSupport("whatsapp")}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Pedir ajuda
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Exibição de Pedido Regular */}
              {order && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col h-full"
                >
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-center gap-3 text-slate-600"
                  >
                    {order.isDelivery ? (
                      <Truck className="w-6 h-6" />
                    ) : (
                      <Store className="w-6 h-6" />
                    )}
                    <span className="text-xl font-bold">
                      {order.isDelivery ? "Entrega" : "Retirada"}
                    </span>
                  </motion.div>

                  {restaurant && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-center gap-2 mt-4 text-slate-700 bg-black/5 p-2 rounded-md"
                    >
                      <Utensils className="w-5 h-5 flex-shrink-0" />
                      <p className="font-semibold text-center">
                        {restaurant.name}
                      </p>
                    </motion.div>
                  )}

                  {order.isDelivery && order.deliveryAddress && (
                    <motion.p
                      variants={itemVariants}
                      className="text-sm text-slate-600 mt-3 font-bold text-center p-3 rounded-md"
                    >
                      Para: {order.deliveryAddress}
                    </motion.p>
                  )}

                  <motion.div
                    variants={itemVariants}
                    className="mt-8 flex-grow flex items-center justify-center"
                  >
                    <StatusDisplay status={order.status} />
                  </motion.div>

                  {order.status === "Ready for Pickup" &&
                    restaurant?.address && (
                      <motion.div
                        variants={itemVariants}
                        className="mt-6 p-4 bg-white/60 rounded-lg text-center shadow"
                      >
                        <p className="font-semibold text-slate-700 flex items-center justify-center gap-2">
                          <MapPin className="w-5 h-5 text-purple-500" />{" "}
                          Endereço para Retirada
                        </p>
                        <p className="text-slate-600 mt-1 font-medium">
                          {restaurant.address}
                        </p>
                      </motion.div>
                    )}

                  {order.isDelivery &&
                    order.status === "Out for Delivery" &&
                    order.confirmationCode && (
                      <motion.div
                        variants={itemVariants}
                        className="flex flex-col items-center mt-6 p-4 rounded-lg"
                      >
                        <p className="font-semibold text-slate-700 flex items-center justify-center gap-2">
                          <Key className="w-5 h-5 text-emerald-500" /> Código de
                          Confirmação
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Informe este código ao entregador.
                        </p>
                        <motion.p
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className={`text-4xl font-mono font-bold tracking-widest mt-2 ${
                            statusConfig[order.status].color
                          }`}
                        >
                          {order.confirmationCode}
                        </motion.p>
                      </motion.div>
                    )}

                  <motion.p
                    variants={itemVariants}
                    className="text-xs mt-auto pt-6 text-slate-500 text-center"
                  >
                    Feito <TimeAgo date={order.createdAt.toDate()} />.
                  </motion.p>

                  {finalStatuses.includes(order.status) && (
                    <motion.div
                      variants={itemVariants}
                      className="mt-4 text-center"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenRating}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <Star className="w-4 h-4" />
                        {order.isReviewed
                          ? "Editar sua avaliação"
                          : "Deixar uma avaliação"}
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <ReviewForm
              onSubmit={handleReviewSubmit}
              onCancel={() => setIsFlipped(false)}
              existingReview={existingReview}
              restaurantName={restaurant?.name || "o restaurante"}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
