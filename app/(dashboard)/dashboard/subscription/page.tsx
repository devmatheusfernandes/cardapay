// app/(routes)/subscription/page.tsx

"use client";

import { useSubscription, SubscriptionData } from "@/lib/hooks/useSubscription";
import { motion, AnimatePresence } from "framer-motion";
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

// Tipos e Constantes para o componente de UI
interface Plan {
  id: "monthly" | "semiannual" | "annual";
  name: string;
  price: number;
  interval: "month" | "year";
  intervalCount: number;
  description: string;
  savings?: string;
  features: string[];
  recommended?: boolean;
}

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

// Constantes de Animação
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

// Funções de Utilidade/Renderização Específicas da UI
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

const getStatusBadge = (status: SubscriptionData["status"]) => {
  if (!status) return null;

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

  const config = statusConfig[status];
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

// --- Componente Principal ---
export default function SubscriptionPage() {
  const {
    subscription,
    isLoading,
    loadingStates,
    handleSubscribe,
    handleManageSubscription,
  } = useSubscription();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-screen"
      >
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4 sm:px-6 lg:px-8"
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Bloco de Status da Assinatura */}
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
                          {subscription.status === "canceled"
                            ? "Acesso válido até: "
                            : "Próxima cobrança: "}
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
                          className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition"
                        >
                          {loadingStates.manage && (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                          )}
                          <CreditCard className="w-5 h-5" />
                          Gerenciar Assinatura
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

          {/* INÍCIO DA ALTERAÇÃO: Renderização condicional do Bloco de Planos */}
          {(!subscription.status || subscription.status === "canceled") && (
            <motion.div
              variants={itemVariants}
              className="mb-12"
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                Escolha um Novo Plano
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
                        ? "border-emerald-400"
                        : "border-transparent"
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-600 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-bl-lg">
                        RECOMENDADO
                      </div>
                    )}

                    <div className="p-6 flex flex-col h-full">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Crown className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                          {plan.name}
                        </h3>
                        <p className="text-slate-600 text-sm mb-3">
                          {plan.description}
                        </p>

                        <div className="flex items-center justify-center gap-2 mb-4">
                          <DollarSign className="w-6 h-6 text-emerald-600" />
                          <span className="text-2xl font-bold text-emerald-600">
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

                      <div className="mt-auto">
                        {/* O botão de assinar já é condicional por padrão, então não precisa de mudanças */}
                        <motion.button
                          whileHover={buttonHover}
                          whileTap={buttonTap}
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={loadingStates[plan.id]}
                          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-pink-600 hover:from-emerald-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition"
                        >
                          {loadingStates[plan.id] && (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                          )}
                          <Crown className="w-5 h-5" />
                          {loadingStates[plan.id]
                            ? "Processando..."
                            : "Assinar Agora"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          {/* FIM DA ALTERAÇÃO */}
        </motion.div>
      </div>
    </motion.div>
  );
}
