'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle, Clock, ChefHat, ShoppingBag, CheckCircle } from 'lucide-react';
import TimeAgo from 'react-timeago';
// Import the useParams hook
import { useParams } from 'next/navigation';

// Define the Order type again for this page
interface Order {
  id: string;
  totalAmount: number;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Completed';
  createdAt: Timestamp;
}

const statusConfig = {
    Pending: { icon: Clock, text: 'Your order has been received.', color: 'text-amber-500' },
    'In Progress': { icon: ChefHat, text: 'The kitchen is preparing your order.', color: 'text-blue-500' },
    'Ready for Pickup': { icon: ShoppingBag, text: 'Your order is ready for pickup!', color: 'text-purple-500' },
    Completed: { icon: CheckCircle, text: 'Your order has been completed. Thank you!', color: 'text-green-500' },
};

export default function OrderTrackingPage() {
  // FIX: Use the useParams hook to get route parameters
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
        setError("No order ID provided.");
        setIsLoading(false);
        return;
    }

    const docRef = doc(db, 'orders', orderId);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setOrder({ id: doc.id, ...doc.data() } as Order);
          setError(null);
        } else {
          setError("Sorry, we couldn't find your order.");
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching order:", err);
        setError("There was an error tracking your order.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderCircle className="w-12 h-12 text-rose-600 animate-spin" />
        <p className="ml-4 text-slate-600">Finding your order...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg max-w-md w-full text-center">
            {error && (
                <>
                    <h1 className="text-2xl font-bold text-red-600">Oops!</h1>
                    <p className="text-slate-600 mt-2">{error}</p>
                </>
            )}
            {order && (
                <>
                    <h1 className="text-2xl font-bold text-slate-800">Order Status</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Order #{order.id.substring(0, 12)}...
                    </p>
                    <div className="mt-8">
                        <StatusDisplay status={order.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-8">
                        Placed <TimeAgo date={order.createdAt.toDate()} />. Updates will appear here automatically.
                    </p>
                </>
            )}
        </div>
    </div>
  );
}

const StatusDisplay = ({ status }: { status: Order['status'] }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
        <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${config.color.replace('text', 'bg').replace('500', '100')}`}>
                <Icon className={`w-12 h-12 ${config.color}`} />
            </div>
            <h2 className={`mt-4 text-2xl font-bold ${config.color}`}>{status}</h2>
            <p className="text-slate-600 mt-2">{config.text}</p>
        </div>
    );
};
