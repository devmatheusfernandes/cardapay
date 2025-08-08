'use client';

import { useOrders, Order } from '../../../../lib/hooks/useOrders';
import { LoaderCircle, Clock, ChefHat, ShoppingBag, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import TimeAgo from 'react-timeago';

const orderStatuses: Order['status'][] = ['Pending', 'In Progress', 'Ready for Pickup', 'Completed'];

const statusConfig = {
    Pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100', action: 'Start Preparing', next: 'In Progress' },
    'In Progress': { icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-100', action: 'Mark as Ready', next: 'Ready for Pickup' },
    'Ready for Pickup': { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-100', action: 'Complete Order', next: 'Completed' },
    Completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', action: null, next: null },
};

export default function OrdersPage() {
  const { orders, isLoading, updateOrderStatus } = useOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Order Management</h1>
      
      {orders.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
              <div className="text-center">
                  <ShoppingBag className="mx-auto h-20 w-20 text-slate-300" />
                  <h2 className="mt-4 text-2xl font-semibold text-slate-700">No orders yet</h2>
                  <p className="mt-2 text-slate-500">New orders will appear here in real-time.</p>
              </div>
          </div>
      ) : (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto">
          {orderStatuses.map(status => (
            <OrderColumn 
              key={status} 
              status={status} 
              orders={orders.filter(o => o.status === status)}
              onUpdateStatus={updateOrderStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const OrderColumn = ({ status, orders, onUpdateStatus }: { status: Order['status'], orders: Order[], onUpdateStatus: (id: string, newStatus: Order['status']) => void }) => {
    const config = statusConfig[status];
    
    return (
        <div className="bg-slate-100 rounded-lg p-4 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <config.icon className={`w-6 h-6 ${config.color}`} />
                <h2 className={`font-bold text-lg ${config.color}`}>{status}</h2>
                <span className={`ml-auto text-sm font-semibold ${config.color} ${config.bg} px-2 py-1 rounded-full`}>
                    {orders.length}
                </span>
            </div>
            <div className="space-y-4 overflow-y-auto">
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} />
                ))}
            </div>
        </div>
    );
};

const OrderCard = ({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (id: string, newStatus: Order['status']) => void }) => {
    const config = statusConfig[order.status];
    
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-md p-4"
        >
            <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-slate-800">Order #{order.id.substring(0, 6)}</p>
                <p className="text-xs text-slate-500">
                    <TimeAgo date={order.createdAt.toDate()} />
                </p>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600 border-t border-b border-slate-100 py-2">
                {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                ))}
            </ul>
            <p className="mt-2 text-right font-bold text-slate-800">
                Total: ${order.totalAmount.toFixed(2)}
            </p>
            {config.action && config.next && (
                <button 
                    onClick={() => onUpdateStatus(order.id, config.next as Order['status'])}
                    className={`mt-4 w-full py-2 px-4 text-sm font-semibold text-white rounded-lg shadow-sm transition ${config.bg.replace('100', '500')} hover:${config.bg.replace('100', '600')}`}
                >
                    {config.action}
                </button>
            )}
        </motion.div>
    );
};
