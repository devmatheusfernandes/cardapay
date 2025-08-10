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
    limit
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
  Eye,
} from "lucide-react";
import TimeAgo from "react-timeago";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const BackButton = () => (
  <Link href="/" className="absolute top-4 left-4 md:top-6 md:left-6 cursor-pointer z-10">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <ChevronLeft className="w-8 h-8" />
      <span className="text-md font-medium">Voltar</span>
    </motion.button>
  </Link>
);

interface Order {
  id: string;
  status:
    | "Pending"
    | "In Progress"
    | "Ready for Delivery"
    | "Ready for Pickup"
    | "Out for Delivery"
    | "Completed"
    | "Returned"
    | "Canceled";
  createdAt: Timestamp;
  isDelivery: boolean;
  restaurantId: string;
  deliveryAddress?: string;
  confirmationCode?: string;
  isReviewed?: boolean; 
}

interface Restaurant {
  name: string;
  address: string;
}

interface Review {
    id: string;
    rating: number;
    comment: string;
}

const statusConfig = {
  Pending: { icon: Clock, text: "Seu pedido foi recebido.", color: "text-indigo-500", bgColor: "bg-indigo-200/50" },
  "In Progress": { icon: ChefHat, text: "A cozinha está preparando seu pedido.", color: "text-blue-500", bgColor: "bg-blue-300/50" },
  "Ready for Delivery": { icon: Send, text: "Seu pedido está pronto e aguardando o entregador.", color: "text-orange-500", bgColor: "bg-orange-200/50" },
  "Ready for Pickup": { icon: ShoppingBag, text: "Seu pedido está pronto para retirada!", color: "text-purple-500", bgColor: "bg-purple-300/50" },
  "Out for Delivery": { icon: Truck, text: "Seu pedido saiu para entrega!", color: "text-cyan-500", bgColor: "bg-cyan-300/50" },
  Completed: { icon: CheckCircle, text: "Seu pedido foi concluído. Obrigado!", color: "text-green-500", bgColor: "bg-green-300/50" },
  Returned: { icon: CheckCircle, text: "O pedido foi devolvido.", color: "text-red-500", bgColor: "bg-red-300/50" },
  Canceled: { icon: CheckCircle, text: "Este pedido foi cancelado.", color: "text-slate-500", bgColor: "bg-slate-300/50" },
};

