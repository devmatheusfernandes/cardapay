import { useState, useCallback } from 'react';
import { doc, setDoc, Timestamp, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

// Firebase document structure (all fields optional except required ones)
interface FirebaseOrderData {
  id: string;
  restaurantId: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDelivery: boolean;
  sessionId?: string;
  clientId?: string;
  deliveryAddress?: string;
  confirmationCode?: string;
  metadata?: Record<string, any>;
}

export interface BackupOrder {
  id: string;
  sessionId?: string | null;
  restaurantId: string;
  clientId?: string | null;
  items: any[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'backup';
  createdAt: Date;
  isDelivery: boolean;
  deliveryAddress?: string | null;
  confirmationCode?: string | null;
  metadata?: {
    stripeSessionId?: string | null;
    paymentIntentId?: string | null;
    error?: string | null;
    backupReason?: string | null;
    confirmationCode?: string | null;
  };
}

const BACKUP_ORDERS_KEY = 'cardapay-backup-orders';

// Utility function to deeply clean objects of undefined values
const cleanFirestoreData = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)).filter(item => item !== undefined);
  }
  
  if (obj instanceof Date || obj instanceof Timestamp) {
    return obj;
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = cleanFirestoreData(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

// Convert Firebase document to BackupOrder
const convertFirebaseToBackupOrder = (doc: any): BackupOrder => {
  const data = doc.data();
  return {
    id: data.id,
    sessionId: data.sessionId || null,
    restaurantId: data.restaurantId,
    clientId: data.clientId || null,
    items: data.items || [],
    totalAmount: data.totalAmount,
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
    isDelivery: data.isDelivery,
    deliveryAddress: data.deliveryAddress || null,
    confirmationCode: data.confirmationCode || null,
    metadata: data.metadata || {}
  };
};

export const useOrderBackup = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Save order to local storage
  const saveToLocalStorage = useCallback((order: BackupOrder) => {
    try {
      const existingOrders = localStorage.getItem(BACKUP_ORDERS_KEY);
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      
      // Check if order already exists
      const existingIndex = orders.findIndex((o: BackupOrder) => o.id === order.id);
      if (existingIndex !== -1) {
        // Update existing order
        orders[existingIndex] = order;
      } else {
        // Add new order
        orders.push(order);
      }
      
      localStorage.setItem(BACKUP_ORDERS_KEY, JSON.stringify(orders));
      console.log(`✅ Order ${order.id} backed up to local storage`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save order to local storage:', error);
      return false;
    }
  }, []);

  // Save order to Firebase backup collection
  const saveToFirebase = useCallback(async (order: BackupOrder) => {
    try {
      // Create the base order data with proper typing
      const orderData: FirebaseOrderData = {
        id: order.id,
        restaurantId: order.restaurantId,
        items: order.items || [],
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.now(),
        isDelivery: order.isDelivery,
      };

      // Add optional fields only if they have values
      if (order.sessionId) {
        orderData.sessionId = order.sessionId;
      }
      
      if (order.clientId) {
        orderData.clientId = order.clientId;
      }
      
      if (order.deliveryAddress && order.deliveryAddress.trim() !== '') {
        orderData.deliveryAddress = order.deliveryAddress;
      }
      
      if (order.confirmationCode) {
        orderData.confirmationCode = order.confirmationCode;
      }
      
      if (order.metadata && Object.keys(order.metadata).length > 0) {
        const cleanMetadata = cleanFirestoreData(order.metadata);
        if (cleanMetadata && Object.keys(cleanMetadata).length > 0) {
          orderData.metadata = cleanMetadata;
        }
      }

      // Final cleaning pass to ensure no undefined values
      const cleanOrderData = cleanFirestoreData(orderData);

      console.log('📤 Sending to Firebase:', JSON.stringify(cleanOrderData, null, 2));

      await setDoc(doc(db, 'backup_orders', order.id), cleanOrderData);
      console.log(`✅ Order ${order.id} backed up to Firebase`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save order to Firebase:', error);
      console.error('❌ Error details:', error);
      return false;
    }
  }, []);

  // NEW: Fetch backup orders from Firebase
  const fetchBackupOrdersFromFirebase = useCallback(async (restaurantId?: string): Promise<BackupOrder[]> => {
    setIsFetching(true);
    try {
      console.log('🔍 Fetching backup orders from Firebase...', { restaurantId });
      
      let q;
      if (restaurantId) {
        // Query for specific restaurant
        q = query(
          collection(db, 'backup_orders'),
          where('restaurantId', '==', restaurantId),
          orderBy('createdAt', 'desc')
        );
      } else {
        // Query for all orders
        q = query(
          collection(db, 'backup_orders'),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const orders: BackupOrder[] = [];
      
      querySnapshot.forEach((doc) => {
        try {
          const order = convertFirebaseToBackupOrder(doc);
          orders.push(order);
        } catch (error) {
          console.error(`❌ Error converting document ${doc.id}:`, error);
        }
      });

      console.log(`✅ Fetched ${orders.length} backup orders from Firebase`);
      return orders;
    } catch (error) {
      console.error('❌ Failed to fetch backup orders from Firebase:', error);
      throw error;
    } finally {
      setIsFetching(false);
    }
  }, []);

// Modified createBackupOrder method in useOrderBackup.ts
const createBackupOrder = useCallback(async (params: {
  orderId: string;
  sessionId?: string | null;
  restaurantId: string;
  clientId?: string | null;
  cartItems: any[];
  totalAmount: number;
  isDelivery: boolean;
  deliveryAddress?: string | null;
}) => {
  const {
    orderId,
    sessionId,
    restaurantId,
    clientId,
    cartItems,
    totalAmount,
    isDelivery,
    deliveryAddress
  } = params;
  setIsBackingUp(true);
  
  try {
    const backupOrder: BackupOrder = {
      id: orderId,
      restaurantId,
      items: cartItems,
      totalAmount,
      status: 'pending',
      createdAt: new Date(),
      isDelivery,
      metadata: {
        backupReason: 'pre_checkout_backup'
      }
    };

    // Only add optional fields if they have actual values
    if (sessionId && sessionId !== 'pending' && sessionId !== '') {
      backupOrder.sessionId = sessionId;
      backupOrder.metadata!.stripeSessionId = sessionId;
    }
    
    if (clientId && clientId !== '') {
      backupOrder.clientId = clientId;
    }
    
    if (deliveryAddress && deliveryAddress.trim() !== '') {
      backupOrder.deliveryAddress = deliveryAddress.trim();
    }

    // Always save to local storage first (this should always work)
    const localSuccess = saveToLocalStorage(backupOrder);
    
    // Try Firebase backup, but don't fail if it doesn't work
    let firebaseSuccess = false;
    try {
      firebaseSuccess = await saveToFirebase(backupOrder);
    } catch (firebaseError) {
      console.warn(`⚠️ Firebase backup failed for order ${orderId}, continuing with local backup only:`, firebaseError);
      // Don't throw - continue with just local backup
    }

    if (localSuccess) {
      if (firebaseSuccess) {
        console.log(`✅ Order ${orderId} fully backed up to both locations`);
      } else {
        console.log(`⚠️ Order ${orderId} backed up to local storage only (Firebase failed)`);
      }
      return true; // Success if at least local backup worked
    } else {
      console.error(`❌ Failed to backup order ${orderId} even to local storage`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating backup order:', error);
    return false;
  } finally {
    setIsBackingUp(false);
  }
}, [saveToLocalStorage, saveToFirebase]);

  // Update order status
  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: BackupOrder['status'],
    metadata?: Partial<BackupOrder['metadata']>
  ) => {
    try {
      // Update local storage
      const existingOrders = localStorage.getItem(BACKUP_ORDERS_KEY);
      if (existingOrders) {
        const orders = JSON.parse(existingOrders);
        const orderIndex = orders.findIndex((o: BackupOrder) => o.id === orderId);
        
        if (orderIndex !== -1) {
          orders[orderIndex].status = status;
          orders[orderIndex].metadata = { ...orders[orderIndex].metadata, ...metadata };
          localStorage.setItem(BACKUP_ORDERS_KEY, JSON.stringify(orders));
        }
      }

      // Update Firebase - only include fields that have values
      const orderData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (metadata) {
        const cleanMetadata = cleanFirestoreData(metadata);
        if (cleanMetadata && Object.keys(cleanMetadata).length > 0) {
          orderData.metadata = cleanMetadata;
        }
      }

      await setDoc(doc(db, 'backup_orders', orderId), orderData, { merge: true });
      console.log(`✅ Order ${orderId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update order status:', error);
      return false;
    }
  }, []);

  // UPDATED: Get all backup orders - now tries Firebase first, falls back to localStorage
  const getBackupOrders = useCallback(async (restaurantId?: string): Promise<BackupOrder[]> => {
    try {
      // Try Firebase first
      const firebaseOrders = await fetchBackupOrdersFromFirebase(restaurantId);
      if (firebaseOrders.length > 0) {
        return firebaseOrders;
      }
      
      // Fall back to localStorage if Firebase has no orders
      const existingOrders = localStorage.getItem(BACKUP_ORDERS_KEY);
      const localOrders: BackupOrder[] = existingOrders ? JSON.parse(existingOrders) : [];
      
      // Filter by restaurant if specified
      if (restaurantId) {
        return localOrders.filter(order => order.restaurantId === restaurantId);
      }
      
      return localOrders;
    } catch (error) {
      console.error('❌ Failed to get backup orders from Firebase, trying localStorage:', error);
      
      // Fall back to localStorage
      try {
        const existingOrders = localStorage.getItem(BACKUP_ORDERS_KEY);
        const localOrders: BackupOrder[] = existingOrders ? JSON.parse(existingOrders) : [];
        
        if (restaurantId) {
          return localOrders.filter(order => order.restaurantId === restaurantId);
        }
        
        return localOrders;
      } catch (localError) {
        console.error('❌ Failed to get backup orders from localStorage too:', localError);
        return [];
      }
    }
  }, [fetchBackupOrdersFromFirebase]);

  // Get specific backup order
  const getBackupOrder = useCallback(async (orderId: string) => {
    try {
      const orders = await getBackupOrders();
      return orders.find((o: BackupOrder) => o.id === orderId);
    } catch (error) {
      console.error('❌ Failed to get backup order:', error);
      return null;
    }
  }, [getBackupOrders]);

  // Clean up old backup orders (older than 30 days)
  const cleanupOldBackups = useCallback(async () => {
    try {
      const orders = await getBackupOrders();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredOrders = orders.filter((order: BackupOrder) => 
        new Date(order.createdAt) > thirtyDaysAgo
      );
      
      if (filteredOrders.length !== orders.length) {
        localStorage.setItem(BACKUP_ORDERS_KEY, JSON.stringify(filteredOrders));
        console.log(`🧹 Cleaned up ${orders.length - filteredOrders.length} old backup orders`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old backups:', error);
    }
  }, [getBackupOrders]);

  // Mark order as completed (successful payment)
  const markOrderCompleted = useCallback(async (orderId: string, confirmationCode?: string) => {
    const metadata: any = {
      backupReason: 'payment_successful'
    };
    
    if (confirmationCode) {
      metadata.confirmationCode = confirmationCode;
    }
    
    return await updateOrderStatus(orderId, 'completed', metadata);
  }, [updateOrderStatus]);

  // Mark order as failed
  const markOrderFailed = useCallback(async (orderId: string, error: string) => {
    return await updateOrderStatus(orderId, 'failed', {
      backupReason: 'payment_failed',
      error
    });
  }, [updateOrderStatus]);

  // Recover failed orders for manual processing
  const getFailedOrders = useCallback(async () => {
    try {
      const orders = await getBackupOrders();
      return orders.filter((o: BackupOrder) => o.status === 'failed');
    } catch (error) {
      console.error('❌ Failed to get failed orders:', error);
      return [];
    }
  }, [getBackupOrders]);

  // Export backup orders for customer support
  const exportBackupOrders = useCallback(async () => {
    try {
      const orders = await getBackupOrders();
      const dataStr = JSON.stringify(orders, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cardapay-backup-orders-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Backup orders exported successfully');
    } catch (error) {
      console.error('❌ Failed to export backup orders:', error);
      toast.error('Failed to export backup orders');
    }
  }, [getBackupOrders]);

  return {
    isBackingUp,
    isFetching,
    createBackupOrder,
    updateOrderStatus,
    markOrderCompleted,
    markOrderFailed,
    getBackupOrders,
    getBackupOrder,
    getFailedOrders,
    cleanupOldBackups,
    exportBackupOrders,
    saveToLocalStorage,
    saveToFirebase,
    fetchBackupOrdersFromFirebase
  };
};