// lib/hooks/useBills.ts
'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Order } from './useOrders'; // We can reuse the Order interface as the structure is similar

// The Bill interface is essentially the same as an Order for this purpose
export type Bill = Order;

export const useBills = () => {
  const [user, authLoading] = useAuthState(auth);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    // Query to get all documents from the 'bills' collection for the current restaurant
    const q = query(collection(db, 'bills'), where('restaurantId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedBills: Bill[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBills.push({ id: doc.id, ...doc.data() } as Bill);
      });
      // Sort bills by creation date, newest first
      fetchedBills.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setBills(fetchedBills);
      setIsLoading(false);
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, [user, authLoading]);

  return { bills, isLoading };
};