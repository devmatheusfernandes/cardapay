'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle, Clock, ChefHat, ShoppingBag, CheckCircle, Truck, Store, Key } from 'lucide-react';
import TimeAgo from 'react-timeago';
import { useParams } from 'next/navigation';

interface Order {
  id: string;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed' | 'Returned' | 'Canceled';
  createdAt: Timestamp;
  isDelivery: boolean;
  deliveryAddress?: string;
  confirmationCode?: string;
}

const statusConfig = {
    Pending: { icon: Clock, text: 'Seu pedido foi recebido.', color: 'text-amber-500' },
    'In Progress': { icon: ChefHat, text: 'A cozinha está preparando seu pedido.', color: 'text-blue-500' },
    'Ready for Pickup': { icon: ShoppingBag, text: 'Seu pedido está pronto para retirada!', color: 'text-purple-500' },
    'Out for Delivery': { icon: Truck, text: 'Seu pedido saiu para entrega!', color: 'text-cyan-500' },
    Completed: { icon: CheckCircle, text: 'Seu pedido foi concluído. Obrigado!', color: 'text-green-500' },
    Returned: { icon: CheckCircle, text: 'O pedido foi devolvido.', color: 'text-red-500' },
    Canceled: { icon: CheckCircle, text: 'Este pedido foi cancelado.', color: 'text-slate-500' },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
        setError("Nenhum ID de pedido fornecido.");
        setIsLoading(false);
        return;
    }
    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) setOrder({ id: doc.id, ...doc.data() } as Order);
        else setError("Desculpe, não conseguimos encontrar seu pedido.");
        setIsLoading(false);
    }, (err) => {
        setError("Ocorreu um erro ao rastrear seu pedido.");
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderCircle className="w-12 h-12 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg max-w-md w-full text-center">
            {error && <p className="text-red-600">{error}</p>}
            {order && (
                <>
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                        {order.isDelivery ? <Truck className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                        <span className="text-xl font-bold">{order.isDelivery ? 'Entrega' : 'Retirada'}</span>
                    </div>
                    {order.isDelivery && order.deliveryAddress && (
                        <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded-md">Para: {order.deliveryAddress}</p>
                    )}
                    <div className="mt-8">
                        <StatusDisplay status={order.status} />
                    </div>
                    {order.isDelivery && order.status === 'Out for Delivery' && order.confirmationCode && (
                        <div className="mt-6 bg-amber-50 border-2 border-dashed border-amber-200 p-4 rounded-lg">
                            <p className="font-semibold text-slate-700 flex items-center justify-center gap-2"><Key className="w-5 h-5 text-amber-500"/> Código de Confirmação</p>
                            <p className="text-sm text-slate-500 mt-1">Informe este código ao entregador.</p>
                            <p className="text-4xl font-mono font-bold text-rose-600 tracking-widest mt-2">{order.confirmationCode}</p>
                        </div>
                    )}
                    <p className="text-xs text-slate-400 mt-8">
                        Feito <TimeAgo date={order.createdAt.toDate()} />.
                    </p>
                </>
            )}
        </div>
    </div>
  );
}

const StatusDisplay = ({ status }: { status: Order['status'] }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
        <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${config.color.replace('text', 'bg').replace('500', '100')}`}>
                <Icon className={`w-12 h-12 ${config.color}`} />
            </div>
            <h2 className={`mt-4 text-2xl font-bold ${config.color}`}>{status}</h2>
            <p className="text-slate-600 mt-2">{config.text}</p>
        </div>
    );
};
