// app/dashboard/waiter/page.tsx - VERSÃO SIMPLIFICADA APENAS COM FIREBASE
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAllTables } from '@/lib/hooks/useAllTables';
import { useOrders } from '@/lib/hooks/useOrders';
import { Square, Users, PlusCircle, Activity, ChefHat, Clock, CheckCircle, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import SubscriptionGuard from '@/app/components/guards/SubscriptionGuard';
import AddTableModal from '@/app/components/waiter/AddTableModal';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function WaiterPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  
  // Estado local para as mesas físicas do restaurante
  const [physicalTables, setPhysicalTables] = useState(Array.from({ length: 12 }, (_, i) => ({ id: i + 1 })));
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para notificações de pedidos prontos
  const [readyToServeNotifications, setReadyToServeNotifications] = useState<string[]>([]);

  // Hooks para obter o estado dinâmico - APENAS FIREBASE
  const { tables: firebaseTables, isLoading } = useAllTables();
  const { orders } = useOrders();

  // Monitorar pedidos "Ready to Serve" para notificações
  useEffect(() => {
    const readyToServeOrders = orders.filter(o => 
      o.status === 'Ready to Serve' && 
      o.source === 'waiter' && 
      o.tableId
    );

    // Adicionar notificações para pedidos prontos
    const newNotifications = readyToServeOrders
      .map(order => order.tableId!.toString())
      .filter(tableId => !readyToServeNotifications.includes(tableId));
    
    if (newNotifications.length > 0) {
      setReadyToServeNotifications(prev => [...prev, ...newNotifications]);
    }

    console.log('🔥 Estado atual das mesas do Firebase:', firebaseTables);
    console.log('📋 Pedidos Ready to Serve:', readyToServeOrders.map(o => `Mesa ${o.tableId}`));
    
  }, [orders, readyToServeNotifications, firebaseTables]);

  // Calcula o status de cada mesa baseado apenas no Firebase
  const tablesWithStatus = useMemo(() => {
    const pendingOrdersByTable = orders
      .filter(o => o.status === 'In Progress' && o.source === 'waiter')
      .reduce((acc, order) => {
        if(order.tableId) acc[order.tableId.toString()] = true;
        return acc;
      }, {} as Record<string, boolean>);

    const readyToServeOrdersByTable = orders
      .filter(o => o.status === 'Ready to Serve' && o.source === 'waiter')
      .reduce((acc, order) => {
        if(order.tableId) acc[order.tableId.toString()] = true;
        return acc;
      }, {} as Record<string, boolean>);

    return physicalTables.map(table => {
      const tableId = table.id.toString();
      const tableState = firebaseTables[tableId];
      let status = 'free';

      // PRIORIDADE 1: Verificar se há pedidos prontos para servir
      if (readyToServeOrdersByTable[tableId]) {
        status = 'ready-to-serve';
      }
      // PRIORIDADE 2: Verificar se há pedidos não enviados (baseado no Firebase)
      else if (tableState?.seats?.some(seat => 
        seat.items?.some(item => !item.submitted)
      )) {
        status = 'unsent';
      }
      // PRIORIDADE 3: Verificar se há pedidos na cozinha
      else if (pendingOrdersByTable[tableId]) {
        status = 'pending';
      }
      // PRIORIDADE 4: Verificar se há itens na mesa (baseado no Firebase)
      else if (tableState?.seats?.some(seat => seat.items && seat.items.length > 0)) {
        status = 'active';
      }

      console.log(`🔍 Mesa ${table.id}:`, {
        status,
        tableState,
        hasReadyOrders: readyToServeOrdersByTable[tableId],
        hasPendingOrders: pendingOrdersByTable[tableId],
        hasUnsentItems: tableState?.seats?.some(seat => seat.items?.some(item => !item.submitted)),
        hasActiveItems: tableState?.seats?.some(seat => seat.items && seat.items.length > 0)
      });

      return { ...table, status };
    });
  }, [physicalTables, firebaseTables, orders]);

  const handleSelectTable = (tableId: number) => {
    // Remover notificação ao acessar a mesa
    const tableIdStr = tableId.toString();
    if (readyToServeNotifications.includes(tableIdStr)) {
      setReadyToServeNotifications(prev => prev.filter(id => id !== tableIdStr));
    }
    
    router.push(`/dashboard/waiter/${tableId}`);
  };
  
  const handleAddTable = (tableId: number) => {
    setPhysicalTables(prev => [...prev, { id: tableId }].sort((a,b) => a.id - b.id));
  };
  
  const existingTableIds = useMemo(() => physicalTables.map(t => t.id), [physicalTables]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando estados das mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SubscriptionGuard>
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
          <div className="flex justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-slate-700" />
              <h1 className="text-3xl font-bold text-slate-800">Gerenciamento de Mesas</h1>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition"
            >
              <PlusCircle className="w-5 h-5" />
              Adicionar Mesa
            </button>
          </div>

          {/* Notificações de pedidos prontos */}
          {readyToServeNotifications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-yellow-600 mt-0.5 animate-bounce" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Pedidos Prontos para Servir!</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    {readyToServeNotifications.length === 1 
                      ? `Mesa ${readyToServeNotifications[0]} tem pedidos prontos`
                      : `Mesas ${readyToServeNotifications.join(', ')} têm pedidos prontos`
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Status de conexão Firebase */}
          <div className="mb-4 text-xs text-slate-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Conectado ao Firebase • {Object.keys(firebaseTables).length} mesas com dados
          </div>

          {/* Debug info - remover em produção */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-slate-100 rounded text-xs">
              <strong>Debug Firebase Tables:</strong> {JSON.stringify(Object.keys(firebaseTables))}
            </div>
          )}

          {/* Legenda dos status */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200 rounded border-2 border-slate-300"></div>
              <span className="text-slate-600">Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded border-2 border-green-400"></div>
              <span className="text-slate-600">Ativa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-100 rounded border-2 border-indigo-400"></div>
              <span className="text-slate-600">Na Cozinha</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded border-2 border-red-500"></div>
              <span className="text-slate-600">Pedidos Não Enviados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 rounded border-2 border-yellow-500"></div>
              <span className="text-slate-600">Pronto para Servir</span>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
          >
            {tablesWithStatus.map((table) => {
              const statusStyles = {
                free: { 
                  iconColor: 'text-slate-400', 
                  borderColor: 'border-slate-200', 
                  bgColor: 'bg-slate-50 hover:bg-indigo-50' 
                },
                active: { 
                  iconColor: 'text-green-500', 
                  borderColor: 'border-green-400', 
                  bgColor: 'bg-green-50 hover:bg-green-100' 
                },
                pending: { 
                  iconColor: 'text-indigo-500', 
                  borderColor: 'border-indigo-400', 
                  bgColor: 'bg-indigo-50 hover:bg-indigo-100' 
                },
                unsent: { 
                  iconColor: 'text-red-600', 
                  borderColor: 'border-red-500', 
                  bgColor: 'bg-red-50 hover:bg-red-100' 
                },
                'ready-to-serve': {
                  iconColor: 'text-yellow-600',
                  borderColor: 'border-yellow-500',
                  bgColor: 'bg-yellow-50 hover:bg-yellow-100'
                }
              };
              const currentStyle = statusStyles[table.status as keyof typeof statusStyles];

              const hasNotification = readyToServeNotifications.includes(table.id.toString());

              return (
                <motion.button
                  key={table.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectTable(table.id)}
                  className={`relative aspect-square rounded-xl shadow-sm border-2 flex flex-col items-center justify-center p-4 transition-colors ${currentStyle.borderColor} ${currentStyle.bgColor} ${hasNotification ? 'animate-pulse' : ''}`}
                >
                  {table.status === 'active' && <Tag icon={Activity} text="Ativa" color="bg-green-500" />}
                  {table.status === 'pending' && <Tag icon={ChefHat} text="Cozinha" color="bg-indigo-500" />}
                  {table.status === 'unsent' && <Tag icon={Clock} text="Não Enviados" color="bg-red-500" />}
                  {table.status === 'ready-to-serve' && <Tag icon={CheckCircle} text="Pronto!" color="bg-yellow-500" />}
                  
                  {hasNotification && (
                    <div className="absolute top-1 left-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  )}
                  
                  <Square className={`w-12 h-12 ${currentStyle.iconColor}`} />
                  <p className="mt-2 text-xl font-bold text-slate-700">Mesa {table.id}</p>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </SubscriptionGuard>
      <AddTableModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTable={handleAddTable}
        existingTableIds={existingTableIds}
      />
    </>
  );
}

// Componente para as tags de status
const Tag = ({ icon: Icon, text, color }: { icon: React.ElementType, text: string, color: string }) => (
    <div className={`absolute top-2 right-2 flex items-center gap-1.5 text-white text-xs font-bold px-2 py-1 rounded-full ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{text}</span>
    </div>
);