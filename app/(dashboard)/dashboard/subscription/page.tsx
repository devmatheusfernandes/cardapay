"use client";
import { useState, useEffect } from "react";
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
  Zap,
  X,
} from "lucide-react";
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import { auth } from "@/lib/firebase";
import { toast } from "react-hot-toast";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  message: string;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-9 h-9 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                {title}
              </h2>
              <p className="text-slate-600 mb-8">{message}</p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-70 transition-colors"
              >
                {isLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
                Confirmar e Ativar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const cardHover = {
  scale: 1.02,
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
};

const buttonHover = { scale: 1.03 };
const buttonTap = { scale: 0.98 };

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

interface SubscriptionData {
  status: "active" | "canceled" | "past_due" | "trialing" | null;
  currentPeriodEnd?: string;
  stripeSubscriptionId?: string;
  planType?: "monthly" | "semiannual" | "annual";
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    status: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    monthly: false,
    semiannual: false,
    annual: false,
    manage: false,
    activate: false,
  });
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        if (!auth.currentUser) {
          setIsLoading(false);
          return;
        }

        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(
          "/api/stripe-subscription/create-checkout",
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        if (response.ok) {
          const subData = await response.json();
          setSubscription({
            status: subData.status || null,
            currentPeriodEnd: subData.currentPeriodEnd,
            stripeSubscriptionId: subData.stripeSubscriptionId,
            planType: subData.planType,
          });
        } else {
          setSubscription({ status: null });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Erro ao carregar dados da assinatura.");
        setSubscription({ status: null });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleAction = async (
    actionId: string,
    apiEndpoint: string,
    payload: object = {}
  ) => {
    setLoadingStates((prev) => ({ ...prev, [actionId]: true }));
    try {
      if (!auth.currentUser) throw new Error("Você precisa estar logado.");

      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ocorreu um erro.");

      // Redireciona para URL se existir (para checkout e portal do cliente)
      if (data.url) {
        window.location.href = data.url;
      }

      // Exibe mensagem de sucesso se existir (para ativação)
      if (data.message) {
        toast.success(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [actionId]: false }));
    }
  };

  const handleSubscribe = (planId: "monthly" | "semiannual" | "annual") =>
    handleAction(planId, "/api/stripe-subscription/create-checkout", {
      planId,
      skipTrial: false,
    });

  const handleManageSubscription = () =>
    handleAction("manage", "/api/stripe-subscription/manage-subscription");

  const handleActivateNow = async () => {
    await handleAction("activate", "/api/stripe-subscription/activate-now");
  };

  if (isLoading) {
    return (
      <SectionContainer>
        <div className="flex items-center justify-center h-screen">
          <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
        </div>
      </SectionContainer>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        onConfirm={async () => {
          await handleActivateNow();
          setIsActivateModalOpen(false);
        }}
        isLoading={loadingStates.activate}
        title="Ativar Assinatura?"
        message="Ao confirmar, seu período de teste será encerrado e a primeira cobrança será efetuada imediatamente. Você terá acesso completo ao plano."
      />

      <SectionContainer>
        <div className="w-full mx-auto space-y-4">
          <PageHeader
            title="Sua Assinatura"
            subtitle="Gerencie sua assinatura e acesse todos os recursos premium da plataforma"
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Status da Assinatura */}
            <motion.div variants={itemVariants}>
              <SubContainer className="mt-2">
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
                              <strong>
                                {getPlanName(subscription.planType)}
                              </strong>
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

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                          {subscription.status === "trialing" && (
                            <motion.button
                              whileHover={buttonHover}
                              whileTap={buttonTap}
                              onClick={() => setIsActivateModalOpen(true)}
                              disabled={loadingStates.activate}
                              className="flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 transition"
                            >
                              <Zap className="w-5 h-5" />
                              Ativar Agora
                            </motion.button>
                          )}

                          {["active", "trialing"].includes(
                            subscription.status
                          ) && (
                            <motion.button
                              whileHover={buttonHover}
                              whileTap={buttonTap}
                              onClick={handleManageSubscription}
                              disabled={loadingStates.manage}
                              className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-emerald-100 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-emerald-100 hover:bg-gray-50 disabled:opacity-50 transition"
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
              </SubContainer>
            </motion.div>

            {/* Planos */}
            {(!subscription.status || subscription.status === "canceled") && (
              <motion.div
                variants={itemVariants}
                className="mb-12"
                initial="hidden"
                animate="visible"
              >
                <SubContainer variant="white">
                  <div className="p-6 md:p-8">
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
                                  <span className="text-slate-700">
                                    {feature}
                                  </span>
                                </motion.div>
                              ))}
                            </div>

                            <div className="mt-auto">
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
                  </div>
                </SubContainer>
              </motion.div>
            )}
          </motion.div>
        </div>
      </SectionContainer>
    </>
  );
}
