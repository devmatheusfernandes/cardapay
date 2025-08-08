import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// Define the Order type for analytics processing
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: Timestamp;
}

// Define the shape of the analytics data the hook will return
export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDay: { date: string; total: number }[];
  topSellingItems: { name: string; quantity: number }[];
}

export const useAnalytics = () => {
  const [user, authLoading] = useAuthState(auth);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'orders'), where('restaurantId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        // --- Process Data ---
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Process sales by day (for a chart)
        const salesByDayMap = new Map<string, number>();
        orders.forEach(order => {
          const date = order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          salesByDayMap.set(date, (salesByDayMap.get(date) || 0) + order.totalAmount);
        });
        const salesByDay = Array.from(salesByDayMap.entries()).map(([date, total]) => ({ date, total })).reverse();
        
        // Process top-selling items
        const itemCounts = new Map<string, number>();
        orders.forEach(order => {
            order.items.forEach(item => {
                itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity);
            });
        });
        const topSellingItems = Array.from(itemCounts.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5); // Get top 5 items

        setAnalyticsData({
          totalRevenue,
          totalOrders,
          averageOrderValue,
          salesByDay,
          topSellingItems,
        });

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  return { analyticsData, isLoading: authLoading || isLoading };
};
