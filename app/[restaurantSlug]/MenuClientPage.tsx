'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { toast } from 'react-hot-toast';
import { HeroSection } from '@/app/components/restaurantSlug/HeroSection';
import { StickyHeader } from '@/app/components/restaurantSlug/StickyHeader';
import { SearchAndFilter } from '@/app/components/restaurantSlug/SearchAndFilter';
import { MenuSection } from '@/app/components/restaurantSlug/MenuSection';
import { CartSidebar } from '@/app/components/restaurantSlug/CartSidebar';
import { RestaurantFooter } from '../components/restaurantSlug/Footer';

interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  schedule?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
}

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

  // UPDATE: Get cartItems and updateQuantity from the context
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

  const handleAddToCart = (item: MenuItem) => {
    addItem({ 
      id: item.id, 
      name: item.name, 
      price: item.price, 
      imageUrl: item.imageUrl 
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection 
        restaurant={restaurant} 
        heroRef={heroRef} 
        isScrolled={isScrolled} 
      />

      <StickyHeader 
        restaurant={restaurant}
        isScrolled={isScrolled}
        itemCount={itemCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main className="h-[100vh] max-w-[95vw] mx-auto px-2 sm:px-6 lg:px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
          
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
            {/* UPDATE: Pass new props to MenuSection */}
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

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        restaurantId={restaurant.id} 
      />
    </div>
  );
}

export type { Restaurant, MenuItem };