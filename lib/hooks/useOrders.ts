import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// --- INÍCIO DAS ALTERAÇÕES ---
// Se estes tipos não estiverem aqui, adicione-os ou importe-os
export interface SizeOption { id: string; name: string; price: number; }
export interface AddonOption { id: string; name: string; price: number; }
export interface StuffedCrustOption { id: string; name: string; price: number; }

// 1. NOVA INTERFACE para representar as opções como são salvas no Firebase (apenas IDs).
export interface OrderOptions {
  size?: string;
  addons?: string[];
  stuffedCrust?: string;
  removableIngredients?: string[];
  notes?: string;
}

// 2. INTERFACE ATUALIZADA para OrderItem, usando a nova interface OrderOptions.
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  seat?: number;
  options?: OrderOptions; // Usa a nova interface de opções

  selectedSize?: SizeOption;
  selectedAddons?: AddonOption[];
  selectedStuffedCrust?: StuffedCrustOption;
  removedIngredients?: string[];
}

// 3. INTERFACE ATUALIZADA para Order, usando o novo OrderItem.
export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Ready to Serve' | 'Delivered' | 'Ready for Delivery' | 'Out for Delivery' | 'Completed' | 'Returned' | 'Canceled' | 'Confirmed';
  createdAt: Timestamp;
  restaurantId: string;
  isDelivery: boolean;
  deliveryAddress?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  confirmationCode?: string;
  source?: 'waiter' | 'online' | 'waiter-bill';
  tableId?: string;
  paymentMethod?: 'together' | 'separated';
}

// --- FIM DAS ALTERAÇÕES ---


export const useOrders = () => {
  const [user, authLoading] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    const q = query(collection(db, 'orders'), where('restaurantId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        // Type assertion para garantir que o TypeScript confie na nossa nova estrutura
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
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