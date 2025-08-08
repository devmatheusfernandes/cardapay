'use client';

import { useState } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { Utensils, MapPin, ShoppingCart, X, Plus, Minus, Trash2, LoaderCircle, Truck, Store } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
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
  const { addItem } = useCart();
  
  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-50 min-h-screen">
           
      <header className="bg-amber-500 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {restaurant.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={`${restaurant.name} logo`} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" 
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
            </div>
            
            <CartIcon onCartClick={() => setIsCartOpen(true)} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          {restaurant.address && (
            <p className="text-gray-500 inline-flex items-center gap-2 px-4 py-2 bg-amber-200 rounded-full shadow-sm">
              <MapPin className="w-4 h-4 text-amber-500"/>
              {restaurant.address}
            </p>
          )}
          <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">Our Menu</h2>
        </div>

        {menuItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-300">
              <Utensils className="w-full h-full" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-700">This restaurant's menu is currently empty.</h2>
            <p className="mt-2 text-gray-500">Please check back later!</p>
          </div>
        ) : (
          <div className="space-y-16">
            {categories.map(category => (
              <section key={category} className="scroll-mt-24" id={category.toLowerCase().replace(/\s+/g, '-')}>
                <div className="flex items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex-grow">{category}</h2>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-grow ml-4"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuItems.filter(item => item.category === category).map(item => (
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
      </div>
      
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} restaurantId={restaurant.id} />
    </div>
  );
}

const MenuItemDisplayCard = ({ item, onAddToCart }: { item: MenuItem; onAddToCart: () => void; }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-amber-100 rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-300"
  >
    <div className="relative aspect-square overflow-hidden">
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
          <p className="text-gray-500 text-sm mt-1">{item.description}</p>
        </div>
        <p className="text-lg font-semibold text-amber-600 whitespace-nowrap ml-2">
          ${item.price.toFixed(2)}
        </p>
      </div>
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={onAddToCart}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
      >
        <Plus className="w-4 h-4" />
        Adicionar
      </motion.button>
    </div>
  </motion.div>
);

const CartIcon = ({ onCartClick }: { onCartClick: () => void }) => {
  const { itemCount } = useCart();
  
  return (
    <button
      onClick={onCartClick}
      className="relative p-2 rounded-full bg-amber-600 shadow-md hover:shadow-lg transition-shadow"
      aria-label="Open cart"
    >
      <ShoppingCart className="w-6 h-6 text-gray-700" />
      {itemCount > 0 && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-amber-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
        >
          {itemCount > 9 ? '9+' : itemCount}
        </motion.span>
      )}
    </button>
  );
};

const CartSidebar = ({ isOpen, onClose, restaurantId }: { isOpen: boolean; onClose: () => void; restaurantId: string; }) => {
  const { cartItems, updateQuantity, removeItem, cartTotal, clearCart, isDelivery, deliveryAddress, setDeliveryOption } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
                      <Store className="w-5 h-5" /> Pickup
                    </button>
                    <button 
                      onClick={() => setDeliveryOption(true)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-colors ${
                        isDelivery ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Truck className="w-5 h-5" /> Delivery
                    </button>
                  </div>

                  {isDelivery && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mb-6"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryOption(true, e.target.value)}
                        placeholder="Enter your full delivery address..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 transition text-sm"
                        rows={3}
                      />
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
                          className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
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
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Checkout Now
                      </>
                    )}
                  </button>
                  <button 
                    onClick={clearCart}
                    className="w-full mt-3 text-sm text-gray-500 hover:text-amber-600 transition-colors"
                  >
                    Clear Order
                  </button>
                </footer>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 text-gray-300 mb-4">
                  <ShoppingCart className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Your cart is empty</h3>
                <p className="text-gray-500 mt-2 max-w-xs">
                  Add delicious items from our menu to get started
                </p>
                <button 
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Browse Menu
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};