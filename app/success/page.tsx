'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CartProvider, useCart } from '@/lib/context/CartContext';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuccessPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
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
    }
  }, [clearCart, sessionId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg max-w-lg w-full"
      >
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-6">
          Payment Successful!
        </h1>
        <p className="text-slate-600 mt-3">
          Your order has been sent to the restaurant. You can track its status using the link below.
        </p>
        
        {sessionId && (
            <Link 
                href={`/track/${sessionId}`}
                className="mt-8 inline-flex items-center gap-2 w-full max-w-xs py-3 px-4 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition shadow-md"
            >
                <ExternalLink className="w-5 h-5" />
                Track Your Order
            </Link>
        )}

        <Link href="/" className="mt-4 inline-block text-sm text-slate-500 hover:text-slate-800">
            Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
