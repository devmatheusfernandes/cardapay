'use client';

import { useState } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { Utensils, MapPin, ShoppingCart, X, Plus, Minus, Trash2, LoaderCircle } from 'lucide-react';
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
    <div className="bg-slate-50 min-h-screen">
        <Toaster position="bottom-center" />
        <header className="bg-white shadow-md">
            <div className="max-w-4xl mx-auto p-6 flex flex-col items-center text-center">
                {restaurant.logoUrl ? (
                     <img src={restaurant.logoUrl} alt={`${restaurant.name} logo`} className="w-24 h-24 rounded-full object-cover border-4 border-white -mt-16 shadow-lg" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-rose-600 flex items-center justify-center border-4 border-white -mt-16 shadow-lg">
                        <Utensils className="w-12 h-12 text-white" />
                    </div>
                )}
                <h1 className="text-4xl font-bold text-slate-800 mt-4">{restaurant.name}</h1>
                {restaurant.address && (
                     <p className="text-slate-500 mt-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4"/>
                        {restaurant.address}
                     </p>
                )}
            </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 sm:p-6">
            {menuItems.length === 0 ? (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold text-slate-700">This restaurant's menu is currently empty.</h2>
                    <p className="text-slate-500 mt-2">Please check back later!</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {categories.map(category => (
                        <div key={category}>
                            <h2 className="text-3xl font-bold text-slate-700 mb-6 border-l-4 border-rose-500 pl-4">{category}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {menuItems.filter(item => item.category === category).map(item => (
                                    <MenuItemDisplayCard 
                                        key={item.id} 
                                        item={item} 
                                        onAddToCart={() => addItem({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl })}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
        
        <CartIcon onCartClick={() => setIsCartOpen(true)} />
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} restaurantId={restaurant.id} />
    </div>
  );
}

// --- UI Components for the Client Page ---

const MenuItemDisplayCard = ({ item, onAddToCart }: { item: MenuItem; onAddToCart: () => void; }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="flex-grow p-4 flex">
            <div className="flex-grow">
                <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                <p className="text-slate-600 text-sm mt-1 flex-grow">{item.description}</p>
                <p className="text-md font-semibold text-rose-600 mt-3">${item.price.toFixed(2)}</p>
            </div>
            {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-md ml-4 flex-shrink-0" />
            )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
             <button 
                onClick={onAddToCart}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg shadow-sm hover:bg-rose-200 transition text-sm font-semibold"
            >
                <Plus className="w-4 h-4" />
                Add to Cart
            </button>
        </div>
    </div>
);

const CartIcon = ({ onCartClick }: { onCartClick: () => void }) => {
    const { itemCount } = useCart();
    return (
        <AnimatePresence>
            {itemCount > 0 && (
                <motion.button
                    initial={{ scale: 0, y: 100 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, y: 100 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onCartClick}
                    className="fixed bottom-6 right-6 bg-rose-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-40"
                    aria-label="Open cart"
                >
                    <ShoppingCart className="w-7 h-7" />
                    <div className="absolute -top-1 -right-1 bg-white text-rose-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold border-2 border-rose-600">
                        {itemCount}
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

const CartSidebar = ({ isOpen, onClose, restaurantId }: { isOpen: boolean; onClose: () => void; restaurantId: string; }) => {
    const { cartItems, updateQuantity, removeItem, cartTotal, clearCart } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        const toastId = toast.loading('Redirecting to payment...');

        try {
            const response = await fetch('/api/checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cartItems, restaurantId }), // Pass restaurantId here
            });

            const { sessionId } = await response.json();

            if (!response.ok) {
                throw new Error('Failed to create checkout session.');
            }

            const stripe = await stripePromise;
            if (stripe) {
                await stripe.redirectToCheckout({ sessionId });
            }
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
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">Your Order</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100">
                                <X className="w-6 h-6" />
                            </button>
                        </header>
                        
                        {cartItems.length > 0 ? (
                            <>
                                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                                    {cartItems.map(item => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <img src={item.imageUrl || 'https://placehold.co/100x100/EAEAEA/1A1A1A?text=Item'} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-slate-800">{item.name}</p>
                                                <p className="text-sm text-slate-500">${item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200"><Minus className="w-4 h-4"/></button>
                                                <span className="font-semibold w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200"><Plus className="w-4 h-4"/></button>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-500 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                                <footer className="p-4 border-t border-slate-200 space-y-4">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <button 
                                        onClick={handleCheckout}
                                        disabled={isCheckingOut}
                                        className="w-full py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition flex items-center justify-center gap-2 disabled:bg-rose-400"
                                    >
                                        {isCheckingOut && <LoaderCircle className="w-5 h-5 animate-spin" />}
                                        Proceed to Checkout
                                    </button>
                                    <button onClick={clearCart} className="w-full text-sm text-slate-500 hover:text-rose-600">
                                        Clear Cart
                                    </button>
                                </footer>
                            </>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                <ShoppingCart className="w-16 h-16 text-slate-300" />
                                <h3 className="mt-4 text-xl font-semibold text-slate-700">Your cart is empty</h3>
                                <p className="text-slate-500 mt-1">Add items from the menu to get started.</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
