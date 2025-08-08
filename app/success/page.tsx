'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
// Import the CartProvider
import { CartProvider, useCart } from '@/lib/context/CartContext';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// This wrapper now provides the CartContext to the SuccessPage
export default function SuccessPageWrapper() {
  return (
    // Wrap the page in a Suspense boundary because useSearchParams can suspend
    <Suspense fallback={<div>Loading...</div>}>
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

  // Clear the cart as soon as the customer lands on this page.
  useEffect(() => {
    // A check to prevent clearing the cart unnecessarily on re-renders
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
          Thank you for your order. The restaurant has been notified and will begin preparing your items shortly.
        </p>
        
        {sessionId && (
            <div className="mt-6 text-sm text-slate-500">
                <p>Your confirmation number is:</p>
                <p className="font-mono bg-slate-100 p-2 rounded-md mt-1 inline-block">
                    {sessionId.replace('cs_test_', '')}
                </p>
            </div>
        )}

        <Link href="/" className="mt-8 inline-block w-full max-w-xs py-3 px-4 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition shadow-md">
            Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
