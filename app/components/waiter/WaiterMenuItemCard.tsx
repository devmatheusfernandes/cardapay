// app/components/waiter/WaiterMenuItemCard.tsx
"use client";

import { motion } from "framer-motion";
import { Plus, Utensils } from "lucide-react";
import ActionButton from "@/app/components/shared/ActionButton";
import { MenuItem } from "@/lib/hooks/useMenuWaiter";

interface WaiterMenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export default function WaiterMenuItemCard({
  item,
  onAddToCart,
}: WaiterMenuItemCardProps) {
  const displayPrice = `R$${(item.basePrice || 0).toFixed(2)}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all flex flex-col"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-base font-bold text-gray-800">{item.name}</h3>
            <p className="text-base font-semibold text-emerald-600 whitespace-nowrap">
              {displayPrice}
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>
        <div className="mt-4">
          <ActionButton
            label="Adicionar"
            onClick={() => onAddToCart(item)}
            icon={<Plus className="w-4 h-4" />}
            variant="primary"
            fullWidth
          />
        </div>
      </div>
    </motion.div>
  );
}
