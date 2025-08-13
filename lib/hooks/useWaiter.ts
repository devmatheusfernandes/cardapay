// lib/hooks/useWaiter.ts - VERSÃO CORRIGIDA
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { MenuItem, SizeOption, AddonOption, StuffedCrustOption } from './useMenuWaiter';
import { Order } from './useOrders';
import { useTablePaymentStatus } from './useTablePaymentStatus';

// Interface atualizada para incluir opções de borda recheada e ingredientes removidos
export interface WaiterOrderItem {
  size: any;
  id(id: any): void;
  addons: boolean;
  stuffedCrust: any;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  submitted?: boolean;
  selectedSize?: SizeOption;
  selectedAddons?: AddonOption[];
  selectedStuffedCrust?: StuffedCrustOption;
  removedIngredients?: string[];
}

export interface Seat {
  id: number;
  items: WaiterOrderItem[];
}

export interface TableState {
  seats: Seat[];
  paymentMethod: 'together' | 'separated';
  lastActivity?: Timestamp;
  isInPayment?: boolean;
}

export const useWaiter = (tableId: string) => {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [tableState, setTableState] = useState<TableState>({
    seats: [{ id: 1, items: [] }],
    paymentMethod: 'together',
    isInPayment: false
  });
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  
  // Hook para gerenciar status de pagamento
  const { setTableInPayment, clearTableState } = useTablePaymentStatus();

  // Listener para o estado da mesa
  useEffect(() => {
    if (!user) return;

    const docId = `${user.uid}_${tableId}`;
    const docRef = doc(db, 'tableStates', docId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setTableState({
          seats: data.seats || [{ id: 1, items: [] }],
          paymentMethod: data.paymentMethod || 'together',
          lastActivity: data.lastActivity,
          isInPayment: data.isInPayment || false
        });
        console.log('📊 Estado da mesa atualizado:', data);
      } else {
        console.log('📊 Mesa não existe no Firebase, usando estado inicial');
        setTableState({
          seats: [{ id: 1, items: [] }],
          paymentMethod: 'together',
          isInPayment: false
        });
      }
    });

    return () => unsubscribe();
  }, [user, tableId]);

  // Listener para pedidos da cozinha
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid),
      where('source', '==', 'waiter'),
      where('tableId', '==', tableId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      // Filtrar apenas pedidos ativos (não completados/cancelados)
      const activeOrders = orders.filter(order => 
        !['Completed', 'Canceled'].includes(order.status)
      );
      
      setKitchenOrders(activeOrders);
      console.log('🍳 Pedidos da cozinha atualizados:', activeOrders);
    });

    return () => unsubscribe();
  }, [user, tableId]);

  // Função CORRIGIDA para remover undefined (mas preservar serverTimestamp)
  const cleanFirebaseData = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    // ✅ PRESERVAR serverTimestamp - não processar este objeto especial
    if (obj && typeof obj === 'object' && obj._methodName === 'serverTimestamp') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj
        .map(item => cleanFirebaseData(item))
        .filter(item => item !== null && item !== undefined);
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          const cleanedValue = cleanFirebaseData(value);
          if (cleanedValue !== null && cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : null;
    }
    
    return obj;
  };

  // Salvar estado no Firebase
  const saveTableState = useCallback(async (newState: TableState) => {
    if (!user) return;

    try {
      const docId = `${user.uid}_${tableId}`;
      const docRef = doc(db, 'tableStates', docId);

      // Dados limpos para o tableState
      const stateData = {
        ...newState,
        restaurantId: user.uid,
        lastActivity: serverTimestamp() // ✅ Manter como serverTimestamp
      };

      // Limpar apenas os campos que não são timestamps
      const cleanedSeats = cleanFirebaseData(stateData.seats);
      
      const finalData = {
        seats: cleanedSeats,
        paymentMethod: stateData.paymentMethod,
        restaurantId: stateData.restaurantId,
        lastActivity: stateData.lastActivity, // ✅ Preservar serverTimestamp
        ...(stateData.isInPayment !== undefined && { isInPayment: stateData.isInPayment })
      };

      await setDoc(docRef, finalData);
      console.log('💾 Estado da mesa salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar estado da mesa:', error);
      toast.error('Erro ao salvar alterações da mesa');
    }
  }, [user, tableId]);

  // Adicionar nova pessoa/assento
  const addSeat = useCallback(() => {
    const newSeat: Seat = {
      id: tableState.seats.length + 1,
      items: []
    };

    const newState = {
      ...tableState,
      seats: [...tableState.seats, newSeat]
    };

    setTableState(newState);
    saveTableState(newState);
    toast.success(`Pessoa ${newSeat.id} adicionada à mesa`);
  }, [tableState, saveTableState]);

  // Adicionar item ao assento
  const addItemToSeat = useCallback((
    seatId: number,
    menuItem: MenuItem,
    notes: string = '',
    selectedSize?: SizeOption,
    selectedAddons: AddonOption[] = [],
    selectedStuffedCrust?: StuffedCrustOption,
    removedIngredients: string[] = []
  ) => {
    const newItem: WaiterOrderItem = {
      productId: menuItem.id,
      name: menuItem.name,
      quantity: 1,
      price: selectedSize ? selectedSize.price : menuItem.basePrice,
      submitted: false
    };

    // Adicionar campos opcionais apenas se tiverem valor
    if (notes && notes.trim()) {
      newItem.notes = notes.trim();
    }

    if (selectedSize) {
      newItem.selectedSize = selectedSize;
    }

    if (selectedAddons && selectedAddons.length > 0) {
      newItem.selectedAddons = selectedAddons;
    }

    if (selectedStuffedCrust) {
      newItem.selectedStuffedCrust = selectedStuffedCrust;
    }

    if (removedIngredients && removedIngredients.length > 0) {
      newItem.removedIngredients = removedIngredients;
    }

    const newState = {
      ...tableState,
      seats: tableState.seats.map(seat =>
        seat.id === seatId
          ? { ...seat, items: [...seat.items, newItem] }
          : seat
      )
    };

    setTableState(newState);
    saveTableState(newState);
  }, [tableState, saveTableState]);

  // Remover item do assento
  const removeItemFromSeat = useCallback((seatId: number, itemIndex: number) => {
    const newState = {
      ...tableState,
      seats: tableState.seats.map(seat =>
        seat.id === seatId
          ? {
              ...seat,
              items: seat.items.filter((_, index) => index !== itemIndex)
            }
          : seat
      )
    };

    setTableState(newState);
    saveTableState(newState);
    toast.success('Item removido');
  }, [tableState, saveTableState]);

  // Definir método de pagamento
  const setPaymentMethod = useCallback((method: 'together' | 'separated') => {
    const newState = {
      ...tableState,
      paymentMethod: method
    };

    setTableState(newState);
    saveTableState(newState);
  }, [tableState, saveTableState]);

  // Calcular preço total de um item
  const calculateItemPrice = useCallback((item: WaiterOrderItem): number => {
    let total = item.selectedSize ? item.selectedSize.price : item.price;
    
    // Adicionar preços dos adicionais
    if (item.selectedAddons) {
      total += item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    }
    
    // Adicionar preço da borda recheada
    if (item.selectedStuffedCrust) {
      total += item.selectedStuffedCrust.price;
    }
    
    return total;
  }, []);

  // ✅ FUNÇÃO PRINCIPAL CORRIGIDA - Enviar novos itens para a cozinha
  const sendToKitchen = useCallback(async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsLoading(true);

    try {
      // Obter apenas itens não enviados
      const unsentItems: any[] = [];
      
      tableState.seats.forEach(seat => {
        seat.items.forEach(item => {
          if (!item.submitted) {
            // Preparar opções para salvar no Firebase (apenas IDs e valores válidos)
            const options: any = {};
            
            if (item.selectedSize) {
              options.size = item.selectedSize.id;
            }
            
            if (item.selectedAddons && item.selectedAddons.length > 0) {
              options.addons = item.selectedAddons.map(addon => addon.id);
            }
            
            if (item.selectedStuffedCrust) {
              options.stuffedCrust = item.selectedStuffedCrust.id;
            }
            
            if (item.removedIngredients && item.removedIngredients.length > 0) {
              options.removableIngredients = item.removedIngredients;
            }
            
            if (item.notes && item.notes.trim()) {
              options.notes = item.notes.trim();
            }

            // Criar item para o pedido
            const orderItem: any = {
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: calculateItemPrice(item),
              seat: seat.id,
              
              // ✅ INCLUIR TAMBÉM AS OPÇÕES COMPLETAS para compatibilidade
              selectedSize: item.selectedSize || null,
              selectedAddons: item.selectedAddons || null,
              selectedStuffedCrust: item.selectedStuffedCrust || null,
              removedIngredients: item.removedIngredients || null
            };

            // Adicionar opções apenas se existirem
            if (Object.keys(options).length > 0) {
              orderItem.options = options;
            }

            // Adicionar notes apenas se existir
            if (item.notes && item.notes.trim()) {
              orderItem.notes = item.notes.trim();
            }

            unsentItems.push(orderItem);
          }
        });
      });

      if (unsentItems.length === 0) {
        toast.error('Não há itens novos para enviar');
        return;
      }

      // Calcular total do pedido
      const totalAmount = unsentItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      // ✅ CRIAR DADOS DO PEDIDO SEM PROCESSAR O serverTimestamp
      const orderData = {
        restaurantId: user.uid,
        tableId: tableId,
        items: cleanFirebaseData(unsentItems), // Limpar apenas os items
        totalAmount,
        status: 'In Progress',
        createdAt: serverTimestamp(), // ✅ MANTER como está - Firebase vai processar
        isDelivery: false,
        source: 'waiter',
        paymentMethod: tableState.paymentMethod
      };

      console.log('📤 Enviando pedido para Firebase:', {
        ...orderData,
        createdAt: '[serverTimestamp]' // Log sem mostrar o objeto real
      });

      // Criar pedido na coleção 'orders'
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      console.log('✅ Pedido criado com ID:', docRef.id);

      // Marcar todos os itens como enviados
      const newState = {
        ...tableState,
        seats: tableState.seats.map(seat => ({
          ...seat,
          items: seat.items.map(item => ({
            ...item,
            submitted: true
          }))
        }))
      };

      setTableState(newState);
      await saveTableState(newState);

      toast.success(`${unsentItems.length} itens enviados para a cozinha!`);
    } catch (error) {
      console.error('❌ Erro ao enviar pedido:', error);
      toast.error('Erro ao enviar pedido para a cozinha');
    } finally {
      setIsLoading(false);
    }
  }, [user, tableId, tableState, saveTableState, calculateItemPrice]);

  // Marcar pedido como entregue
  const markAsDelivered = useCallback(async (orderId: string) => {
    setIsLoading(true);

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Delivered'
      });

      toast.success('Pedido marcado como entregue!');
    } catch (error) {
      console.error('❌ Erro ao marcar pedido como entregue:', error);
      toast.error('Erro ao atualizar status do pedido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Preparar conta final e ir para pagamento
  const prepareFinalBill = useCallback(async (): Promise<string | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    // Verificar se há itens não enviados
    const hasUnsentItems = tableState.seats.some(seat =>
      seat.items.some(item => !item.submitted)
    );

    if (hasUnsentItems) {
      toast.error('Existem itens que ainda não foram enviados para a cozinha');
      return null;
    }

    // Verificar se há pedidos não entregues
    const hasUndeliveredOrders = kitchenOrders.some(order =>
      order.status !== 'Delivered'
    );

    if (hasUndeliveredOrders) {
      toast.error('Existem pedidos que ainda não foram entregues');
      return null;
    }

    setIsLoading(true);

    try {
      // Marcar mesa como em processo de pagamento
      await setTableInPayment(tableId);

      // Calcular total geral
      const totalAmount = kitchenOrders.reduce(
        (sum, order) => sum + order.totalAmount, 
        0
      );

      // Criar registro de conta para pagamento
      const billData = {
        restaurantId: user.uid,
        tableId: tableId,
        orders: kitchenOrders.map(order => order.id),
        totalAmount,
        paymentMethod: tableState.paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp(), // ✅ serverTimestamp aqui também
        seats: cleanFirebaseData(tableState.seats.filter(seat => seat.items.length > 0))
      };

      const billDoc = await addDoc(collection(db, 'bills'), billData);

      console.log('💳 Conta criada para pagamento:', billDoc.id);
      toast.success('Redirecionando para pagamento...');
      
      return billDoc.id;
    } catch (error) {
      console.error('❌ Erro ao preparar conta:', error);
      toast.error('Erro ao processar conta para pagamento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, tableId, tableState, kitchenOrders, setTableInPayment]);

  // Finalizar mesa (após pagamento bem-sucedido)
  const finalizeBill = useCallback(async (billId: string): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      // Marcar todos os pedidos como completados
      const orderUpdates = kitchenOrders.map(order =>
        updateDoc(doc(db, 'orders', order.id), { status: 'Completed' })
      );

      await Promise.all(orderUpdates);

      // Marcar conta como paga
      await updateDoc(doc(db, 'bills', billId), {
        status: 'paid',
        paidAt: serverTimestamp() // ✅ serverTimestamp aqui também
      });

      // Limpar completamente o estado da mesa
      await clearTableState(tableId);

      toast.success('Mesa finalizada com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao finalizar mesa:', error);
      toast.error('Erro ao finalizar mesa');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, kitchenOrders, clearTableState, tableId]);

  return {
    isLoading,
    tableState,
    kitchenOrders,
    addSeat,
    addItemToSeat,
    removeItemFromSeat,
    setPaymentMethod,
    sendToKitchen,
    markAsDelivered,
    prepareFinalBill,
    finalizeBill,
    calculateItemPrice
  };
};