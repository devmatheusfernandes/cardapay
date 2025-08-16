import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export interface Waiter {
  id: string;
  name: string;
  phone: string;
  email: string;
  restaurantId: string;
}

export const useWaiters = () => {
  const [user, authLoading] = useAuthState(auth);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'waiters'), where('restaurantId', '==', user.uid));

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const fetchedWaiters: Waiter[] = [];
        querySnapshot.forEach((doc) => {
          fetchedWaiters.push({ id: doc.id, ...doc.data() } as Waiter);
        });
        setWaiters(fetchedWaiters);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching waiters:", error);
        toast.error("Could not fetch waiters.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Função para associar um garçom usando a nova rota de API
  const associateWaiterByCode = async (code: string) => {
    console.log("useWaiters: Starting waiter association for code:", code);
    
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }
    if (!code.trim()) {
        toast.error("Please enter a waiter code.");
        return;
    }

    const toastId = toast.loading('Adicionando garçom...');
    
    try {
        console.log("useWaiters: Getting ID token...");
        const idToken = await user.getIdToken();
        console.log("useWaiters: Making API request to /api/waiters/associate");
        
        const response = await fetch('/api/waiters/associate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ code }),
        });

        console.log("useWaiters: API response status:", response.status);
        const result = await response.json();
        console.log("useWaiters: API response:", result);

        if (!response.ok) {
            throw new Error(result.error || "Failed to add waiter.");
        }

        toast.success(result.message, { id: toastId });
        console.log("useWaiters: Waiter association successful");

    } catch (error: any) {
        console.error("useWaiters: Error associating waiter:", error);
        toast.error(error.message, { id: toastId });
        throw error; // Re-throw to let the calling component handle it
    }
  };

  const removeWaiter = async (waiterId: string) => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    const toastId = toast.loading('Removendo garçom...');
    
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/waiters/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ waiterId }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to remove waiter.");
        }

        toast.success(result.message, { id: toastId });

    } catch (error: any) {
        console.error("Error removing waiter:", error);
        toast.error(error.message, { id: toastId });
        throw error;
    }
  };

  return { waiters, isLoading: authLoading || isLoading, associateWaiterByCode, removeWaiter };
};
