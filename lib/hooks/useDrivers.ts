import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  restaurantId: string;
}

export const useDrivers = () => {
  const [user, authLoading] = useAuthState(auth);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'drivers'), where('restaurantId', '==', user.uid));

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const fetchedDrivers: Driver[] = [];
        querySnapshot.forEach((doc) => {
          fetchedDrivers.push({ id: doc.id, ...doc.data() } as Driver);
        });
        setDrivers(fetchedDrivers);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching drivers:", error);
        toast.error("Could not fetch drivers.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Função para associar um entregador usando a nova rota de API
  const associateDriverByCode = async (code: string) => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }
    if (!code.trim()) {
        toast.error("Please enter a driver code.");
        return;
    }

    const toastId = toast.loading('Adicionando entregador...');
    
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/drivers/associate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ code }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to add driver.");
        }

        toast.success(result.message, { id: toastId });

    } catch (error: any) {
        console.error("Error associating driver:", error);
        toast.error(error.message, { id: toastId });
    }
  };

  return { drivers, isLoading: authLoading || isLoading, associateDriverByCode };
};
