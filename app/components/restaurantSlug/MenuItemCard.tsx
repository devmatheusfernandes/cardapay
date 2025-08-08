import { motion } from 'framer-motion';
import { Utensils, Plus } from 'lucide-react';
import { MenuItem } from './MenuClientPage';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Utensils className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
          </div>
          <p className="text-lg font-semibold text-indigo-600 whitespace-nowrap ml-2">
            ${item.price.toFixed(2)}
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddToCart}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-orange-500 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}

