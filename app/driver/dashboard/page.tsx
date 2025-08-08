'use client';

import { useState, useEffect } from 'react';
import { useDriverDeliveries, Order } from '../../../lib/hooks/useDriverDeliveries';
import { LoaderCircle, MapPin, Check, LogOut, Package, Key, Copy, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Modal from '@/app/components/ui/Modal';
import InputField from '@/app/components/ui/InputField';

const useDriverProfile = () => {
    const [user, authLoading] = useAuthState(auth);
    const [profile, setProfile] = useState<{ code: string; restaurantId: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (authLoading || !user) { if (!authLoading) setIsLoading(false); return; }
        const docRef = doc(db, 'drivers', user.uid);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) setProfile(doc.data() as { code: string; restaurantId: string | null });
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user, authLoading]);
    return { profile, isLoading: authLoading || isLoading };
};

export default function DriverDashboardPage() {
  const { profile, isLoading: profileLoading } = useDriverProfile();
  const { deliveries, isLoading: deliveriesLoading, confirmDelivery } = useDriverDeliveries();
  const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
  const router = useRouter();

  const handleSignOut = async () => { await signOut(auth); router.push('/driver-login'); };
  const handleCopyCode = () => { if (profile?.code) { navigator.clipboard.writeText(profile.code); toast.success("Código copiado!"); } };

  const isLoading = profileLoading || (profile?.restaurantId && deliveriesLoading);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-center" />
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Painel do Entregador</h1>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"><LogOut className="w-5 h-5" /> Sair</button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {!profile?.restaurantId ? (
            <div className="text-center py-20 bg-white p-8 rounded-lg shadow-md">
                <Key className="mx-auto h-16 w-16 text-slate-400" />
                <h2 className="mt-4 text-2xl font-semibold text-slate-800">Seu Código de Entregador</h2>
                <p className="mt-2 text-slate-500">Compartilhe este código com o proprietário do restaurante.</p>
                <div className="mt-6 flex items-center justify-center gap-2 p-4 bg-slate-100 rounded-md max-w-xs mx-auto">
                    <span className="text-3xl font-mono font-bold text-indigo-600 tracking-widest">{profile?.code}</span>
                    <button onClick={handleCopyCode} className="p-2 text-slate-500 hover:bg-slate-200 rounded-md transition"><Copy className="w-5 h-5"/></button>
                </div>
            </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-20"><Package className="mx-auto h-20 w-20 text-slate-300" /><h2 className="mt-4 text-2xl font-semibold text-slate-700">Nenhuma entrega no momento</h2></div>
        ) : (
          <div className="space-y-6">{deliveries.map(order => <DeliveryCard key={order.id} order={order} onConfirmClick={() => setOrderToConfirm(order)} />)}</div>
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

const DeliveryCard = ({ order, onConfirmClick }: { order: Order; onConfirmClick: () => void }) => (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <div>
          <p className="text-sm text-slate-500">Pedido</p>
          <p className="font-mono text-xl font-bold text-slate-800">{order.id.substring(0, 6).toUpperCase()}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={onConfirmClick} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"><Check className="w-5 h-5" /> Marcar como Entregue</button>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="font-bold text-slate-700 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500" /> Endereço:</p>
        <p className="mt-1 text-slate-600 pl-7">{order.deliveryAddress}</p>
      </div>
    </motion.div>
);

const ConfirmDeliveryModal = ({ isOpen, onClose, onConfirm, order }: { isOpen: boolean; onClose: () => void; onConfirm: (orderId: string, code: string) => void; order: Order | null }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;
        setIsLoading(true);
        await onConfirm(order.id, code);
        setIsLoading(false);
        onClose();
        setCode('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Entrega">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-slate-600">Por favor, insira o código de 4 dígitos fornecido pelo cliente para confirmar a entrega.</p>
                <InputField icon={Key} name="code" placeholder="Código de Confirmação" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={4} />
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                        {isLoading && <LoaderCircle className="w-5 h-5 animate-spin"/>}
                        Confirmar
                    </button>
                </div>
            </form>
        </Modal>
    );
};
