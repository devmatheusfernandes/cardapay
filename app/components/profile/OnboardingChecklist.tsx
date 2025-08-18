"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Building,
  Clock,
  CreditCard,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
} from "lucide-react";
import { useRestaurantProfile } from "@/lib/hooks/useRestaurantProfile";
import { useMenu } from "@/lib/hooks/useMenu";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export default function OnboardingChecklist() {
  const router = useRouter();
  const { profile, stripeStatus } = useRestaurantProfile();
  const { menuItems } = useMenu();
  const [user, authLoading] = useAuthState(auth);
  const [isExpanded, setIsExpanded] = useState(true);

  // Define the checklist items
  const checklistItems: ChecklistItem[] = [
    {
      id: "email",
      title: "Verificação de Email",
      description: "Confirme seu endereço de email",
      icon: <Mail className="w-5 h-5" />,
      route: "/dashboard/profile",
      isCompleted: !!user?.emailVerified,
      isRequired: true,
    },
    {
      id: "profile",
      title: "Informações do Restaurante",
      description: "Nome, endereço e descrição",
      icon: <Building className="w-5 h-5" />,
      route: "/dashboard/profile",
      isCompleted: !!(
        profile?.name &&
        profile?.address &&
        profile?.description
      ),
      isRequired: true,
    },
    {
      id: "hours",
      title: "Horário de Funcionamento",
      description: "Configure horários de abertura e fechamento",
      icon: <Clock className="w-5 h-5" />,
      route: "/dashboard/profile",
      isCompleted: !!profile?.workingHours,
      isRequired: true,
    },
    {
      id: "stripe",
      title: "Conta Stripe",
      description: "Conecte para receber pagamentos",
      icon: <CreditCard className="w-5 h-5" />,
      route: "/dashboard/profile",
      isCompleted: !!(
        stripeStatus?.status === "connected" && stripeStatus?.payouts_enabled
      ),
      isRequired: true,
    },
    {
      id: "menu",
      title: "Itens do Cardápio",
      description: "Adicione produtos ao seu menu",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      route: "/dashboard/menu",
      isCompleted: menuItems.length > 0,
      isRequired: false,
    },
  ];

  const completedItems = checklistItems.filter(
    (item) => item.isCompleted
  ).length;
  const totalRequired = checklistItems.filter((item) => item.isRequired).length;
  const completedRequired = checklistItems.filter(
    (item) => item.isRequired && item.isCompleted
  ).length;
  const progressPercentage =
    totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  const handleItemClick = (item: ChecklistItem) => {
    if (item.id === "email" && !item.isCompleted) {
      // For email verification, show a special message or trigger resend
      return;
    }
    router.push(item.route);
  };

  const getProgressColor = () => {
    if (progressPercentage === 100) return "bg-emerald-500";
    if (progressPercentage >= 75) return "bg-blue-500";
    if (progressPercentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressText = () => {
    if (progressPercentage === 100) return "Configuração completa!";
    if (progressPercentage >= 75) return "Quase lá!";
    if (progressPercentage >= 50) return "Bom progresso!";
    return "Vamos começar!";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-emerald-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-emerald-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Checklist de Configuração
              </h3>
              <p className="text-sm text-gray-600">{getProgressText()}</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">
              {completedRequired} de {totalRequired} obrigatórios concluídos
            </span>
            <span className="font-medium text-gray-900">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${getProgressColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-6 space-y-4"
        >
          {checklistItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                item.isCompleted
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
              onClick={() => handleItemClick(item)}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {item.isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  item.icon
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`font-medium ${
                      item.isCompleted ? "text-emerald-800" : "text-gray-800"
                    }`}
                  >
                    {item.title}
                  </h4>
                  {item.isRequired && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                      Obrigatório
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-1 ${
                    item.isCompleted ? "text-emerald-600" : "text-gray-600"
                  }`}
                >
                  {item.description}
                </p>
                {item.isCompleted ? (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">
                      Concluído
                    </span>
                  </div>
                ) : item.id === "email" ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-amber-600 font-medium">
                      Verifique seu email e clique no link de confirmação
                    </span>
                  </div>
                ) : null}
              </div>

              <ExternalLink className="w-4 h-4 text-gray-400" />
            </motion.div>
          ))}

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {completedRequired === totalRequired
                  ? "🎉 Parabéns! Seu restaurante está completamente configurado."
                  : `${
                      totalRequired - completedRequired
                    } de ${totalRequired} passos obrigatórios restantes`}
              </p>
              {completedRequired < totalRequired && (
                <p className="text-xs text-gray-500">
                  Complete os passos obrigatórios para começar a receber pedidos
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
