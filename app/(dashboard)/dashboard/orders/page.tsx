'use client';

import { useState, useMemo } from 'react';
import { useOrders, Order } from '../../../../lib/hooks/useOrders';
import { useDrivers, Driver } from '../../../../lib/hooks/useDrivers';
import { LoaderCircle, Clock, ChefHat, ShoppingBag, CheckCircle, Truck, MapPin, Store, ListFilter, UserCheck, XCircle, Undo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import TimeAgo from 'react-timeago';
import Modal from '@/app/components/ui/Modal';
import SubscriptionGuard from '@/app/components/guards/SubscriptionGuard';

const allOrderStatuses: Order['status'][] = ['Pending', 'In Progress', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Returned', 'Canceled'];

const statusConfig = {
    Pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
    'In Progress': { icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-100' },
    'Ready for Pickup': { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-100' },
    'Out for Delivery': { icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-100' },
    Completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    Returned: { icon: Undo2, color: 'text-red-500', bg: 'bg-red-100' },
    Canceled: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-100' },
};

type ViewFilter = 'All' | 'Delivery' | 'Pickup';

export default function OrdersPage() {
  const { orders, isLoading, updateOrderStatus } = useOrders();
  const { drivers, isLoading: driversLoading } = useDrivers();
  const [view, setView] = useState<ViewFilter>('All');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    if (view === 'Delivery') return orders.filter(order => order.isDelivery);
    if (view === 'Pickup') return orders.filter(order => !order.isDelivery);
    return orders;
  }, [orders, view]);

  const displayedStatuses = useMemo(() => {
      if (view === 'Delivery') return allOrderStatuses.filter(s => s !== 'Ready for Pickup');
      if (view === 'Pickup') return allOrderStatuses.filter(s => s !== 'Out for Delivery');
      return allOrderStatuses;
  }, [view]);
  
  const handleOpenAssignModal = (order: Order) => { setOrderToAssign(order); setIsAssignModalOpen(true); };
  const handleAssignDriver = (driver: Driver) => {
    if (orderToAssign) updateOrderStatus(orderToAssign.id, 'Out for Delivery', { driverId: driver.id, driverName: driver.name });
    setIsAssignModalOpen(false); setOrderToAssign(null);
  };

  if (isLoading || driversLoading) {
    return <div className="flex items-center justify-center h-full"><LoaderCircle className="w-12 h-12 text-rose-600 animate-spin" /></div>;
  }

  return (
    <SubscriptionGuard>
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Gerenciamento de Pedidos</h1>
        <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-lg">
            <FilterButton label="Todos" isActive={view === 'All'} onClick={() => setView('All')} />
            <FilterButton label="Entrega" icon={Truck} isActive={view === 'Delivery'} onClick={() => setView('Delivery')} />
            <FilterButton label="Retirada" icon={Store} isActive={view === 'Pickup'} onClick={() => setView('Pickup')} />
        </div>
      </div>
      
      {filteredOrders.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
              <div className="text-center">
                  <ShoppingBag className="mx-auto h-20 w-20 text-slate-300" />
                  <h2 className="mt-4 text-2xl font-semibold text-slate-700">Nenhum pedido encontrado</h2>
              </div>
          </div>
      ) : (
        <div className={`flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${displayedStatuses.length} gap-6 overflow-x-auto`}>
          {displayedStatuses.map(status => (
            <OrderColumn key={status} status={status} orders={filteredOrders.filter(o => o.status === status)} onUpdateStatus={updateOrderStatus} onAssignDriverClick={handleOpenAssignModal} />
          ))}
        </div>
      )}
      <AssignDriverModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} drivers={drivers} onAssign={handleAssignDriver} />
    </div>
    </SubscriptionGuard>
  );
}

const FilterButton = ({ label, icon: Icon, isActive, onClick }: { label: string, icon?: React.ElementType, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition ${isActive ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
        {Icon && <Icon className="w-5 h-5" />} {label}
    </button>
);

const OrderColumn = ({ status, orders, onUpdateStatus, onAssignDriverClick }: { status: Order['status'], orders: Order[], onUpdateStatus: (id: string, newStatus: Order['status']) => void, onAssignDriverClick: (order: Order) => void }) => {
    const config = statusConfig[status];
    return (
        <div className="bg-slate-100 rounded-lg p-4 flex flex-col min-w-[300px]">
            <div className="flex items-center gap-3 mb-4">
                <config.icon className={`w-6 h-6 ${config.color}`} />
                <h2 className={`font-bold text-lg ${config.color}`}>{status}</h2>
                <span className={`ml-auto text-sm font-semibold ${config.color} ${config.bg} px-2 py-1 rounded-full`}>{orders.length}</span>
            </div>
            <div className="space-y-4 overflow-y-auto">
                {orders.map(order => <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateStatus} onAssignDriverClick={onAssignDriverClick} />)}
            </div>
        </div>
    );
};

const OrderCard = ({ order, onUpdateStatus, onAssignDriverClick }: { order: Order, onUpdateStatus: (id: string, newStatus: Order['status']) => void, onAssignDriverClick: (order: Order) => void }) => {
    let nextAction = null;
    if (order.status === 'Pending') nextAction = { text: 'Iniciar Preparo', onClick: () => onUpdateStatus(order.id, 'In Progress'), color: 'amber' };
    else if (order.status === 'In Progress') {
        if (order.isDelivery) nextAction = { text: 'Atribuir Entrega', onClick: () => onAssignDriverClick(order), color: 'cyan' };
        else nextAction = { text: 'Pronto para Retirada', onClick: () => onUpdateStatus(order.id, 'Ready for Pickup'), color: 'purple' };
    } else if (order.status === 'Ready for Pickup') {
        nextAction = { text: 'Concluir Pedido', onClick: () => onUpdateStatus(order.id, 'Completed'), color: 'green' };
    }

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-slate-800">Pedido #{order.id.substring(0, 6)}</p>
                <p className="text-xs text-slate-500"><TimeAgo date={order.createdAt.toDate()} /></p>
            </div>
            <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${order.isDelivery ? 'text-blue-600' : 'text-purple-600'}`}>
                {order.isDelivery ? <Truck className="w-4 h-4"/> : <Store className="w-4 h-4"/>}
                <span>{order.isDelivery ? 'Entrega' : 'Retirada'}</span>
            </div>
            {order.isDelivery && <div className="mt-2 p-2 bg-blue-50 rounded-md text-blue-700 text-xs flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0"/> {order.deliveryAddress}</div>}
            {order.assignedDriverName && <div className="mt-2 text-xs text-slate-500 font-semibold flex items-center gap-2"><UserCheck className="w-4 h-4 text-green-600" /><span>Atribuído a: {order.assignedDriverName}</span></div>}
            <ul className="mt-3 space-y-1 text-sm text-slate-600 border-t border-b border-slate-100 py-2">
                {order.items.map((item, index) => <li key={index} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>${(item.price * item.quantity).toFixed(2)}</span></li>)}
            </ul>
            <p className="mt-2 text-right font-bold text-slate-800">Total: ${order.totalAmount.toFixed(2)}</p>
            {nextAction && <button onClick={nextAction.onClick} className={`mt-4 w-full py-2 px-4 text-sm font-semibold text-white rounded-lg shadow-sm transition bg-${nextAction.color}-500 hover:bg-${nextAction.color}-600`}>{nextAction.text}</button>}
            {order.status === 'Out for Delivery' && (
                <div className="mt-4 space-y-2">
                    <button onClick={() => onUpdateStatus(order.id, 'Canceled')} className="w-full py-2 px-4 text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition">Cancelar Pedido</button>
                    <button onClick={() => onUpdateStatus(order.id, 'Returned')} className="w-full py-2 px-4 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition">Marcar como Devolvido</button>
                </div>
            )}
        </motion.div>
    );
};

const AssignDriverModal = ({ isOpen, onClose, drivers, onAssign }: { isOpen: boolean, onClose: () => void, drivers: Driver[], onAssign: (driver: Driver) => void }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Atribuir Entregador">
        {drivers.length === 0 ? <p className="text-slate-500">Você não tem entregadores cadastrados.</p> : (
            <ul className="space-y-2">{drivers.map(driver => <li key={driver.id}><button onClick={() => onAssign(driver)} className="w-full text-left p-3 rounded-lg hover:bg-slate-100 transition"><p className="font-semibold text-slate-800">{driver.name}</p><p className="text-sm text-slate-500">{driver.phone}</p></button></li>)}</ul>
        )}
    </Modal>
);
