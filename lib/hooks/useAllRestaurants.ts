import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  slug?: string;
  description?: string;
}

export const useAllRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Query all restaurants, ordered by name
    const q = query(
      collection(db, 'restaurants'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedRestaurants: Restaurant[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedRestaurants.push({
            id: doc.id,
            name: data.name || 'Restaurante sem nome',
            logoUrl: data.logoUrl,
            address: data.address,
            slug: data.slug,
            description: data.description
          });
        });

        setRestaurants(fetchedRestaurants);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching restaurants:', error);
        setError('Erro ao carregar restaurantes');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { restaurants, isLoading, error };
};
