"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LoaderCircle,
  Crown,
  Check,
  AlertCircle,
  CreditCard,
  Calendar,
  DollarSign,
  BadgePercent,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

interface SubscriptionData {
  status: "active" | "canceled" | "past_due" | "trialing" | null;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planType?: "monthly" | "semiannual" | "annual";
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  intervalCount: number;
  description: string;
  savings?: string;
  features: string[];
  recommended?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const cardHover = {
  scale: 1.02,
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
};

const buttonHover = {
  scale: 1.03,
};

const buttonTap = {
  scale: 0.98,
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    status: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showRenewButton, setShowRenewButton] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    monthly: false,
    semiannual: false,
    annual: false,
    renew: false,
    manage: false,
  });

  const plans: Plan[] = [
    {
      id: "monthly",
      name: "Plano Mensal",
      price: 59.9,
      interval: "month",
      intervalCount: 1,
      description: "Pagamento mensal recorrente por 1 ano",
      features: [
        "Código QR personalizado",
        "Pedidos online integrados",
        "Pagamentos via Stripe",
        "Relatórios de vendas",
        "Suporte prioritário",
      ],
    },
    {
      id: "semiannual",
      name: "Plano Semestral",
      price: 49.9,
      interval: "month",
      intervalCount: 6,
      description: "Pagamento semestral (6 meses) por 1 ano",
      savings: "Economize R$ 60,00 em relação ao mensal",
      features: [
        "Tudo do Plano Mensal",
        "Economia de 16%",
        "Cobrado a cada 6 meses",
      ],
      recommended: true,
    },
    {
      id: "annual",
      name: "Plano Anual",
      price: 540.0,
      interval: "year",
      intervalCount: 1,
      description: "Pagamento único anual",
      savings: "Economize R$ 178,80 em relação ao mensal",
      features: [
        "Tudo do Plano Mensal",
        "Economia de 25%",
        "Pagamento único por ano",
      ],
    },
  ];

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const subscriptionData = {
        status: userData?.subscriptionStatus || null,
        currentPeriodEnd: userData?.subscriptionEndDate,
        stripeCustomerId: userData?.stripeCustomerId,
        stripeSubscriptionId: userData?.stripeSubscriptionId,
        planType: userData?.planType,
      };

      setSubscription(subscriptionData);

      if (subscriptionData.currentPeriodEnd) {
        const endDate = dayjs(subscriptionData.currentPeriodEnd);
        const today = dayjs();
        const daysToEnd = endDate.diff(today, "day");

        setShowRenewButton(
          daysToEnd <= 30 && subscriptionData.status === "active"
        );
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      toast.error("Erro ao carregar dados da assinatura");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setLoadingStates((prev) => ({ ...prev, [planId]: true }));
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch("/api/stripe-subscription/create-checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar sessão de pagamento");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Erro ao processar assinatura. Tente novamente.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const handleRenewSubscription = async () => {
    setLoadingStates((prev) => ({ ...prev, renew: true }));
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch(
        "/api/stripe-subscription/renew-subscription",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId: subscription.stripeSubscriptionId,
            planType: subscription.planType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao renovar assinatura");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error renewing subscription:", error);
      toast.error("Erro ao renovar assinatura. Tente novamente.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, renew: false }));
    }
  };

  const handleManageSubscription = async () => {
    setLoadingStates((prev) => ({ ...prev, manage: true }));
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      console.log("Initiating portal session for:", user.uid);

      const idToken = await user.getIdToken();
      const response = await fetch(
        "/api/stripe-subscription/manage-subscription",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Portal session failed:", {
          status: response.status,
          error: responseData.error,
          details: responseData.details,
        });
        throw new Error(responseData.error || "Failed to access portal");
      }

      if (!responseData.url) {
        throw new Error("No portal URL returned");
      }

      console.log("Redirecting to portal:", responseData.url);
      window.location.href = responseData.url;
    } catch (error: any) {
      console.error("Portal access error:", {
        message: error.message,
        stack: error.stack,
      });

      toast.error(
        error.message || "Erro ao acessar o portal. Tente novamente."
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, manage: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        color: "bg-green-100 text-green-800",
        text: "Ativa",
        icon: Check,
      },
      canceled: {
        color: "bg-red-100 text-red-800",
        text: "Cancelada",
        icon: AlertCircle,
      },
      past_due: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Em Atraso",
        icon: AlertCircle,
      },
      trialing: {
        color: "bg-blue-100 text-blue-800",
        text: "Período de Teste",
        icon: Crown,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <IconComponent className="w-4 h-4" />
        {config.text}
      </motion.span>
    );
  };

  const getPlanName = (planType?: string) => {
    switch (planType) {
      case "monthly":
        return "Mensal";
      case "semiannual":
        return "Semestral";
      case "annual":
        return "Anual";
      default:
        return "Premium";
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-screen"
      >
        <LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3 bg-clip-text">
            Sua Assinatura
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Gerencie sua assinatura e acesse todos os recursos premium da
            plataforma
          </p>
        </motion.div>

        {/* Current Subscription Status */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Status da Assinatura
              </h2>

              <AnimatePresence mode="wait">
                {subscription.status ? (
                  <motion.div
                    key="has-subscription"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-600">Status:</span>
                      {getStatusBadge(subscription.status)}
                      {subscription.planType && (
                        <span className="text-slate-600">
                          Plano:{" "}
                          <strong>{getPlanName(subscription.planType)}</strong>
                        </span>
                      )}
                    </div>

                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <span className="text-slate-600">
                          Próxima cobrança:{" "}
                          <strong>
                            {formatDate(subscription.currentPeriodEnd)}
                          </strong>
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      {subscription.status === "active" && (
                        <motion.button
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                          onClick={handleManageSubscription}
                          disabled={loadingStates.manage}
                          className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                        >
                          {loadingStates.manage && (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                          )}
                          <CreditCard className="w-5 h-5" />
                          Gerenciar Assinatura
                        </motion.button>
                      )}

                      {showRenewButton && (
                        <motion.button
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                          onClick={handleRenewSubscription}
                          disabled={loadingStates.renew}
                          className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                        >
                          {loadingStates.renew && (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                          )}
                          <Crown className="w-5 h-5" />
                          Renovar Assinatura
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-subscription"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6"
                  >
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">
                      Você ainda não possui uma assinatura ativa
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Subscription Plans */}
          <motion.div
            variants={itemVariants}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Escolha seu Plano
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={cardHover}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`relative bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                    plan.recommended
                      ? "border-indigo-400"
                      : "border-transparent"
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-bl-lg">
                      RECOMENDADO
                    </div>
                  )}

                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-slate-600 text-sm mb-3">
                        {plan.description}
                      </p>

                      <div className="flex items-center justify-center gap-2 mb-4">
                        <DollarSign className="w-6 h-6 text-indigo-600" />
                        <span className="text-2xl font-bold text-indigo-600">
                          R$ {plan.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-slate-500">
                          {plan.interval === "month" ? "/mês" : "/ano"}
                        </span>
                      </div>

                      {plan.savings && (
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center justify-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs mb-4"
                        >
                          <BadgePercent className="w-4 h-4" />
                          {plan.savings}
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3"
                        >
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {!subscription.status || subscription.status === "canceled" ? (
                      <motion.button
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={
                          loadingStates[plan.id as keyof typeof loadingStates]
                        }
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                      >
                        {loadingStates[plan.id as keyof typeof loadingStates] && (
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                        )}
                        <Crown className="w-5 h-5" />
                        {loadingStates[plan.id as keyof typeof loadingStates]
                          ? "Processando..."
                          : "Assinar Agora"}
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-2 px-4 bg-green-50 text-green-700 rounded-lg"
                      >
                        <p className="font-medium">
                          ✨ Você já possui uma assinatura!
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}