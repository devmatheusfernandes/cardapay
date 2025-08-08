'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { Utensils, ShoppingCart, X, Plus, Minus, Trash2, LoaderCircle, Truck, Store, Clock, Search, ArrowBigDown, ArrowDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Parallax Effect */}
      <div 
        ref={heroRef}
        className="relative h-screen max-h-[100vh] w-full overflow-hidden bg-gray-900"
      >
        {restaurant.logoUrl ? (
          <motion.img 
            src={restaurant.logoUrl}
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            initial={{ scale: 1 }}
            animate={{ scale: isScrolled ? 1.1 : 1 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900" />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {restaurant.name}
          </motion.h1>
          
          <motion.button
            onClick={() => window.scrollTo({ top: heroRef.current?.offsetHeight, behavior: 'smooth' })}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='absolute bottom-15'
          >
            <ArrowDown className='w-10 h-10'/>
          </motion.button>
        </div>
      </div>

      {/* Sticky Header */}
      <header className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {restaurant.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={`${restaurant.name} logo`} 
                  className={`transition-all duration-300 ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover border-2 border-white shadow-md`} 
                />
              ) : (
                <div className={`transition-all duration-300 ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gradient-to-r from-indigo-500 to-orange-500 flex items-center justify-center shadow-md`}>
                  <Utensils className="w-5 h-5 text-white" />
                </div>
              )}
              <h1 className={`font-bold transition-all duration-300 ${isScrolled ? 'text-lg text-gray-800' : 'text-xl text-white'}`}>
                {restaurant.name}
              </h1>
            </div>
            
            <CartIcon 
              onCartClick={() => setIsCartOpen(true)} 
              itemCount={itemCount} 
              isScrolled={isScrolled}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Category Filter */}
        <div className="sticky top-16 z-20 bg-white py-4 mb-8 border-b">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search menu items..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex overflow-x-auto pb-2 hide-scrollbar">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap mr-2 text-sm font-medium transition-colors ${!activeCategory ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Items
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  scrollToCategory(category);
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap mr-2 text-sm font-medium transition-colors ${activeCategory === category ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-300">
              <Utensils className="w-full h-full" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-700">No items found</h2>
            <p className="mt-2 text-gray-500">Try adjusting your search or filter</p>
          </div>
        ) : (
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
                        <MenuItemDisplayCard 
                          key={item.id} 
                          item={item} 
                          onAddToCart={() => {
                            addItem({ 
                              id: item.id, 
                              name: item.name, 
                              price: item.price, 
                              imageUrl: item.imageUrl 
                            });
                            toast.success(`${item.name} added to cart`);
                          }}
                        />
                      ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </main>
      
      
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} restaurantId={restaurant.id} />
      
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

const MenuItemDisplayCard = ({ item, onAddToCart }: { item: MenuItem; onAddToCart: () => void; }) => (
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

const CartIcon = ({ onCartClick, itemCount, isScrolled }: { onCartClick: () => void; itemCount: number; isScrolled: boolean; }) => {
  return (
    <button
      onClick={onCartClick}
      className={`relative p-2 rounded-full transition-colors ${isScrolled ? 'text-indigo-500' : 'bg-white text-gray-700'}`}
      aria-label="Open cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-indigo-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
};

const CartSidebar = ({ isOpen, onClose, restaurantId }: { isOpen: boolean; onClose: () => void; restaurantId: string; }) => {
  const { cartItems, updateQuantity, removeItem, cartTotal, clearCart, isDelivery, deliveryAddress, setDeliveryOption } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Address fields state
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [complement, setComplement] = useState('');

  const updateAddressField = useCallback((field: string, value: string) => {
    switch(field) {
      case 'street': setStreet(value); break;
      case 'number': setNumber(value); break;
      case 'neighborhood': setNeighborhood(value); break;
      case 'city': setCity(value); break;
      case 'zip': setZip(value); break;
      case 'complement': setComplement(value); break;
    }

    // Get the current values, using the new value for the field being updated
    const currentStreet = field === 'street' ? value : street;
    const currentNumber = field === 'number' ? value : number;
    const currentNeighborhood = field === 'neighborhood' ? value : neighborhood;
    const currentCity = field === 'city' ? value : city;
    const currentZip = field === 'zip' ? value : zip;
    const currentComplement = field === 'complement' ? value : complement;

    // Monta a string formatada para envio
    const formattedAddress = 
      `${currentStreet}, ${currentNumber}${currentComplement ? ', ' + currentComplement : ''}, ${currentNeighborhood}, ${currentCity} - CEP: ${currentZip}`;

    setDeliveryOption(true, formattedAddress);
  }, [street, number, neighborhood, city, zip, complement, setDeliveryOption]);

  const handleCheckout = async () => {
    if (isDelivery && !deliveryAddress.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }
    setIsCheckingOut(true);
    const toastId = toast.loading('Preparing your order...');

    try {
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cartItems, 
          restaurantId,
          isDelivery,
          deliveryAddress
        }),
      });

      const { sessionId } = await response.json();
      if (!response.ok) throw new Error('Failed to create checkout session.');

      const stripe = await stripePromise;
      if (stripe) await stripe.redirectToCheckout({ sessionId });
      
      toast.dismiss(toastId);
    } catch (error) {
      console.error(error);
      toast.error('Could not proceed to checkout.', { id: toastId });
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            <header className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Your Order</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            
            {cartItems.length > 0 ? (
              <>
                <div className="flex-grow p-6 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl mb-6">
                    <button 
                      onClick={() => setDeliveryOption(false)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-colors ${
                        !isDelivery ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Store className="w-5 h-5" /> Retirada
                    </button>
                    <button 
                      onClick={() => setDeliveryOption(true)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-colors ${
                        isDelivery ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Truck className="w-5 h-5" /> Entrega
                    </button>
                  </div>

                  {isDelivery && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mb-6 space-y-4"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de Entrega</label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Rua"
                          value={street}
                          onChange={(e) => updateAddressField('street', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Número"
                          value={number}
                          onChange={(e) => updateAddressField('number', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Bairro"
                          value={neighborhood}
                          onChange={(e) => updateAddressField('neighborhood', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={city}
                          onChange={(e) => updateAddressField('city', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        />
                        <input
                          type="text"
                          placeholder="CEP"
                          value={zip}
                          onChange={(e) => updateAddressField('zip', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Complemento (opcional)"
                          value={complement}
                          onChange={(e) => updateAddressField('complement', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    {cartItems.map(item => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img 
                            src={item.imageUrl || 'https://placehold.co/100x100/EAEAEA/1A1A1A?text=Item'} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-inner">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-4 h-4"/>
                          </button>
                          <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4"/>
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <footer className="p-6 border-t border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-gray-700">Subtotal</span>
                    <span className="font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout} 
                    disabled={isCheckingOut}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Pagamento
                      </>
                    )}
                  </button>
                  <button 
                    onClick={clearCart}
                    className="w-full mt-3 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    Limpar
                  </button>
                </footer>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 text-gray-300 mb-4">
                  <ShoppingCart className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Seu carrinho está vazio!</h3>
                <p className="text-gray-500 mt-2 max-w-xs">
                  Não demora demais, mata logo essa fome!
                </p>
                <button 
                  onClick={onClose}
                  className="text-gray-400 mt-6 px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Ver cardápio
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};