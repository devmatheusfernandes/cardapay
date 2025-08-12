"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { MenuItem } from "@/lib/hooks/useMenu"; // Importa a interface dos itens do cardápio
import { Order } from "@/lib/types/track/order";

// Define as propriedades que o componente do modal espera receber
interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  menuItems: MenuItem[]; // Lista de itens do cardápio para "traduzir" os IDs
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  menuItems,
}) => {
  // O hook 'useMemo' cria os "dicionários" de busca uma única vez e só os
  // recalcula se a lista de 'menuItems' mudar. Isso melhora o desempenho.
  const lookups = useMemo(() => {
    const sizeLookup = new Map<string, string>();
    const addonLookup = new Map<string, string>();

    if (menuItems) {
      for (const item of menuItems) {
        // Mapeia cada ID de tamanho para seu nome
        item.sizes?.forEach((size) => sizeLookup.set(size.id, size.name));
        // Mapeia cada ID de adicional para seu nome
        item.addons?.forEach((addon) => addonLookup.set(addon.id, addon.name));
      }
    }
    return { sizeLookup, addonLookup };
  }, [menuItems]);

  // Se não houver pedido, o modal não é renderizado
  if (!order) {
    return null;
  }

  return (
    // 'AnimatePresence' permite a animação de saída quando o modal é fechado
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
        >
          {/* O container do modal em si */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Impede que o clique no modal feche-o
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl"
          >
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                Detalhes do Pedido
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Corpo do Modal (com barra de rolagem se necessário) */}
            <div className="p-6 flex-grow overflow-y-auto">
              <ul className="space-y-4">
                {order.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 font-medium text-slate-600">
                      {item.quantity}x
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-800">
                        {item.name}
                      </p>

                      {/* Seção de opções, onde os nomes são "traduzidos" */}
                      <div className="text-xs text-slate-500 mt-1 space-y-1">
                        {item.options.size && (
                          <p>
                            Tamanho:{" "}
                            {lookups.sizeLookup.get(item.options.size) ||
                              item.options.size}
                          </p>
                        )}
                        {item.options.addons &&
                          item.options.addons.length > 0 && (
                            <p>
                              Adicionais:{" "}
                              {item.options.addons
                                .map((id) => lookups.addonLookup.get(id) || id)
                                .join(", ")}
                            </p>
                          )}
                        {item.options.stuffedCrust && (
                          <p>Borda: {item.options.stuffedCrust}</p>
                        )}
                        {item.options.notes && (
                          <p className="italic">Obs: "{item.options.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="font-semibold text-slate-700 text-right">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rodapé do Modal com o valor total */}
            <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-b-2xl flex-shrink-0">
              <span className="text-lg font-bold text-slate-800">Total</span>
              <span className="text-xl font-bold text-emerald-600">
                R$ {order.totalAmount.toFixed(2)}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsModal;
