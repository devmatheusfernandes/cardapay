import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// Define the shape of an order item
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// Define the main Order type
export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Completed';
  createdAt: Timestamp;
  restaurantId: string; // This will be the owner's UID
}

export const useOrders = () => {
  const [user, authLoading] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time listener for the user's orders
  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'orders'), where('restaurantId', '==', user.uid));

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });
        // Sort orders by creation date, newest first
        fetchedOrders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setOrders(fetchedOrders);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        toast.error("Could not fetch orders.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Function to update the status of an order
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const toastId = toast.loading('Updating order status...');
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      toast.success('Order status updated!', { id: toastId });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Failed to update status.', { id: toastId });
    }
  };

  return { orders, isLoading: authLoading || isLoading, updateOrderStatus };
};
