"use client";

import { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

export interface SubscriptionData {
  status: "active" | "canceled" | "past_due" | "trialing" | null;
  currentPeriodEnd?: string;
  stripeSubscriptionId?: string;
  planType?: "monthly" | "semiannual" | "annual";
}

export const useSubscription = () => {
  const [user, authLoading] = useAuthState(auth);
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

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSubscription({
            status: data.subscriptionStatus || null,
            currentPeriodEnd: data.subscriptionEndDate,
            stripeSubscriptionId: data.stripeSubscriptionId,
            planType: data.planType,
          });
        } else {
          setSubscription({ status: null });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching subscription:", error);
        toast.error("Erro ao carregar dados da assinatura.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleAction = useCallback(
    async (
      actionId: string,
      apiEndpoint: string,
      payload: object = {}
    ) => {
      setLoadingStates((prev) => ({ ...prev, [actionId]: true }));
      try {
        if (!user) throw new Error("Você precisa estar logado.");

        const idToken = await user.getIdToken();
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
    },
    [user]
  );

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  const daysUntilExpiry = subscription.currentPeriodEnd
    ? dayjs(subscription.currentPeriodEnd).diff(dayjs(), "day")
    : undefined;

  // Função `handleActivateNow` corrigida, sem a chamada desnecessária
  const handleActivateNow = async () => {
    await handleAction("activate", "/api/stripe-subscription/activate-now");
  };

  return {
    subscription,
    status: subscription.status,
    isActive,
    isLoading: authLoading || isLoading,
    daysUntilExpiry,
    loadingStates,
    handleSubscribe: (planId: "monthly" | "semiannual" | "annual") =>
      handleAction(planId, "/api/stripe-subscription/create-checkout", {
        planId,
        skipTrial: false,
      }),
    handleManageSubscription: () =>
      handleAction("manage", "/api/stripe-subscription/manage-subscription"),
    handleActivateNow, // Adicionada ao retorno do hook
  };
};