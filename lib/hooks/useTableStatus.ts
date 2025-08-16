// lib/hooks/useTableStatus.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// Interfaces necessárias
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
  lastActivity?: Timestamp;
  isInPayment?: boolean; // Novo campo para controlar se está no pagamento
}

export interface Order {
  id: string;
  items: any[];
  totalAmount: number;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Ready to Serve' | 'Delivered' | 'Ready for Delivery' | 'Out for Delivery' | 'Completed' | 'Returned' | 'Canceled' | 'Confirmed';
  createdAt: Timestamp;
  restaurantId: string;
  isDelivery: boolean;
  deliveryAddress?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  confirmationCode?: string;
  source?: 'waiter' | 'online' | 'waiter-bill';
  tableId?: string;
  paymentMethod?: 'together' | 'separated';
}

// Tipos de status das mesas
export type TableStatus = 'free' | 'active' | 'unsent' | 'pending' | 'ready-to-serve';

// Interface para o retorno do hook
export interface TableWithStatus {
  id: number;
  status: TableStatus;
  hasUnsentItems: boolean;
  hasPendingOrders: boolean;
  hasReadyOrders: boolean;
  hasDeliveredOrders: boolean;
  isInPayment: boolean;
  lastActivity?: Timestamp;
  unsentItemsCount: number;
  activeOrdersCount: number;
}

