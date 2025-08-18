import { useState, useCallback } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

export interface BackupOrder {
  id: string;
  sessionId?: string;
  restaurantId: string;
  clientId?: string;
  items: any[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'backup';
  createdAt: Date;
  isDelivery: boolean;
  deliveryAddress?: string;
  confirmationCode?: string;
  metadata?: {
    stripeSessionId?: string;
    paymentIntentId?: string;
    error?: string;
    backupReason?: string;
    confirmationCode?: string;
  };
}

const BACKUP_ORDERS_KEY = 'cardapay-backup-orders';

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
      const orderData = {
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'backup_orders', order.id), orderData);
      console.log(`✅ Order ${order.id} backed up to Firebase`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save order to Firebase:', error);
      return false;
    }
  }, []);

  // Create backup order before checkout
  const createBackupOrder = useCallback(async (
    orderId: string,
    sessionId: string,
    restaurantId: string,
    clientId: string | undefined,
    cartItems: any[],
    totalAmount: number,
    isDelivery: boolean,
    deliveryAddress?: string
  ) => {
    setIsBackingUp(true);
    
    try {
      const backupOrder: BackupOrder = {
        id: orderId,
        sessionId,
        restaurantId,
        clientId,
        items: cartItems,
        totalAmount,
        status: 'pending',
        createdAt: new Date(),
        isDelivery,
        deliveryAddress,
        metadata: {
          stripeSessionId: sessionId,
          backupReason: 'pre_checkout_backup'
        }
      };

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
        // If Firebase backup fails, we should not proceed with checkout
        // as the webhook won't be able to update the backup order
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

      // Update Firebase
      const orderData = {
        status,
        updatedAt: Timestamp.now(),
        ...(metadata && { metadata: { ...metadata } })
      };

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
    return await updateOrderStatus(orderId, 'completed', {
      backupReason: 'payment_successful',
      confirmationCode
    });
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
