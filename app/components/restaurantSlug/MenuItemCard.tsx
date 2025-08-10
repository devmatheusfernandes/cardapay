'use client';

import { motion } from 'framer-motion';
import { MenuItem } from '@/lib/types/restaurantSlug/types'; 
import { Utensils, Plus, Minus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number; // ADD: quantity prop
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (newQuantity: number) => void; // ADD: onUpdateQuantity prop with proper typing
}

export function MenuItemCard({ item, quantity, onAddToCart, onUpdateQuantity }: MenuItemCardProps) {
  // Check if the item has varying prices
  const hasVaryingPrices = item.sizes && item.sizes.length > 0 && item.sizes.some(size => size.price !== item.basePrice);
  const displayPrice = `R$ ${(item.basePrice || 0).toFixed(2).replace('.', ',')}`;

  // Handle quantity changes
  const handleIncrement = () => {
    onUpdateQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (quantity === 0) {
      onAddToCart(item);
    } else {
      handleIncrement();
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col"
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
            <p className="text-base font-semibold text-indigo-600 whitespace-nowrap">
              {hasVaryingPrices ? `A partir de ${displayPrice}` : displayPrice}
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
        </div>
        
        {/* Conditional rendering based on quantity */}
        <div className="mt-4 h-10 flex items-center justify-center">
          {quantity === 0 ? (
            // Show "Add" button when quantity is 0
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </motion.button>
          ) : (
            // Show quantity controls when quantity > 0
            <div className="w-full flex items-center justify-between bg-gray-50 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDecrement}
                className="flex items-center justify-center w-8 h-8 rounded-md bg-white hover:bg-gray-100 text-gray-600 shadow-sm transition-all"
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              
              <span className="text-sm font-semibold text-gray-800 px-3">
                {quantity}
              </span>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleIncrement}
                className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}