export const useTableStatus = (physicalTableIds: number[]) => {
  const [user] = useAuthState(auth);
  const [tableStates, setTableStates] = useState<Record<string, TableState>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listener para estados das mesas (tableStates)
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    //console.log('🔍 useTableStatus: Iniciando listener para tableStates, usuário:', user.uid);

    const tableStatesQuery = query(
      collection(db, 'tableStates'),
      where('restaurantId', '==', user.uid)
    );

    const unsubscribeTableStates = onSnapshot(tableStatesQuery, (querySnapshot) => {
      //console.log('📊 useTableStatus: TableStates snapshot recebido, documentos:', querySnapshot.size);
      
      const loadedTableStates: Record<string, TableState> = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tableId = doc.id.replace(`${user.uid}_`, '');
        
        // console.log('📄 TableState encontrado:', {
        //   docId: doc.id,
        //   tableId: tableId,
        //   data: data
        // });
        
        loadedTableStates[tableId] = {
          seats: data.seats || [{ id: 1, items: [] }],
          paymentMethod: data.paymentMethod || 'together',
          lastActivity: data.lastActivity,
          isInPayment: data.isInPayment || false
        };
      });

      //console.log('✅ TableStates carregados:', loadedTableStates);
      setTableStates(loadedTableStates);
    }, (error) => {
      console.error('❌ Error loading table states:', error);
    });

    return () => unsubscribeTableStates();
  }, [user]);

  // Listener para pedidos (orders)
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    //console.log('🔍 useTableStatus: Iniciando listener para orders, usuário:', user.uid);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (querySnapshot) => {
      //console.log('📋 useTableStatus: Orders snapshot recebido, documentos:', querySnapshot.size);
      
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() } as Order;
        fetchedOrders.push(orderData);
      });

      // Filtrar apenas pedidos de garçom com tableId
      const waiterOrders = fetchedOrders.filter(order => 
        order.source === 'waiter' && order.tableId
      );

      //console.log('📋 Pedidos de garçom filtrados:', waiterOrders.length);
      setOrders(waiterOrders);
      setIsLoading(false);
    }, (error) => {
      console.error('❌ Error loading orders:', error);
      setIsLoading(false);
    });

    return () => unsubscribeOrders();
  }, [user]);

  // Calcular status das mesas
  const tablesWithStatus = useMemo((): TableWithStatus[] => {
    //console.log('🧮 useTableStatus: Calculando status das mesas...');
    
    return physicalTableIds.map(tableId => {
      const tableIdStr = tableId.toString();
      const tableState = tableStates[tableIdStr];
      
      // Análise dos pedidos desta mesa
      const tableOrders = orders.filter(order => 
        order.tableId?.toString() === tableIdStr
      );
      
      // Categorizar pedidos por status
      const pendingOrders = tableOrders.filter(o => o.status === 'In Progress');
      const readyOrders = tableOrders.filter(o => o.status === 'Ready to Serve');
      const deliveredOrders = tableOrders.filter(o => o.status === 'Delivered');
      const completedOrders = tableOrders.filter(o => o.status === 'Completed');
      
      // Análise de itens não enviados
      const unsentItems = tableState?.seats?.flatMap(seat => 
        seat.items?.filter(item => !item.submitted) || []
      ) || [];
      
      // Flags de estado
      const hasUnsentItems = unsentItems.length > 0;
      const hasPendingOrders = pendingOrders.length > 0;
      const hasReadyOrders = readyOrders.length > 0;
      const hasDeliveredOrders = deliveredOrders.length > 0;
      const isInPayment = tableState?.isInPayment || false;
      
      // Verifica se há qualquer atividade na mesa
      const hasAnyActivity = 
        hasUnsentItems || 
        hasPendingOrders || 
        hasReadyOrders || 
        hasDeliveredOrders ||
        isInPayment;
      
      // Determinar status da mesa com hierarquia de prioridade
      let status: TableStatus = 'free';
      
      if (hasAnyActivity) {
        status = 'active'; // Base: mesa tem atividade
        
        // Aplicar prioridades (da menor para a maior)
        if (hasPendingOrders) {
          status = 'pending'; // Na cozinha
        }
        
        if (hasUnsentItems) {
          status = 'unsent'; // Itens não enviados (alta prioridade)
        }
        
        if (hasReadyOrders) {
          status = 'ready-to-serve'; // Pronto para servir (máxima prioridade)
        }
      }
      
      // // Log detalhado para debug
      // console.log(`🔍 Mesa ${tableId} - Status: ${status}`, {
      //   hasUnsentItems,
      //   hasPendingOrders,
      //   hasReadyOrders,
      //   hasDeliveredOrders,
      //   isInPayment,
      //   hasAnyActivity,
      //   unsentItemsCount: unsentItems.length,
      //   activeOrdersCount: pendingOrders.length + readyOrders.length,
      //   totalOrders: tableOrders.length,
      //   seatsWithItems: tableState?.seats?.filter(seat => seat.items?.length > 0)?.length || 0
      // });
      
      return {
        id: tableId,
        status,
        hasUnsentItems,
        hasPendingOrders,
        hasReadyOrders,
        hasDeliveredOrders,
        isInPayment,
        lastActivity: tableState?.lastActivity,
        unsentItemsCount: unsentItems.length,
        activeOrdersCount: pendingOrders.length + readyOrders.length
      };
    });
  }, [physicalTableIds, tableStates, orders]);

  // Função para obter contadores gerais
  const getStatusCounts = useMemo(() => {
    const counts = {
      free: 0,
      active: 0,
      unsent: 0,
      pending: 0,
      'ready-to-serve': 0
    };
    
    tablesWithStatus.forEach(table => {
      counts[table.status]++;
    });
    
    return counts;
  }, [tablesWithStatus]);

  // Função para obter mesas com notificações (prontas para servir)
  const getTablesWithNotifications = useMemo(() => {
    return tablesWithStatus
      .filter(table => table.status === 'ready-to-serve')
      .map(table => table.id.toString());
  }, [tablesWithStatus]);

  return {
    tablesWithStatus,
    tableStates,
    orders,
    isLoading,
    statusCounts: getStatusCounts,
    tablesWithNotifications: getTablesWithNotifications,
    // Função utilitária para obter status de uma mesa específica
    getTableStatus: (tableId: number) => {
      return tablesWithStatus.find(table => table.id === tableId);
    }
  };
};