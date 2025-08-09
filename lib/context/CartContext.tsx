'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

// Define the shape of a single item in the cart
// UPDATE: Export the CartItem interface
export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

// Define the shape of the context's value
interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
  isDelivery: boolean;
  deliveryAddress: string;
  setDeliveryOption: (isDelivery: boolean, address?: string) => void;
}

// Create the context with a default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook for easy access to the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// The provider component that will wrap our page
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const removeItem = useCallback((itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setIsDelivery(false);
    setDeliveryAddress('');
  }, []);
  
  const setDeliveryOption = useCallback((delivery: boolean, address: string = '') => {
    setIsDelivery(delivery);
    setDeliveryAddress(address);
  }, []);

  const itemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    cartTotal,
    isDelivery,
    deliveryAddress,
    setDeliveryOption,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};