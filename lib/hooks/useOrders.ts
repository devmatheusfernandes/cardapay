import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed' | 'Returned' | 'Canceled';
  createdAt: Timestamp;
  restaurantId: string;
  isDelivery: boolean;
  deliveryAddress?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  confirmationCode?: string;
}

export const useOrders = () => {
  const [user, authLoading] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) { if (!authLoading) setIsLoading(false); return; }
    const q = query(collection(db, 'orders'), where('restaurantId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => fetchedOrders.push({ id: doc.id, ...doc.data() } as Order));
        fetchedOrders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setOrders(fetchedOrders);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status'], driverInfo?: { driverId: string; driverName: string }) => {
    const toastId = toast.loading('Atualizando status...');
    try {
      const orderRef = doc(db, 'orders', orderId);
      let dataToUpdate: any = { status: newStatus };
      if (newStatus === 'Out for Delivery' && driverInfo) {
        dataToUpdate.assignedDriverId = driverInfo.driverId;
        dataToUpdate.assignedDriverName = driverInfo.driverName;
      }
      await updateDoc(orderRef, dataToUpdate);
      toast.success('Status atualizado!', { id: toastId });
    } catch (error) {
      toast.error('Falha ao atualizar status.', { id: toastId });
    }
  };

  return { orders, isLoading: authLoading || isLoading, updateOrderStatus };
};
