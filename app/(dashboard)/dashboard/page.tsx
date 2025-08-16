"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Edit,
  LogOut,
  Gift,
  ShieldCheck,
  ShieldAlert,
  Crown,
} from "lucide-react";

import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import ActionButton from "@/app/components/shared/ActionButton";
import Loading from "@/app/components/shared/Loading";
import ProfileSetupModal, {
  ProfileData,
} from "@/app/components/profile/ProfileSetupModal";

// Interface para o perfil do usuário
interface UserProfile {
  uid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
}

// Interface para os dados da assinatura
interface SubscriptionState {
  status: string | null;
  periodEnd: string | null;
}

// Componente para exibir o status de verificação do e-mail
const EmailVerificationStatus = ({ isVerified }: { isVerified: boolean }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    setIsSending(true);
    setMessage("");
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("Um novo e-mail foi enviado!");
    } catch (error) {
      console.error("Erro ao reenviar e-mail:", error);
      setMessage("Falha ao reenviar. Tente mais tarde.");
    } finally {
      setIsSending(false);
    }
  };

  if (isVerified) {
    return (
      <span className="w-fit flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
        <ShieldCheck className="w-4 h-4" />
        Verificado
      </span>
    );
  }

  return (
    <div className="w-fit flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 sm:mt-0">
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
        <ShieldAlert className="w-4 h-4" />
        Não Verificado
      </span>
      <button
        onClick={handleResendEmail}
        disabled={isSending}
        className="text-xs text-slate-600 hover:underline disabled:opacity-50"
      >
        {isSending ? "Enviando..." : "Reenviar e-mail"}
      </button>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
};

// Componente para exibir o status da assinatura
const SubscriptionStatusBadge = ({
  subscription,
}: {
  subscription: SubscriptionState | null;
}) => {
  if (!subscription || !subscription.status) {
    return (
      <div className="p-4 bg-slate-100 rounded-lg text-center">
        <p className="font-semibold text-slate-700">Nenhuma Assinatura Ativa</p>
        <p className="text-sm text-slate-500">
          Escolha um plano para destravar todo o potencial.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  switch (subscription.status) {
    case "active":
      return (
        <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
          <p className="font-semibold text-emerald-800 flex items-center gap-2">
            <Crown className="w-5 h-5" /> Assinatura Ativa
          </p>
          <p className="text-sm text-emerald-700 mt-1">
            Sua próxima cobrança será em {formatDate(subscription.periodEnd)}.
          </p>
        </div>
      );
    case "trialing":
      return (
        <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-800 flex items-center gap-2">
            <Gift className="w-5 h-5" /> Período de Teste
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Seu teste gratuito termina em {formatDate(subscription.periodEnd)}.
          </p>
        </div>
      );
    case "past_due":
      return (
        <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="font-semibold text-red-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Pagamento Pendente
          </p>
          <p className="text-sm text-red-700 mt-1">
            Por favor, atualize suas informações de pagamento.
          </p>
        </div>
      );
    case "canceled":
      return (
        <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="font-semibold text-gray-800">Assinatura Cancelada</p>
          <p className="text-sm text-gray-600 mt-1">
            Seu acesso termina em {formatDate(subscription.periodEnd)}.
          </p>
        </div>
      );
    default:
      return null;
  }
};

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null
  );
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const initiateCheckout = useCallback(async (plan: string, trial: string) => {
    try {
      setLoading(true);
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/stripe-subscription/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          planId: plan,
          skipTrial: trial === "false",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Falha ao criar sessão de checkout."
        );
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Erro no checkout:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async (user: FirebaseUser) => {
      const intentString = localStorage.getItem("redirectIntent");
      if (intentString) {
        const { plan, trial } = JSON.parse(intentString);
        localStorage.removeItem("redirectIntent");
        initiateCheckout(plan, trial);
        return;
      }

      await user.reload();
      const idToken = await user.getIdToken();

      const profilePromise = getDoc(doc(db, "users", user.uid));
      const subscriptionPromise = fetch(
        "/api/stripe-subscription/create-checkout",
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      const [profileSnap, subscriptionResponse] = await Promise.all([
        profilePromise,
        subscriptionPromise,
      ]);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setUserProfile({
          uid: user.uid,
          email: user.email,
          name: data.name || null,
          phone: data.phone || null,
          emailVerified: user.emailVerified,
        });

        if (!data.name || !data.phone) {
          setIsSetupModalOpen(true);
        }
      } else {
        setUserProfile({
          uid: user.uid,
          email: user.email,
          name: null,
          phone: null,
          emailVerified: user.emailVerified,
        });
        setIsSetupModalOpen(true);
      }

      if (subscriptionResponse.ok) {
        const subData = await subscriptionResponse.json();
        setSubscription({
          status: subData.status,
          periodEnd: subData.currentPeriodEnd,
        });
      }

      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchAllData(user);
      } else {
        router.push("/sign-in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, initiateCheckout]);

  const handleProfileSave = async (data: ProfileData) => {
    if (!userProfile?.uid) return;
    const userDocRef = doc(db, "users", userProfile.uid);
    await setDoc(userDocRef, data, { merge: true });
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    setIsSetupModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await auth.signOut();
    router.push("/sign-in");
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SectionContainer>
      {userProfile && (
        <ProfileSetupModal
          isOpen={isSetupModalOpen}
          onSubmit={handleProfileSave}
          onClose={() => {}}
          title="🎉 Bem-vindo! Complete seu perfil"
          initialData={{
            name: userProfile.name || "",
            phone: userProfile.phone || "",
          }}
        />
      )}
      {userProfile && (
        <ProfileSetupModal
          isOpen={isEditModalOpen}
          onSubmit={handleProfileSave}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Perfil"
          initialData={{
            name: userProfile.name || "",
            phone: userProfile.phone || "",
          }}
        />
      )}

      {userProfile && !isSetupModalOpen && (
        <div className="w-full mx-auto">
          <PageHeader
            title="Seu Perfil"
            className="w-full mb-8"
            actionButton={{
              label: "Sair",
              icon: <LogOut />,
              onClick: handleSignOut,
              variant: "secondary",
            }}
          />

          <SubContainer
            variant="default"
            className="w-full p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex-shrink-0 flex items-center justify-center text-white text-4xl font-bold">
                {userProfile.name ? (
                  userProfile.name.charAt(0).toUpperCase()
                ) : (
                  <User />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-slate-800">
                  {userProfile.name || "Usuário"}
                </h2>
                <p className="text-slate-500">Bem-vindo(a) de volta!</p>
              </div>
              <ActionButton
                label="Editar Perfil"
                icon={<Edit />}
                onClick={() => setIsEditModalOpen(true)}
                variant="primary"
                size="md"
              />
            </div>

            <SubscriptionStatusBadge subscription={subscription} />

            <hr className="border-slate-200" />

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700">
                Informações Pessoais
              </h3>
              <div className="flex items-start gap-4 text-slate-600">
                <Mail className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                <div className="flex flex-col">
                  <span>{userProfile.email}</span>
                  <EmailVerificationStatus
                    isVerified={userProfile.emailVerified}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <Phone className="w-5 h-5 text-emerald-500" />
                <span>{userProfile.phone || "Não informado"}</span>
              </div>
            </div>
          </SubContainer>
        </div>
      )}
    </SectionContainer>
  );
}
