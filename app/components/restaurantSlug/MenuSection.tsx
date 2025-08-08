import { Utensils } from 'lucide-react';
import { MenuItemCard } from './MenuItemCard';
import { MenuItem } from '@/app/[restaurantSlug]/MenuClientPage';

interface MenuSectionProps {
  filteredItems: MenuItem[];
  categories: string[];
  onAddToCart: (item: MenuItem) => void;
}

export function MenuSection({ filteredItems, categories, onAddToCart }: MenuSectionProps) {
  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 text-gray-300">
          <Utensils className="w-full h-full" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-gray-700">No items found</h2>
        <p className="mt-2 text-gray-500">Try adjusting your search or filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {categories
        .filter(category => filteredItems.some(item => item.category === category))
        .map(category => (
          <section key={category} className="scroll-mt-24" id={category.toLowerCase().replace(/\s+/g, '-')}>
            <div className="flex items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex-grow">{category}</h2>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-grow ml-4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems
                .filter(item => item.category === category)
                .map(item => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAddToCart={() => onAddToCart(item)}
                  />
                ))}
            </div>
          </section>
        ))}
    </div>
  );
}

