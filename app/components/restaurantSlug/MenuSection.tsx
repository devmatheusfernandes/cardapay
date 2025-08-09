import { Utensils } from 'lucide-react';
import { MenuItemCard } from './MenuItemCard';
import { MenuItem } from '@/app/[restaurantSlug]/MenuClientPage';
// UPDATE: Import CartItem type
import { CartItem } from '@/lib/context/CartContext';

interface MenuSectionProps {
  filteredItems: MenuItem[];
  categories: string[];
  // UPDATE: Add new props
  cartItems: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export function MenuSection({ filteredItems, categories, cartItems, onAddToCart, onUpdateQuantity }: MenuSectionProps) {
  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 text-gray-300">
          <Utensils className="w-full h-full" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-gray-700">Nada encontrado por aqui!</h2>
        <p className="mt-2 text-gray-500">Teste ajustar sua busca ou palavras</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {categories
        .filter(category => filteredItems.some(item => item.category === category))
        .map(category => (
          <section key={category} className="scroll-mt-28" id={category.toLowerCase().replace(/\s+/g, '-')}>
            <div className="flex items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 flex-grow">{category}</h2>
              <div className="h-px bg-gray-200 flex-grow ml-6"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems
                .filter(item => item.category === category)
                .map(item => {
                  // UPDATE: Find the quantity for the current item
                  const cartItem = cartItems.find(ci => ci.id === item.id);
                  const quantity = cartItem ? cartItem.quantity : 0;

                  return (
                    // UPDATE: Pass new props to MenuItemCard
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      quantity={quantity}
                      onAddToCart={() => onAddToCart(item)}
                      onUpdateQuantity={(newQuantity) => onUpdateQuantity(item.id, newQuantity)}
                    />
                  );
                })}
            </div>
          </section>
        ))}
    </div>
  );
}