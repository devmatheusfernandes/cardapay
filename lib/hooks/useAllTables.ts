// lib/hooks/useAllTables.ts
'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
  notes?: string;
  submitted?: boolean;
}

export interface Seat {
  id: number;
  items: OrderItem[];
}

export interface TableState {
  seats: Seat[];
  paymentMethod: 'together' | 'separated';
}

export const useAllTables = () => {
  const [user] = useAuthState(auth);
  const [tables, setTables] = useState<Record<string, TableState>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    console.log('🔍 useAllTables: Iniciando listener para usuário:', user.uid);

    // Escutar mudanças em tempo real nos estados das mesas
    const q = query(
      collection(db, 'tableStates'),
      where('restaurantId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('📊 useAllTables: Snapshot recebido, documentos:', querySnapshot.size);
      
      const loadedTables: Record<string, TableState> = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Extrair o tableId do documento ID (formato: userId_tableId)
        const tableId = doc.id.replace(`${user.uid}_`, '');
        
        console.log('📄 Documento encontrado:', {
          docId: doc.id,
          tableId: tableId,
          data: data
        });
        
        loadedTables[tableId] = {
          seats: data.seats || [{ id: 1, items: [] }],
          paymentMethod: data.paymentMethod || 'together'
        };
      });

      console.log('✅ Tables carregadas:', loadedTables);
      setTables(loadedTables);
      setIsLoading(false);
    }, (error) => {
      console.error('❌ Error loading all table states:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return {
    tables,
    isLoading
  };
};