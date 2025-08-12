// src/components/OrderDetailsModal.tsx

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Order } from "@/lib/types/track/order"; // Importando o tipo do novo arquivo

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl"
          >
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Detalhes do Pedido
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Corpo do Modal (com scroll) */}
            <div className="p-6 flex-grow overflow-y-auto">
              <ul className="space-y-4">
                {order.items.map((item, index) => (
                  <li key={index} className="flex items-start justify-between gap-4">
                    <div className="flex-shrink-0 font-medium text-slate-600">
                      {item.quantity}x
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      {/* Detalhes e Opções */}
                      <div className="text-xs text-slate-500 mt-1 space-y-1">
                        {item.options.size && <p>Tamanho: {item.options.size}</p>}
                        {item.options.addons && item.options.addons.length > 0 && (
                          <p>Adicionais: {item.options.addons.join(", ")}</p>
                        )}
                        {item.options.stuffedCrust && (
                          <p>Borda: {item.options.stuffedCrust}</p>
                        )}
                         {item.options.notes && (
                          <p className="italic">Obs: "{item.options.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="font-semibold text-slate-700">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Rodapé do Modal */}
            <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-b-2xl">
                <span className="text-lg font-bold text-slate-800">Total</span>
                <span className="text-xl font-bold text-indigo-600">R$ {order.totalAmount.toFixed(2)}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsModal;