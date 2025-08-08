"use client";

import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const BackButton = () => (
  <Link href="/" className="absolute top-4 left-4 md:top-6 md:left-6 cursor-pointer z-20">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <ChevronLeft className="w-8 h-8" />
      <span className="text-md font-medium">Voltar</span>
    </motion.button>
  </Link>
);

export default function HelpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 relative">
      <BackButton />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-slate-100 relative z-10 text-center"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Como rastrear seu pedido</h1>
        <p className="text-slate-600 text-lg">
          Para acompanhar o status do seu pedido, utilize o código que foi gerado e mostrado na tela ao finalizar sua compra.
        </p>
        <p className="text-slate-600 text-lg">
          Este código é único e você pode inseri-lo na página de rastreamento para verificar o andamento da sua entrega.
        </p>
      </motion.div>
    </div>
  );
}
