"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { LoaderCircle, Crown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireActive?: boolean;
}

export default function SubscriptionGuard({
  children,
  fallback,
  requireActive = true,
}: SubscriptionGuardProps) {
  const { status, isActive, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!requireActive || isActive) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-6">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-lg shadow-md border border-slate-200 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === "past_due" ? (
              <AlertTriangle className="w-8 h-8 text-emerald-600" />
            ) : (
              <Crown className="w-8 h-8 text-emerald-600" />
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {status === "past_due"
              ? "Assinatura em Atraso"
              : "Assinatura Premium Necessária"}
          </h2>
          <p className="text-slate-600 mb-6">
            {status === "past_due"
              ? "Atualize seu pagamento para continuar usando todos os recursos."
              : "Para acessar este recurso, você precisa de uma assinatura ativa."}
          </p>

          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Crown className="w-5 h-5" />
            {status === "past_due" ? "Atualizar Pagamento" : "Ver Planos"}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// Banner de status da assinatura para exibir avisos
export function SubscriptionBanner() {
  const { status, daysUntilExpiry } = useSubscription();

  if (status === "active" && (!daysUntilExpiry || daysUntilExpiry > 7)) {
    return null;
  }

  if (!status || status === "canceled") {
    return null;
  }

  const getBannerConfig = () => {
    if (status === "past_due") {
      return {
        color: "bg-red-50 border-red-200 text-red-700",
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        title: "Pagamento em Atraso",
        message:
          "Sua assinatura está com pagamento pendente. Atualize para evitar interrupções.",
        action: "Atualizar Pagamento",
      };
    }

    if (
      status === "active" &&
      daysUntilExpiry !== undefined &&
      daysUntilExpiry <= 7
    ) {
      return {
        color: "bg-yellow-50 border-yellow-200 text-yellow-700",
        icon: <Crown className="w-5 h-5 text-yellow-600" />,
        title: "Assinatura Expirando",
        message: `Sua assinatura expira em ${daysUntilExpiry} ${
          daysUntilExpiry === 1 ? "dia" : "dias"
        }.`,
        action: "Gerenciar Assinatura",
      };
    }
    return null;
  };

  const bannerConfig = getBannerConfig();
  if (!bannerConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 mb-6 ${bannerConfig.color}`}
    >
      <div className="flex items-start gap-3">
        {bannerConfig.icon}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{bannerConfig.title}</h3>
          <p className="text-sm mt-1 opacity-90">{bannerConfig.message}</p>
        </div>
        <Link
          href="/dashboard/subscription"
          className="px-3 py-1 text-xs font-medium bg-white rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          {bannerConfig.action}
        </Link>
      </div>
    </motion.div>
  );
}
