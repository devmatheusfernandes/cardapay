"use client";

import { useState, useEffect } from "react";
// Adicione 'sendEmailVerification' aos imports do Firebase Auth
import {
  onAuthStateChanged,
  User as FirebaseUser,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase"; // Verifique se o caminho está correto
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
// Adicione os ícones para os status de verificação
import {
  User,
  Mail,
  Phone,
  Edit,
  LogOut,
  Gift,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import ProfileSetupModal, {
  ProfileData,
} from "@/app/components/profile/ProfileSetupModal"; // Verifique se o caminho está correto

// 1. Atualize a interface do perfil para incluir o status de verificação
interface UserProfile {
  uid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  emailVerified: boolean; // Novo campo
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
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
        <ShieldCheck className="w-4 h-4" />
        Verificado
      </span>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 sm:mt-0">
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

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        if (user) {
          // 2. Recarrega os dados do usuário para obter o status 'emailVerified' mais recente
          await user.reload();

          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              uid: user.uid,
              email: user.email,
              name: data.name || null,
              phone: data.phone || null,
              birthDate: data.birthDate || null,
              emailVerified: user.emailVerified, // Armazena o status
            });
          } else {
            setUserProfile({
              uid: user.uid,
              email: user.email,
              name: null,
              phone: null,
              birthDate: null,
              emailVerified: user.emailVerified, // Armazena o status aqui também
            });
            setIsSetupModalOpen(true);
          }
        } else {
          router.push("/sign-in");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [router]);

  // Funções handleProfileSave, handleSignOut, formatBirthDate permanecem as mesmas...
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
    router.push("/");
  };
  const formatBirthDate = (dateString: string | null) => {
    if (!dateString) return "Não informado";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Modais (sem alteração) */}
      <ProfileSetupModal
        isOpen={isSetupModalOpen}
        onSubmit={handleProfileSave}
        onClose={() => {}}
        title="🎉 Bem-vindo! Complete seu perfil"
      />
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
        <div className="flex flex-col items-center p-4 py-8 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            {/* Cabeçalho (sem alteração) */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
                Seu Perfil
              </h1>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-medium p-2 rounded-md"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
              {/* Bloco de Nome e Foto (sem alteração) */}
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
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-shrink-0 flex items-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition"
                >
                  <Edit className="w-4 h-4" />
                  Editar Perfil
                </button>
              </div>

              <hr className="border-slate-200" />

              {/* 3. Integração do status de verificação no JSX */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">
                  Informações Pessoais
                </h3>
                {/* Linha do E-mail Atualizada */}
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
                <div className="flex items-center gap-4 text-slate-600">
                  <Gift className="w-5 h-5 text-emerald-500" />
                  <span>{formatBirthDate(userProfile.birthDate)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
