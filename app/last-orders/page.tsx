'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import OrderListItem from '../components/features/OrderListItem'; // Importando o novo componente
import { motion } from 'framer-motion';

export default function LastOrdersPage() {
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Supondo que os IDs dos pedidos são salvos no localStorage na página de sucesso
      const stored = localStorage.getItem("lastOrders");
      if (stored) {
        setOrderIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Falha ao carregar pedidos do localStorage", e);
    } finally {
        setIsLoading(false);
    }
  }, []);

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              {/* Pode adicionar um spinner aqui se desejar */}
          </div>
      )
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">Seus Últimos Pedidos</h1>

          {orderIds.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm">
              <ShoppingCart className="mx-auto h-16 w-16 text-slate-300" />
              <h2 className="mt-4 text-2xl font-semibold text-slate-700">Nenhum pedido recente</h2>
              <p className="mt-2 text-slate-500">Os pedidos que você fizer aparecerão aqui para fácil rastreamento.</p>
              <Link href="/" className="mt-6 inline-block text-rose-600 font-semibold hover:underline">
                Começar a pedir
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orderIds.map((id) => (
                <OrderListItem key={id} orderId={id} />
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </>
  );
}
