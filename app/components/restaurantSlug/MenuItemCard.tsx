'use client';

import { motion } from 'framer-motion';
// ATENÇÃO: Importando o tipo do local correto
import { MenuItem } from '@/lib/types/restaurantSlug/types'; 
// ATENÇÃO: Apenas o ícone Plus é necessário agora
import { Utensils, Plus } from 'lucide-react';

// ATENÇÃO: Props simplificadas
interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  // ATENÇÃO: Lógica de preço inteligente
  // Verifica se o item tem tamanhos com preços diferentes do preço base
  const hasVaryingPrices = item.sizes && item.sizes.length > 0 && item.sizes.some(size => size.price !== item.basePrice);
  const displayPrice = `R$ ${(item.basePrice || 0).toFixed(2).replace('.', ',')}`;

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
              {/* Se os preços variam, mostra "A partir de". Senão, mostra o preço base. */}
              {hasVaryingPrices ? `A partir de ${displayPrice}` : displayPrice}
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
        </div>
        
        {/* ATENÇÃO: Botão de ação único e simplificado */}
        <div className="mt-4 h-10 flex items-center justify-center">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            // O onClick agora simplesmente chama a função pai, passando o item inteiro
            onClick={() => onAddToCart(item)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}