const statusTranslations = {
  Pending: "Pendente",
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
  visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string | undefined;
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Nenhum ID de pedido fornecido.");
      setIsLoading(false);
      return;
    }
    const docRef = doc(db, "orders", orderId);
    const unsubscribe = onSnapshot(docRef, async (orderDoc) => {
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          if (!orderData.createdAt || !(orderData.createdAt instanceof Timestamp) || !orderData.restaurantId) {
            setError("Dados do pedido inválidos ou incompletos."); setIsLoading(false); return;
          }
          const typedOrderData: Order = { id: orderDoc.id, ...orderData } as Order;
          setOrder(typedOrderData);
          if (!restaurant && typedOrderData.restaurantId) {
            try {
              const restaurantRef = doc(db, "restaurants", typedOrderData.restaurantId);
              const restaurantDoc = await getDoc(restaurantRef);
              if (restaurantDoc.exists()) setRestaurant(restaurantDoc.data() as Restaurant);
            } catch (e) {
              console.error("Erro ao buscar dados do restaurante:", e); setError("Não foi possível carregar os dados do restaurante.");
            }
          }
        } else {
          setError("Desculpe, não conseguimos encontrar seu pedido.");
        }
        setIsLoading(false);
      }, (err) => {
        console.error("Firebase snapshot error:", err); setError("Ocorreu um erro ao rastrear seu pedido."); setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [orderId, restaurant]);

  const handleOpenRating = async () => {
    if (!order) return;

    if (order.isReviewed) {
        const toastId = toast.loading("Carregando sua avaliação...");
        try {
            const q = query(collection(db, "reviews"), where("orderId", "==", order.id), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const reviewDoc = querySnapshot.docs[0];
                setExistingReview({ id: reviewDoc.id, ...reviewDoc.data() } as Review);
            }
            toast.dismiss(toastId);
        } catch (error) {
            toast.error("Não foi possível carregar sua avaliação anterior.", { id: toastId });
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
        const reviewRef = doc(db, 'reviews', existingReview.id);
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
        await addDoc(collection(db, 'reviews'), reviewData);
        toast.success("Obrigado pela sua avaliação!", { id: toastId });
        setIsFlipped(false);
      } catch (err) {
        console.error("Erro ao enviar avaliação:", err);
        toast.error("Ocorreu um erro. Tente novamente.", { id: toastId });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full"/>
      </div>
    );
  }

  const finalStatuses: Order['status'][] = ['Completed', 'Canceled', 'Returned'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
      <BackButton />
      <div className="max-w-md w-full mx-auto" style={{ perspective: "1000px" }}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          style={{ 
            transformStyle: "preserve-3d",
            minHeight: "500px"
          }}
          className="relative w-full"
        >
          {/* Front Side - Order Tracking */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className={`h-full p-6 sm:p-10 rounded-2xl flex flex-col ${
              order && statusConfig[order.status] ? statusConfig[order.status].bgColor : "bg-white"
            }`}>
              {error && ( 
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 p-4 bg-red-50 rounded-lg">
                  {error}
                </motion.p> 
              )}
              {order && (
                <motion.div 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible"
                  className="flex flex-col h-full"
                >
                  <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 text-slate-600">
                    {order.isDelivery ? ( 
                      <Truck className="w-6 h-6 text-slate-600" /> 
                    ) : ( 
                      <Store className="w-6 h-6 text-slate-600" /> 
                    )}
                    <span className="text-xl font-bold">{order.isDelivery ? "Entrega" : "Retirada"}</span>
                  </motion.div>
                  
                  {restaurant && ( 
                    <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mt-4 text-slate-700 bg-black/5 p-2 rounded-md">
                      <Utensils className="w-5 h-5 flex-shrink-0"/>
                      <p className="font-semibold text-center">{restaurant.name}</p>
                    </motion.div>
                  )}
                  
                  {order.isDelivery && order.deliveryAddress && ( 
                    <motion.p variants={itemVariants} className="text-sm text-slate-600 mt-3 font-bold text-center p-3 rounded-md">
                      Para: {order.deliveryAddress}
                    </motion.p>
                  )}
                  
                  <motion.div variants={itemVariants} className="mt-8 flex-grow flex items-center justify-center">
                    <StatusDisplay status={order.status} />
                  </motion.div>
                  
                  {order.status === "Ready for Pickup" && restaurant?.address && ( 
                    <motion.div variants={itemVariants} className="mt-6 p-4 bg-white/60 rounded-lg text-center shadow">
                      <p className="font-semibold text-slate-700 flex items-center justify-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-500" /> Endereço para Retirada
                      </p>
                      <p className="text-slate-600 mt-1 font-medium">{restaurant.address}</p>
                    </motion.div>
                  )}
                  
                  {order.isDelivery && order.status === "Out for Delivery" && order.confirmationCode && (() => { 
                    const config = statusConfig[order.status]; 
                    return (
                      <motion.div variants={itemVariants} className="flex flex-col items-center mt-6 border-1 border-white p-4 rounded-lg">
                        <p className="font-semibold text-slate-700 flex items-center justify-center gap-2">
                          <Key className="w-5 h-5 text-indigo-500" /> Código de Confirmação
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Informe este código ao entregador.</p>
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
                  
                  <motion.p variants={itemVariants} className="text-xs mt-8 text-slate-500 text-center">
                    Feito <TimeAgo date={order.createdAt.toDate()} />.
                  </motion.p>

                  {finalStatuses.includes(order.status) && (
                      <motion.div variants={itemVariants} className="mt-4 text-center">
                          <button 
                              onClick={handleOpenRating}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                          >
                              <Star className="w-4 h-4"/>
                              {order.isReviewed ? 'Editar sua avaliação' : 'Deixar uma avaliação'}
                          </button>
                      </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Back Side - Rating Interface */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{ 
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <div className="h-full p-6 sm:p-10 rounded-2xl bg-white shadow-lg flex flex-col">
              <RatingInterface
                onSubmit={handleReviewSubmit}
                onBack={() => setIsFlipped(false)}
                restaurantName={restaurant?.name || "o restaurante"}
                initialData={existingReview}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const StatusDisplay = ({ status }: { status: Order["status"] }) => {
  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <motion.div className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <motion.div className={`w-24 h-24 rounded-full flex items-center justify-center ${config.bgColor}`} whileHover={{ scale: 1.05 }}>
        <Icon className={`w-12 h-12 ${config.color}`} />
      </motion.div>
      <motion.h2 className={`mt-4 text-2xl font-bold ${config.color}`} initial={{ y: 10 }} animate={{ y: 0 }}>
        {statusTranslations[status] || status}
      </motion.h2>
      <motion.p className="text-slate-600 mt-2 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {config.text}
      </motion.p>
    </motion.div>
  );
};

interface RatingInterfaceProps {
  onSubmit: (rating: number, comment: string) => void;
  onBack: () => void;
  restaurantName: string;
  initialData?: { rating: number; comment: string } | null;
}

const RatingInterface: React.FC<RatingInterfaceProps> = ({ onSubmit, onBack, restaurantName, initialData }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (initialData) {
        setRating(initialData.rating);
        setComment(initialData.comment);
    } else {
        setRating(0);
        setComment("");
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full"
    >
      <div className="text-center">
        <h3 className="text-lg font-bold leading-6 text-gray-900 mb-6">
          {initialData ? 'Edite sua avaliação' : `Como foi sua experiência com ${restaurantName}?`}
        </h3>
        
        <div className="flex justify-center space-x-2 mb-6">
          {[...Array(5)].map((_, index) => { 
            const starValue = index + 1; 
            return (
              <motion.button 
                key={starValue} 
                onClick={() => setRating(starValue)} 
                onMouseEnter={() => setHoverRating(starValue)} 
                onMouseLeave={() => setHoverRating(0)} 
                whileHover={{ scale: 1.2, y: -5 }} 
                whileTap={{ scale: 0.9 }}
              >
                <Star 
                  className={`h-10 w-10 cursor-pointer transition-colors duration-200 ${ 
                    starValue <= (hoverRating || rating) ? 'text-yellow-400' : 'text-slate-300'
                  }`} 
                  fill={starValue <= (hoverRating || rating) ? 'currentColor' : 'none'}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <div className="flex-grow mb-6">
        <textarea 
          value={comment} 
          onChange={(e) => setComment(e.target.value)} 
          placeholder="Deixe um comentário (opcional)..." 
          rows={6} 
          className="w-full h-full border border-gray-200 rounded-lg p-3 text-sm placeholder:text-gray-600 text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition resize-none"
        />
      </div>
      
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <Eye className="w-4 h-4"/>
          Ver pedido
        </button>
        
        <button 
          onClick={handleSubmit} 
          disabled={rating === 0} 
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          {initialData ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
        </button>
      </div>
    </motion.div>
  );
};