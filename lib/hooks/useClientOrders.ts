import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Order } from '../types/track/order';

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

export const useClientOrders = () => {
  const [user, authLoading] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    
    // Query orders where the client is the buyer
    const q = query(
      collection(db, 'orders'), 
      where('clientId', '==', user.uid)
    );
    
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
      
      console.log(`✅ ${fetchedOrders.length} pedidos do cliente carregados`);
      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error('❌ Erro ao carregar pedidos do cliente:', error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, authLoading]);

  return { orders, isLoading: authLoading || isLoading };
};
