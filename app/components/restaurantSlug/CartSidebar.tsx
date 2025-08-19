"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Truck,
  Store,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  LoaderCircle,
} from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { useOrderBackup } from "@/lib/hooks/useOrderBackup";
import { AddressForm } from "./AddressForm";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
}

export function CartSidebar({
  isOpen,
  onClose,
  restaurantId,
}: CartSidebarProps) {
  const {
    cartItems,
    updateQuantity,
    removeItem,
    cartTotal,
    clearCart,
    isDelivery,
    deliveryAddress,
    setDeliveryOption,
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [user] = useAuthState(auth);

  // Order backup system
  const { createBackupOrder, isBackingUp } = useOrderBackup();

  const handleCheckout = async () => {
    if (isDelivery && !deliveryAddress.trim()) {
      toast.error("Por favor, informe um endereço de entrega.");
      return;
    }

    setIsCheckingOut(true);
    const toastId = toast.loading("Preparando seu pedido...");

    try {
      // Generate a unique order ID for backup
      const orderId = uuidv4();

      // Create backup order before proceeding with checkout
      const backupSuccess = await createBackupOrder({
        orderId,
        restaurantId,
        clientId: user?.uid,
        cartItems,
        totalAmount: cartTotal,
        isDelivery,
        deliveryAddress: deliveryAddress || undefined,
      });

      if (!backupSuccess) {
        console.error("❌ Order backup failed - cannot proceed with checkout");
        toast.error("Falha ao criar backup do pedido. Tente novamente.", {
          id: toastId,
        });
        setIsCheckingOut(false);
        return; // Stop checkout if backup fails
      }

      console.log(`✅ Backup order created successfully: ${orderId}`);

      // Prepare headers with authorization if user is logged in
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user) {
        try {
          const idToken = await user.getIdToken();
          headers["Authorization"] = `Bearer ${idToken}`;
        } catch (error) {
          console.error("Error getting ID token:", error);
          // Continue without token if there's an error
        }
      }

      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers,
        body: JSON.stringify({
          cartItems,
          restaurantId,
          isDelivery,
          deliveryAddress: deliveryAddress || undefined, // Ensure empty string becomes undefined
          backupOrderId: orderId, // Pass backup order ID to API
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar a sessão de checkout.");
      }

      const { sessionId } = await response.json();

      // Clear cart only after successful checkout session creation
      clearCart();

      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }

      toast.dismiss(toastId);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Não foi possível ir para o pagamento.", { id: toastId });
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
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
                        !isDelivery
                          ? "bg-white shadow-sm text-gray-900"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <Store className="w-5 h-5" /> Retirada
                    </button>
                    <button
                      onClick={() => setDeliveryOption(true)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-colors ${
                        isDelivery
                          ? "bg-white shadow-sm text-gray-900"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <Truck className="w-5 h-5" /> Entrega
                    </button>
                  </div>

                  {isDelivery && (
                    <AddressForm setDeliveryOption={setDeliveryOption} />
                  )}

                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.cartItemId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <img
                          src={
                            item.imageUrl ||
                            "https://placehold.co/100x100/EAEAEA/1A1A1A?text=Item"
                          }
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-grow">
                          <p className="font-semibold text-gray-900">
                            {item.name}
                          </p>

                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {item.options.size && (
                              <span>{item.options.size.name}</span>
                            )}
                            {item.options.addons &&
                              item.options.addons.map((addon) => (
                                <div key={addon.id}>+ {addon.name}</div>
                              ))}
                            {item.options.notes && (
                              <div className="text-blue-600 italic">
                                📝 {item.options.notes}
                              </div>
                            )}
                            {item.options.selectedFlavors &&
                              item.options.selectedFlavors.length > 0 && (
                                <div className="text-purple-600">
                                  🎨{" "}
                                  {item.options.selectedFlavors.map(
                                    (flavor, index) => (
                                      <span key={index}>
                                        {flavor.percentage}% {flavor.flavorName}
                                        {index <
                                        item.options.selectedFlavors!.length - 1
                                          ? ", "
                                          : ""}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                          </div>

                          {/* ATENÇÃO: Usando o preço final do item */}
                          <p className="text-sm font-semibold text-emerald-600 mt-2">
                            R$ {item.finalPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between h-full">
                          <button
                            // ATENÇÃO: Usando cartItemId para remover o item
                            onClick={() => removeItem(item.cartItemId)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-1 bg-white rounded-full p-0.5 border">
                            <button
                              // ATENÇÃO: Usando cartItemId para atualizar a quantidade
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1
                                )
                              }
                              className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-semibold text-sm w-6 text-center text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              // ATENÇÃO: Usando cartItemId para atualizar a quantidade
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1
                                )
                              }
                              className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <footer className="p-6 border-t border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-gray-700">Subtotal</span>
                    <span className="font-bold text-gray-900">
                      R$ {cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || isBackingUp}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isCheckingOut || isBackingUp ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Ir para Pagamento
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full mt-3 text-sm text-center text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Esvaziar carrinho
                  </button>
                </footer>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 text-gray-300 mb-4">
                  <ShoppingCart className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">
                  Seu carrinho está vazio!
                </h3>
                <p className="text-gray-500 mt-2 max-w-xs">
                  Adicione alguns itens do menu para começar seu pedido.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
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
