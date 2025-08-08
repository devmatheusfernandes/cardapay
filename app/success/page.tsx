'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CartProvider, useCart } from '@/lib/context/CartContext';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuccessPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    }>
      <CartProvider>
        <SuccessPage />
      </CartProvider>
    </Suspense>
  );
}

function SuccessPage() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      clearCart();

      // Salvar sessionId no localStorage
      try {
        const stored = localStorage.getItem("lastOrders");
        let orders: string[] = stored ? JSON.parse(stored) : [];
        if (!orders.includes(sessionId)) {
          orders.unshift(sessionId); // adiciona no início
          if (orders.length > 10) orders.pop(); // mantém até 10 pedidos
          localStorage.setItem("lastOrders", JSON.stringify(orders));
        }
      } catch {
        // Fail silently se localStorage não estiver disponível
      }
    }
  }, [clearCart, sessionId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren" as const,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-teal-100 p-6 sm:p-10 rounded-2xl shadow-xl max-w-md w-full mx-auto"
        >
          <motion.div variants={itemVariants}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" as const, stiffness: 260, damping: 20 }}
              className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-nowrap text-3xl sm:text-4xl font-bold text-slate-800 mb-3 text-center"
          >
            Pagamento Aprovado!
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-slate-600 mb-8 text-lg text-center my-4"
          >
            Seu pedido foi enviado para o restaurante. Você pode acompanhar o status usando o link abaixo.
          </motion.p>

          {sessionId && (
            <motion.div variants={itemVariants}>
              <Link 
                href={`/track/${sessionId}`}
                className="group relative inline-flex items-center justify-center w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:from-teal-600 hover:to-teal-700"
              >
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                <ExternalLink className="w-5 h-5 mr-2" />
                Acompanhar Pedido
              </Link>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-6">
            <Link 
              href="/" 
              className="inline-block text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-slate-800 hover:after:w-full after:transition-all after:duration-300"
            >
              Voltar para a página inicial
            </Link>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}