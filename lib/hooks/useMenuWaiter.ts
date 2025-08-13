import { useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export interface SizeOption {
  description: any;
  id: string;
  name: string;
  price: number;
}

export interface AddonOption {
  description: string;
  id: string;
  name: string;
  price: number;
}

export interface StuffedCrustOption {
  id: string;
  name: string;
  price: number;
}

export interface StuffedCrust {
  price: any;
  description: ReactNode;
  available: boolean; // Padronizado para 'available'
  options: StuffedCrustOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  imageUrl?: string;
  sizes?: SizeOption[];
  addons?: AddonOption[];
  stuffedCrust?: StuffedCrust;
  removableIngredients?: string[];
}

export const useMenuWaiter = () => {
  const [user, authLoading] = useAuthState(auth);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'menuItems'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: MenuItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({ 
          id: doc.id, 
          ...data,
          // Garantir que arrays opcionais existam
          sizes: data.sizes || [],
          addons: data.addons || [],
          stuffedCrust: data.stuffedCrust || { available: false, options: [] }, // Ajustado aqui também

          
          removableIngredients: data.removableIngredients || []
        } as MenuItem);
      });
      setMenuItems(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return { menuItems, isLoading };
};