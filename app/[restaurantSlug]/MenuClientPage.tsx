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
  const { addItem, itemCount } = useCart();
  
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
      element.scrollIntoView({ behavior: 'smooth' });
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchAndFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          scrollToCategory={scrollToCategory}
        />

        <MenuSection
          filteredItems={filteredItems}
          categories={categories}
          onAddToCart={handleAddToCart}
        />
      </main>
      
      <RestaurantFooter restaurant={restaurant} />

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        restaurantId={restaurant.id} 
      />
      
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export type { Restaurant, MenuItem };

