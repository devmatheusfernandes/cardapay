"use client";

import { motion } from "framer-motion";
import { MenuItem } from "@/lib/types/restaurantSlug/types";
import { Utensils, Plus, Check } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (newQuantity: number) => void;
}

export function MenuItemCard({
  item,
  quantity,
  onAddToCart,
}: MenuItemCardProps) {
  const hasVaryingPrices =
    item.sizes &&
    item.sizes.length > 0 &&
    item.sizes.some((size) => size.price !== item.basePrice);
  const displayPrice = `R$ ${(item.basePrice || 0)
    .toFixed(2)
    .replace(".", ",")}`;

  const handleAddToCart = () => {
    onAddToCart(item);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col border ${
        quantity > 0 ? "border-emerald-500" : "border-gray-100"
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-gray-300" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-base font-bold text-gray-800">{item.name}</h3>
            <p className="text-base font-semibold text-emerald-600 whitespace-nowrap">
              {hasVaryingPrices ? `A partir de ${displayPrice}` : displayPrice}
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>

        <div className="mt-4 h-10 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all ${
              quantity > 0
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            {quantity > 0 ? (
              <>
                <Check className="w-5 h-5" />
                Adicionado
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Adicionar
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
