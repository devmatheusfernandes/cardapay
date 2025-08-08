import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { type Order } from './useOrders';

export type { Order };

export const useDriverDeliveries = () => {
  const [user, authLoading] = useAuthState(auth);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'orders'), where('assignedDriverId', '==', user.uid), where('status', '==', 'Out for Delivery'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedDeliveries: Order[] = [];
        querySnapshot.forEach((doc) => fetchedDeliveries.push({ id: doc.id, ...doc.data() } as Order));
        fetchedDeliveries.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
        setDeliveries(fetchedDeliveries);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading]);

  const confirmDelivery = async (orderId: string, confirmationCode: string) => {
    if (!user) {
        toast.error("Você precisa estar logado.");
        return;
    }
    const toastId = toast.loading('Confirmando entrega...');
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/drivers/confirm-delivery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ orderId, confirmationCode }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        toast.success(result.message, { id: toastId });
    } catch (error: any) {
        toast.error(error.message || 'Falha ao confirmar entrega.', { id: toastId });
    }
  };

  return { deliveries, isLoading: authLoading || isLoading, confirmDelivery };
};
