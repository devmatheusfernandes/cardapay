import { MenuItem } from '@/app/[restaurantSlug]/MenuClientPage';
import { motion } from 'framer-motion';
// UPDATE: Import Minus icon
import { Utensils, Plus, Minus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
  // UPDATE: Add new props
  quantity: number;
  onUpdateQuantity: (newQuantity: number) => void;
}

export function MenuItemCard({ item, onAddToCart, quantity, onUpdateQuantity }: MenuItemCardProps) {
  const isSelected = quantity > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // UPDATE: Add conditional styling for the selected state
      className={`bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-lg transition-all duration-300 flex flex-col ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100'
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
            <p className="text-base font-semibold text-indigo-600 whitespace-nowrap">
              ${item.price.toFixed(2)}
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
        </div>
        
        {/* UPDATE: Conditionally render button or quantity controller */}
        <div className="mt-3 h-10 flex items-center justify-center">
          {isSelected ? (
            <div className="flex items-center justify-between w-full">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onUpdateQuantity(quantity - 1)}
                className="p-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5" />
              </motion.button>
              
              <span className="font-bold text-lg text-gray-900" aria-live="polite">
                {quantity}
              </span>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onUpdateQuantity(quantity + 1)}
                className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddToCart}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}