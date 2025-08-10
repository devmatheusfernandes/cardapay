// lib/context/TableContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MenuItem } from '../hooks/useMenuWaiter';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-hot-toast';

// Adicionando as interfaces que faltam para o contexto
export interface SizeOption { id: string; name: string; price: number; }
export interface AddonOption { id: string; name: string; price: number; }
export interface StuffedCrustOption { id: string; name: string; price: number; }

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
  // Opções selecionadas pelo usuário
  selectedSize?: SizeOption;
  selectedAddons?: AddonOption[];
  selectedStuffedCrust?: StuffedCrustOption;
  removedIngredients?: string[];
}
export interface Seat {
  id: number;
  items: OrderItem[];
}

export interface TableState {
  seats: Seat[];
  paymentMethod: 'together' | 'separated';
}

interface TableContextType {
  tables: Record<string, TableState>;
  isLoading: boolean;
  getTableState: (tableId: string) => TableState;
  addSeat: (tableId: string) => Promise<void>;
  addItemToSeat: (
    tableId: string,
    seatId: number,
    item: MenuItem,
    notes: string,
    size?: SizeOption,
    addons?: AddonOption[],
    stuffedCrust?: StuffedCrustOption,
    removed?: string[]
) => Promise<void>;
  removeItemFromSeat: (tableId: string, seatId: number, itemId: string, notes?: string) => Promise<void>;
  setPaymentMethod: (tableId: string, method: 'together' | 'separated') => Promise<void>;
  clearTable: (tableId: string) => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

const defaultTableState: TableState = {
  seats: [{ id: 1, items: [] }],
  paymentMethod: 'together',
};

export const TableProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useAuthState(auth);
  const [tables, setTables] = useState<Record<string, TableState>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Carregar todos os estados das mesas do usuário
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Escutar mudanças em tempo real nos estados das mesas
    const q = query(
      collection(db, 'tableStates'),
      where('restaurantId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const loadedTables: Record<string, TableState> = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tableId = doc.id.replace(`${user.uid}_`, '');
        loadedTables[tableId] = {
          seats: data.seats || defaultTableState.seats,
          paymentMethod: data.paymentMethod || defaultTableState.paymentMethod
        };
      });

      setTables(loadedTables);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading table states:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getTableState = (tableId: string): TableState => {
    return tables[tableId] || defaultTableState;
  };

  const saveTableState = async (tableId: string, newState: TableState) => {
    if (!user) return;
    
    try {
      const tableDocRef = doc(db, 'tableStates', `${user.uid}_${tableId}`);
      await setDoc(tableDocRef, {
        ...newState,
        restaurantId: user.uid,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving table state:', error);
      toast.error('Erro ao salvar estado da mesa');
      throw error;
    }
  };

  const updateTableState = async (tableId: string, newState: Partial<TableState>) => {
    const currentState = getTableState(tableId);
    const updatedState = { ...currentState, ...newState };
    
    // Atualizar estado local imediatamente
    setTables(prev => ({
      ...prev,
      [tableId]: updatedState,
    }));

    // Salvar no Firebase
    await saveTableState(tableId, updatedState);
  };

  const addSeat = async (tableId: string) => {
    const currentSeats = getTableState(tableId).seats;
    await updateTableState(tableId, {
      seats: [...currentSeats, { id: currentSeats.length + 1, items: [] }],
    });
  };

const addItemToSeat = async (
    tableId: string,
    seatId: number,
    item: MenuItem,
    notes: string,
    size?: SizeOption,
    addons?: AddonOption[],
    stuffedCrust?: StuffedCrustOption,
    removed?: string[]
  ) => {
    const tableState = getTableState(tableId);

    // Criamos uma chave única para o item com base em suas opções
    // Isso garante que "Pizza G com bacon" seja diferente de "Pizza G sem bacon"
    const optionsKey = JSON.stringify({ size, addons, stuffedCrust, removed, notes });

    const newSeats = tableState.seats.map(seat => {
      if (seat.id === seatId) {
        // Procuramos por um item que seja o mesmo produto E tenha as mesmas opções
        const existingItemIndex = seat.items.findIndex(
          i => i.id === item.id && JSON.stringify({
            size: i.selectedSize,
            addons: i.selectedAddons,
            stuffedCrust: i.selectedStuffedCrust,
            removed: i.removedIngredients,
            notes: i.notes
          }) === optionsKey
        );

        let newItems;
        if (existingItemIndex > -1) {
          // Se já existe, apenas incrementa a quantidade
          newItems = [...seat.items];
          newItems[existingItemIndex].quantity += 1;
        } else {
          // Se não existe, adiciona como um novo item no pedido
          newItems = [
            ...seat.items,
            {
              ...item,
              quantity: 1,
              notes,
              selectedSize: size,
              selectedAddons: addons,
              selectedStuffedCrust: stuffedCrust,
              removedIngredients: removed,
            } as OrderItem, // Usamos 'as OrderItem' para garantir a tipagem
          ];
        }
        return { ...seat, items: newItems };
      }
      return seat;
    });

    await updateTableState(tableId, { seats: newSeats });
  };
  const removeItemFromSeat = async (tableId: string, seatId: number, itemId: string, notes?: string) => {
    const tableState = getTableState(tableId);
    const newSeats = tableState.seats.map(seat => {
      if (seat.id === seatId) {
        return {
          ...seat,
          items: seat.items.filter(i => !(i.id === itemId && i.notes === notes)),
        };
      }
      return seat;
    });
    await updateTableState(tableId, { seats: newSeats });
  };

  const setPaymentMethod = async (tableId: string, method: 'together' | 'separated') => {
    await updateTableState(tableId, { paymentMethod: method });
  };
  
  const clearTable = async (tableId: string) => {
    if (!user) return;
    
    try {
      // Resetar no Firestore para o estado padrão
      const tableDocRef = doc(db, 'tableStates', `${user.uid}_${tableId}`);
      await setDoc(tableDocRef, {
        ...defaultTableState,
        restaurantId: user.uid,
        lastUpdated: new Date()
      });

      // Remover do estado local
      setTables(prev => {
        const newTables = {...prev};
        delete newTables[tableId];
        return newTables;
      });
    } catch (error) {
      console.error('Error clearing table:', error);
      toast.error('Erro ao limpar mesa');
      throw error;
    }
  };

  return (
    <TableContext.Provider value={{ 
      tables, 
      isLoading,
      getTableState, 
      addSeat, 
      addItemToSeat, 
      removeItemFromSeat, 
      setPaymentMethod, 
      clearTable 
    }}>
      {children}
    </TableContext.Provider>
  );
};

export const useTables = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTables must be used within a TableProvider');
  }
  return context;
};