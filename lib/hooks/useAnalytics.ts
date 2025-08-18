import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { startOfDay, subDays } from 'date-fns';
import { safeTimestampToDate } from '../utils/timestamp';

// Define os tipos de período de tempo
export type TimePeriod = 'today' | '7d' | '30d' | 'all';

// Define a estrutura dos dados do pedido para análise
interface Order {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  createdAt: Timestamp;
  isDelivery: boolean;
}

// Define a estrutura dos dados de análise que o hook retornará
export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  deliveryOrders: number;
  pickupOrders: number;
  salesByDay: { date: string; total: number }[];
  topSellingItems: { name: string; quantity: number }[];
  deliveryVsPickup: { name: string; value: number }[];
}

export const useAnalytics = () => {
  const [user, authLoading] = useAuthState(auth);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('7d'); // Período padrão de 7 dias

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        let startDate: Date | null = null;
        switch (period) {
            case 'today':
                startDate = startOfDay(new Date());
                break;
            case '7d':
                startDate = subDays(new Date(), 7);
                break;
            case '30d':
                startDate = subDays(new Date(), 30);
                break;
            case 'all':
            default:
                startDate = null;
        }

        let ordersQuery = query(collection(db, 'orders'), where('restaurantId', '==', user.uid));
        if (startDate) {
            ordersQuery = query(ordersQuery, where('createdAt', '>=', Timestamp.fromDate(startDate)));
        }

        const querySnapshot = await getDocs(ordersQuery);
        const orders: Order[] = [];
        querySnapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() } as Order));

        // --- Processamento de Dados ---
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const deliveryOrders = orders.filter(o => o.isDelivery).length;
        const pickupOrders = totalOrders - deliveryOrders;
        const deliveryVsPickup = [
            { name: 'Entrega', value: deliveryOrders },
            { name: 'Retirada', value: pickupOrders },
        ];

        const salesByDayMap = new Map<string, number>();
        orders.sort((a, b) => safeTimestampToDate(a.createdAt).getTime() - safeTimestampToDate(b.createdAt).getTime()).forEach(order => {
          const date = safeTimestampToDate(order.createdAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
          salesByDayMap.set(date, (salesByDayMap.get(date) || 0) + order.totalAmount);
        });
        const salesByDay = Array.from(salesByDayMap.entries()).map(([date, total]) => ({ date, total }));
        
        const itemCounts = new Map<string, number>();
        orders.forEach(order => order.items.forEach(item => itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity)));
        const topSellingItems = Array.from(itemCounts.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        setAnalyticsData({
          totalRevenue, totalOrders, averageOrderValue, deliveryOrders, pickupOrders,
          salesByDay, topSellingItems, deliveryVsPickup,
        });

      } catch (error) {
        console.error("Erro ao buscar dados de análise:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, period]);

  return { analyticsData, isLoading: authLoading || isLoading, setPeriod, activePeriod: period };
};
