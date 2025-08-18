import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Order } from '../types/track/order';
import { safeTimestampToDate } from '../utils/timestamp';

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
          // Convert createdAt to Timestamp using safeTimestampToDate utility
          const createdAt = safeTimestampToDate(data.createdAt);
          
          const order: Order = {
            id: doc.id,
            ...data,
            createdAt: Timestamp.fromDate(createdAt) // Convert back to Timestamp for consistency
          } as Order;
          
          fetchedOrders.push(order);
        } catch (error) {
          console.error(`Erro ao processar pedido ${doc.id}:`, error, data);
          // Skip this order if there's a conversion error
        }
      });
      
      // Sort by creation date (newest first)
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
