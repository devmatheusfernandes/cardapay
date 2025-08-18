"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { AddonOption } from "../hooks/useOrders";

// --- Interfaces ---
export interface SizeOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface StuffedCrustOption {
  id: string;
  name: string;
  price: number;
}

export interface SelectedOptions {
  size?: SizeOption;
  addons?: AddonOption[];
  stuffedCrust?: StuffedCrustOption;
  removableIngredients?: string[];
  notes?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  quantity: number;
  imageUrl?: string;
  basePrice: number;
  finalPrice: number;
  options: SelectedOptions;
}

export interface ItemToAdd {
  productId: string;
  name: string;
  basePrice: number;
  imageUrl?: string;
  options: SelectedOptions;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (itemToAdd: ItemToAdd) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
  isDelivery: boolean;
  deliveryAddress: string;
  setDeliveryOption: (isDelivery: boolean, address?: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

const CART_STORAGE_KEY = "cardapay-cart-items";

// Helper function to check if two items are identical (same product + options)
const areItemsIdentical = (
  item1: ItemToAdd | CartItem,
  item2: CartItem
): boolean => {
  // Check if product IDs match
  if (item1.productId !== item2.productId) return false;

  // Check if base prices match
  if (item1.basePrice !== item2.basePrice) return false;

  const opts1 = item1.options;
  const opts2 = item2.options;

  // Check size options
  if (opts1.size?.id !== opts2.size?.id) return false;

  // Check stuffed crust options
  if (opts1.stuffedCrust?.id !== opts2.stuffedCrust?.id) return false;

  // Check addons (compare arrays of addon IDs)
  const addons1 = (opts1.addons || []).map((a) => a.id).sort();
  const addons2 = (opts2.addons || []).map((a) => a.id).sort();
  if (addons1.length !== addons2.length) return false;
  if (!addons1.every((id, index) => id === addons2[index])) return false;

  // Check removable ingredients
  const removable1 = (opts1.removableIngredients || []).sort();
  const removable2 = (opts2.removableIngredients || []).sort();
  if (removable1.length !== removable2.length) return false;
  if (!removable1.every((ing, index) => ing === removable2[index]))
    return false;

  // Check notes (treat empty string and undefined as equal)
  const notes1 = opts1.notes?.trim() || "";
  const notes2 = opts2.notes?.trim() || "";
  if (notes1 !== notes2) return false;

  return true;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart items from localStorage", error);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart items to localStorage", error);
    }
  }, [cartItems, isHydrated]);

  const removeItem = useCallback((cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cartItemId !== cartItemId)
    );
  }, []);

  const addItem = useCallback((itemToAdd: ItemToAdd) => {
    console.log("ADICIONANDO ITEM:", JSON.stringify(itemToAdd, null, 2));

    let finalPrice = itemToAdd.basePrice;
    if (itemToAdd.options.size) {
      finalPrice = itemToAdd.options.size.price;
    }
    if (itemToAdd.options.addons) {
      finalPrice += itemToAdd.options.addons.reduce(
        (total, addon) => total + addon.price,
        0
      );
    }
    if (itemToAdd.options.stuffedCrust) {
      finalPrice += itemToAdd.options.stuffedCrust.price;
    }

    setCartItems((prevItems) => {
      // Check if an identical item already exists
      const existingItemIndex = prevItems.findIndex((item) =>
        areItemsIdentical(itemToAdd, item)
      );

      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        console.log("ITEM IDÊNTICO ENCONTRADO - ATUALIZANDO QUANTIDADE");
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
        return updatedItems;
      } else {
        // Add new item
        console.log("ITEM NOVO - ADICIONANDO AO CARRINHO");
        const newCartItem: CartItem = {
          cartItemId: uuidv4(),
          productId: itemToAdd.productId,
          name: itemToAdd.name,
          quantity: 1,
          imageUrl: itemToAdd.imageUrl,
          basePrice: itemToAdd.basePrice,
          finalPrice,
          options: itemToAdd.options,
        };
        return [...prevItems, newCartItem];
      }
    });
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(cartItemId);
      } else {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity } : item
          )
        );
      }
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setIsDelivery(false);
    setDeliveryAddress("");
  }, []);

  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const setDeliveryOption = useCallback(
    (delivery: boolean, address: string = "") => {
      setIsDelivery(delivery);
      setDeliveryAddress(address);
    },
    []
  );

  const itemCount = useMemo(() => {
    if (!isHydrated) return 0;
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems, isHydrated]);

  const cartTotal = useMemo(() => {
    if (!isHydrated) return 0;
    return cartItems.reduce(
      (total, item) => total + item.finalPrice * item.quantity,
      0
    );
  }, [cartItems, isHydrated]);

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
