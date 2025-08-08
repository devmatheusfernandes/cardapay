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
import { motion } from "framer-motion";
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
        "Menu digital ilimitado",
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
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <IconComponent className="w-4 h-4" />
        {config.text}
      </span>
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
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Assinatura</h1>
        <p className="text-slate-500 mb-8">
          Gerencie sua assinatura e acesse todos os recursos premium da
          plataforma
        </p>

        {/* Current Subscription Status */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Status da Assinatura
          </h2>

          {subscription.status ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-600">Status:</span>
                {getStatusBadge(subscription.status)}
                {subscription.planType && (
                  <span className="text-slate-600">
                    Plano: <strong>{getPlanName(subscription.planType)}</strong>
                  </span>
                )}
              </div>

              {subscription.currentPeriodEnd && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-600">
                    Próxima cobrança:{" "}
                    <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                {subscription.status === "active" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManageSubscription}
                    disabled={loadingStates.manage}
                    className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition"
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRenewSubscription}
                    disabled={loadingStates.renew}
                    className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition"
                  >
                    {loadingStates.renew && (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    )}
                    <Crown className="w-5 h-5" />
                    Renovar Assinatura
                  </motion.button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">
                Você ainda não possui uma assinatura ativa
              </p>
            </div>
          )}
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-lg shadow-md border-2 ${
                plan.recommended
                  ? "border-rose-400 transform scale-105"
                  : "border-rose-200"
              }`}
            >
              {plan.recommended && (
                <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                  RECOMENDADO
                </div>
              )}

              <div className="text-center">
                <Crown className="w-12 h-12 text-rose-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 text-sm mb-3">
                  {plan.description}
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <DollarSign className="w-6 h-6 text-rose-600" />
                  <span className="text-2xl font-bold text-rose-600">
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-slate-500">
                    {plan.interval === "month" ? "/mês" : "/ano"}
                  </span>
                </div>

                {plan.savings && (
                  <div className="flex items-center justify-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs mb-4">
                    <BadgePercent className="w-4 h-4" />
                    {plan.savings}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              {!subscription.status || subscription.status === "canceled" ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={
                    loadingStates[plan.id as keyof typeof loadingStates]
                  }
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition"
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
                <div className="text-center">
                  <p className="text-green-600 font-medium">
                    ✨ Você já possui uma assinatura!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Por que escolher nosso Plano Premium?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Recursos Premium
              </h3>
              <p className="text-slate-600">
                Acesso completo a todos os recursos da plataforma, incluindo
                relatórios avançados e customizações
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Aumente suas Vendas
              </h3>
              <p className="text-slate-600">
                Facilite pedidos online e pagamentos digitais, aumentando
                significativamente seu faturamento
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Pagamentos Seguros
              </h3>
              <p className="text-slate-600">
                Integração completa com Stripe para processamento seguro de
                pagamentos online
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
