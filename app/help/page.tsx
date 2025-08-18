"use client";
import { motion } from "framer-motion";
import BackButton from "../components/shared/BackButton";

export default function HelpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 relative">
      <BackButton pathLink={"/track"} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl p-12 py-22 space-y-6 bg-emerald-100 rounded-2xl shadow-lg  relative z-10 text-center"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Como rastrear seu pedido
        </h1>
        <p className="text-slate-600 text-md">
          Para acompanhar o status do seu pedido, utilize o código que foi
          gerado e mostrado na tela ao finalizar sua compra.
        </p>
        <p className="text-slate-600 text-md">
          Este código é único e você pode inseri-lo na página de rastreamento
          para verificar o andamento da sua entrega.
        </p>
      </motion.div>
    </div>
  );
}
