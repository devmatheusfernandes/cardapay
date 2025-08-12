"use client";

import { useState, useEffect } from "react";
import {
  useDriverDeliveries,
  Order,
} from "../../../lib/hooks/useDriverDeliveries";
import {
  LoaderCircle,
  MapPin,
  Check,
  LogOut,
  Package,
  Key,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Modal from "@/app/components/ui/Modal";
import InputField from "@/app/components/ui/InputField";

const useDriverProfile = () => {
  const [user, authLoading] = useAuthState(auth);
  const [profile, setProfile] = useState<{
    code: string;
    restaurantId: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    const docRef = doc(db, "drivers", user.uid);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists())
        setProfile(doc.data() as { code: string; restaurantId: string | null });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading]);
  return { profile, isLoading: authLoading || isLoading };
};

export default function DriverDashboardPage() {
  const { profile, isLoading: profileLoading } = useDriverProfile();
  const {
    deliveries,
    isLoading: deliveriesLoading,
    confirmDelivery,
  } = useDriverDeliveries();
  const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/driver-login");
  };
  const handleCopyCode = () => {
    if (profile?.code) {
      navigator.clipboard.writeText(profile.code);
      toast.success("Código copiado!");
    }
  };

  const isLoading =
    profileLoading || (profile?.restaurantId && deliveriesLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <Package className="w-6 h-6" />
            <span>Bem vindo!</span>
          </h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {!profile?.restaurantId ? (
          <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="bg-emerald-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center">
              <Key className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">
              Seu Código de Entregador
            </h2>
            <p className="mt-2 text-gray-500">
              Compartilhe este código com o proprietário do restaurante.
            </p>
            <div className="mt-6 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-2xl font-mono font-bold text-emerald-600 tracking-widest">
                {profile?.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition"
                aria-label="Copiar código"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="max-w-md mx-auto p-8 text-center">
            <div className="bg-gray-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-700">
              Nenhuma entrega no momento
            </h2>
            <p className="mt-2 text-gray-500">
              Novos pedidos aparecerão aqui automaticamente
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {deliveries.map((order) => (
              <DeliveryCard
                key={order.id}
                order={order}
                onConfirmClick={() => setOrderToConfirm(order)}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDeliveryModal
        isOpen={!!orderToConfirm}
        onClose={() => setOrderToConfirm(null)}
        onConfirm={confirmDelivery}
        order={orderToConfirm}
      />
    </div>
  );
}

const DeliveryCard = ({
  order,
  onConfirmClick,
}: {
  order: Order;
  onConfirmClick: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
  >
    <div className="p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pedido #
          </p>
          <p className="font-mono text-lg font-bold text-gray-900 mt-1">
            {order.id.substring(0, 6).toUpperCase()}
          </p>
        </div>
        <button
          onClick={onConfirmClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <Check className="w-5 h-5" />
          <span>Marcar como Entregue</span>
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Endereço de entrega</p>
            <p className="mt-1 text-gray-600">{order.deliveryAddress}</p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const ConfirmDeliveryModal = ({
  isOpen,
  onClose,
  onConfirm,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, code: string) => void;
  order: Order | null;
}) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsLoading(true);
    await onConfirm(order.id, code);
    setIsLoading(false);
    onClose();
    setCode("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Entrega">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            Solicite o código de 4 dígitos do cliente para confirmar a entrega.
          </p>
        </div>

        <InputField
          icon={Key}
          name="code"
          placeholder="Código de Confirmação"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={4}
          pattern="\d{4}"
          title="Por favor, insira um código de 4 dígitos"
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || code.length !== 4}
            className="px-4 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <LoaderCircle className="w-4 h-4 animate-spin" />}
            Confirmar Entrega
          </button>
        </div>
      </form>
    </Modal>
  );
};
