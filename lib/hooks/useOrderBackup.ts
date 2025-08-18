import { useState, useCallback } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
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

export const useOrderBackup = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);

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

  // Create backup order before checkout
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

      // Save to both locations - Firebase must succeed for the backup to be considered successful
      const localSuccess = saveToLocalStorage(backupOrder);
      const firebaseSuccess = await saveToFirebase(backupOrder);

      if (localSuccess && firebaseSuccess) {
        console.log(`✅ Order ${orderId} fully backed up to both locations`);
        return true;
      } else if (firebaseSuccess) {
        console.log(`⚠️ Order ${orderId} backed up to Firebase only (local storage failed)`);
        return true;
      } else {
        console.error(`❌ Failed to backup order ${orderId} to Firebase - this will cause webhook errors`);
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

  // Get all backup orders from local storage
  const getBackupOrders = useCallback((): BackupOrder[] => {
    try {
      const existingOrders = localStorage.getItem(BACKUP_ORDERS_KEY);
      return existingOrders ? JSON.parse(existingOrders) : [];
    } catch (error) {
      console.error('❌ Failed to get backup orders from local storage:', error);
      return [];
    }
  }, []);

  // Get specific backup order
  const getBackupOrder = useCallback((orderId: string) => {
    try {
      const orders = getBackupOrders();
      return orders.find((o: BackupOrder) => o.id === orderId);
    } catch (error) {
      console.error('❌ Failed to get backup order:', error);
      return null;
    }
  }, [getBackupOrders]);

  // Clean up old backup orders (older than 30 days)
  const cleanupOldBackups = useCallback(() => {
    try {
      const orders = getBackupOrders();
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
  const getFailedOrders = useCallback(() => {
    try {
      const orders = getBackupOrders();
      return orders.filter((o: BackupOrder) => o.status === 'failed');
    } catch (error) {
      console.error('❌ Failed to get failed orders:', error);
      return [];
    }
  }, [getBackupOrders]);

  // Export backup orders for customer support
  const exportBackupOrders = useCallback(() => {
    try {
      const orders = getBackupOrders();
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
    saveToFirebase
  };
};