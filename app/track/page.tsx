"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";

const BackButton = () => (
  <Link
    href="/"
    className="absolute top-4 left-4 md:top-6 md:left-6 cursor-pointer"
  >
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer flex items-center gap-1 text-slate-600 hover:text-emerald-600 transition-colors"
    >
      <ChevronLeft className="w-8 h-8" />
      <span className="text-md font-medium">Voltar</span>
    </motion.button>
  </Link>
);

export default function TrackOrderInputPage() {
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!orderId.trim()) {
      toast.error("Por favor, insira um ID de pedido válido.");
      return;
    }

    setIsLoading(true);
    router.push(`track/${orderId.trim()}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 relative">
      <BackButton />
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 space-y-8 bg-emerald-100 rounded-2xl border border-slate-100"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center"
            >
              <Search className="w-8 h-8 text-emerald-600" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Rastrear Pedido</h1>
          <p className="mt-2 text-slate-600">
            Insira o ID do pedido para acompanhar sua entrega
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative">
              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Ex: ABC123"
                className="w-full px-4 py-3 pl-11 border border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-700"
                autoFocus
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 transition-all"
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  Acompanhar Pedido
                  <Search className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sm text-center text-slate-600"
        >
          Não sabe o ID do pedido?{" "}
          <Link
            href="/help"
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            Obter ajuda
          </Link>{" "}
          ou{" "}
          <Link
            href="/last-orders"
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            Ver última compra
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
