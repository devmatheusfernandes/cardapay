// app/(public)/menu/[restaurantSlug]/MenuClientPage.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart, ItemToAdd, SelectedOptions } from '@/lib/context/CartContext';
import { toast } from 'react-hot-toast';
import { HeroSection } from '@/app/components/restaurantSlug/HeroSection';
import { StickyHeader } from '@/app/components/restaurantSlug/StickyHeader';
import { SearchAndFilter } from '@/app/components/restaurantSlug/SearchAndFilter';
import { MenuSection } from '@/app/components/restaurantSlug/MenuSection';
import { CartSidebar } from '@/app/components/restaurantSlug/CartSidebar';
import { RestaurantFooter } from '@/app/components/restaurantSlug/Footer';
import { MenuItem, Restaurant } from '@/lib/types/restaurantSlug/types';
import { ItemOptionsModal } from '../components/restaurantSlug/ItemsOptionsModal';

interface MenuClientPageProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
}

export default function MenuClientPage({ restaurant, menuItems }: MenuClientPageProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const { cartItems, addItem, updateQuantity, itemCount } = useCart();
  
  const categories = [...new Set(menuItems.map(item => item.category))];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredItems = menuItems
    .filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(item =>
      !activeCategory || item.category === activeCategory
    );

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(category.toLowerCase().replace(/\s+/g, '-'));
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = (item: MenuItem, options?: SelectedOptions) => {
    const hasOptions = (item.sizes && item.sizes.length > 0) || 
                       (item.addons && item.addons.length > 0) || 
                       (item.stuffedCrust && item.stuffedCrust.available);

    if (hasOptions && !options) {
      setSelectedItem(item);
      setIsOptionsModalOpen(true);
      return;
    }

    const itemToAdd: ItemToAdd = {
      productId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      imageUrl: item.imageUrl,
      options: options || {},
    };
    
    addItem(itemToAdd);
    toast.success(`${item.name} adicionado ao carrinho!`);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection restaurant={restaurant} heroRef={heroRef} isScrolled={isScrolled} />
      <StickyHeader restaurant={restaurant} isScrolled={isScrolled} itemCount={itemCount} onCartClick={() => setIsCartOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <SearchAndFilter
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              scrollToCategory={scrollToCategory}
            />
          </aside>
          <div className="lg:col-span-3">
            <MenuSection
              filteredItems={filteredItems}
              categories={categories}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={updateQuantity}
            />
          </div>
        </div>
      </main>
      
      <RestaurantFooter restaurant={restaurant} /> 
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} restaurantId={restaurant.id} />
      
      <ItemOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        item={selectedItem}
        onAddToCart={(optionsFromModal) => {
          if (selectedItem) {
            handleAddToCart(selectedItem, optionsFromModal);
          }
        }}
      />
    </div>
  );
}

// Exportar o tipo aqui não é mais necessário, mas não causa erro
export type { Restaurant, MenuItem };