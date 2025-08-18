"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Building,
  Clock,
  CreditCard,
  UtensilsCrossed,
  X,
  ArrowRight,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { useRestaurantProfile } from "@/lib/hooks/useRestaurantProfile";
import { useMenu } from "@/lib/hooks/useMenu";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  isCompleted: boolean;
}

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const router = useRouter();
  const { profile, stripeStatus } = useRestaurantProfile();
  const { menuItems } = useMenu();
  const { subscription } = useSubscription();
  const [user, authLoading] = useAuthState(auth);
  const [currentStep, setCurrentStep] = useState(0);

  // Define the onboarding steps
  const steps: WelcomeStep[] = [
    {
      id: "profile",
      title: "Informações do Restaurante",
      description:
        "Complete o nome, endereço e descrição do seu estabelecimento",
      icon: <Building className="w-6 h-6" />,
      route: "/dashboard/profile",
      isCompleted: !!(
        profile?.name &&
        profile?.address &&
        profile?.description
      ),
    },
    {
      id: "hours",
      title: "Horário de Funcionamento",
      description:
        "Configure os horários de abertura e fechamento para cada dia",
      icon: <Clock className="w-6 h-6" />,
      route: "/dashboard/profile",
      isCompleted: !!profile?.workingHours,
    },
    {
      id: "stripe",
      title: "Conta Stripe",
      description:
        "Conecte sua conta Stripe para receber pagamentos dos clientes",
      icon: <CreditCard className="w-6 h-6" />,
      route: "/dashboard/profile",
      isCompleted: !!(
        stripeStatus?.status === "connected" && stripeStatus?.payouts_enabled
      ),
    },
    {
      id: "menu",
      title: "Itens do Cardápio",
      description: "Adicione produtos, bebidas e acompanhamentos ao seu menu",
      icon: <UtensilsCrossed className="w-6 h-6" />,
      route: "/dashboard/menu",
      isCompleted: menuItems.length > 0,
    },
  ];

  // Update step completion status when data changes
  useEffect(() => {
    const updatedSteps = steps.map((step) => {
      switch (step.id) {
        case "email":
          return { ...step, isCompleted: !!user?.emailVerified };
        case "profile":
          return {
            ...step,
            isCompleted: !!(
              profile?.name &&
              profile?.address &&
              profile?.description
            ),
          };
        case "hours":
          return { ...step, isCompleted: !!profile?.workingHours };
        case "stripe":
          return {
            ...step,
            isCompleted: !!(
              stripeStatus?.status === "connected" &&
              stripeStatus?.payouts_enabled
            ),
          };
        case "menu":
          return { ...step, isCompleted: menuItems.length > 0 };
        default:
          return step;
      }
    });
    // Update steps state if needed
  }, [user, profile, stripeStatus, menuItems]);

  const completedSteps = steps.filter((step) => step.isCompleted).length;
  const totalSteps = steps.length;

  const handleStepClick = (step: WelcomeStep) => {
    router.push(step.route);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Bem-vindo ao CardaPay!</h2>
                <p className="text-emerald-100 mt-1">
                  Vamos configurar seu restaurante em alguns passos simples
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-emerald-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>
                  Progresso: {completedSteps}/{totalSteps}
                </span>
                <span>{Math.round((completedSteps / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2">
                <motion.div
                  className="bg-white h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    step.isCompleted
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                  onClick={() => handleStepClick(step)}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      step.isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        step.isCompleted ? "text-emerald-800" : "text-gray-800"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        step.isCompleted ? "text-emerald-600" : "text-gray-600"
                      }`}
                    >
                      {step.description}
                    </p>
                    {step.isCompleted ? (
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">
                          Concluído
                        </span>
                      </div>
                    ) : step.id === "email" ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-amber-600 font-medium">
                          Verifique seu email e clique no link de confirmação
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Pular por enquanto
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentStep === steps.length - 1}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
