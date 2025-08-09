import { useState } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { X, Plus, Minus, Trash2, LoaderCircle, Truck, Store, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { AddressForm } from './AddressForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
}

export function CartSidebar({ isOpen, onClose, restaurantId }: CartSidebarProps) {
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
              <h2 className="text-2xl font-bold text-gray-900">Seu Pedido</h2>
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
                    <AddressForm setDeliveryOption={setDeliveryOption} />
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
                  Adicione alguns itens do menu para começar seu pedido.
                </p>
                <button 
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Continuar Comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

