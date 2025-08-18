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

// Em lib/hooks/useOrders.ts

// A interface para opções salvas como IDs (geralmente de fontes mais simples como um pedido online)
export interface OrderOptions {
  size?: string;
  addons?: string[];
  stuffedCrust?: string;
  removableIngredients?: string[];
  notes?: string;
}

// INTERFACE CORRIGIDA para OrderItem
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number; // Preço final unitário do item com todas as opções

  // Opções salvas como IDs
  options?: OrderOptions;

  // Opções salvas como objetos completos (geralmente de fontes ricas como o app do garçom)
  selectedSize?: SizeOption;
  selectedStuffedCrust?: StuffedCrustOption;
  selectedAddons?: AddonOption[];
  removedIngredients?: string[];
  
  // A propriedade 'notes' pode ser parte de 'options' ou estar no nível principal
  notes?: string; 
  seat?: number;
}

export interface OrderSeat {
  id: number;
  name: string | null;
  seat?: number
}

// 3. INTERFACE ATUALIZADA para Order, usando o novo OrderItem.
export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Ready to Serve' | 'Delivered' | 'Ready for Delivery' | 'Out for Delivery' | 'Completed' | 'Returned' | 'Canceled' | 'Confirmed';
  createdAt: Timestamp;
  restaurantId: string;
  clientId?: string; // ID of the client who made the order (if logged in)
  isDelivery: boolean;
  deliveryAddress?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  confirmationCode?: string;
  source?: 'waiter' | 'online' | 'waiter-bill';
  tableId?: string;
  paymentMethod?: 'together' | 'separated';
  seatsInvolved?: OrderSeat[];
  seats: any;
}

// --- FIM DAS ALTERAÇÕES ---

// Função utilitária para converter valores do Firebase em Timestamp
const convertToTimestamp = (value: any): Timestamp => {
  // Se já é um Timestamp, retorna como está
  if (value && typeof value.toDate === 'function') {
    return value as Timestamp;
  }
  
  // Se é um objeto serverTimestamp não processado, usa o timestamp atual
  if (value && value._methodName === 'serverTimestamp') {
    console.warn('ServerTimestamp não processado detectado, usando timestamp atual');
    return Timestamp.now();
  }
  
  // Se é um objeto Date
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  
  // Se é um número (milliseconds)
  if (typeof value === 'number') {
    return Timestamp.fromMillis(value);
  }
  
  // Se é um objeto com seconds e nanoseconds
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds || 0);
  }
  
  // Fallback: usa o timestamp atual
  console.warn('Formato de timestamp não reconhecido, usando timestamp atual:', value);
  return Timestamp.now();
};

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
        const data = doc.data();
        
        try {
          // Converter createdAt para Timestamp usando nossa função utilitária
          const createdAt = convertToTimestamp(data.createdAt);
          
          const order: Order = {
            id: doc.id,
            ...data,
            createdAt // Garantir que seja sempre um Timestamp válido
          } as Order;
          
          fetchedOrders.push(order);
        } catch (error) {
          console.error(`Erro ao processar pedido ${doc.id}:`, error, data);
          // Pular este pedido se houver erro na conversão
        }
      });
      
      // Ordenar por data de criação (mais recentes primeiro)
      fetchedOrders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      
      console.log(`✅ ${fetchedOrders.length} pedidos carregados com timestamps válidos`);
      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error('❌ Erro ao carregar pedidos:', error);
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
      console.error('Erro ao atualizar status:', error);
      toast.error('Falha ao atualizar status.', { id: toastId });
    }
  };

  return { orders, isLoading: authLoading || isLoading, updateOrderStatus };
};

