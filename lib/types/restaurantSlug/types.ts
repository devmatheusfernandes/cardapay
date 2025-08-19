// lib/types.ts

import { AddonOption } from "@/lib/hooks/useOrders";

// Opções que podem ser selecionadas para um item
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

// New interfaces for multiple flavors support
export interface FlavorOption {
  id: string;
  name: string;
  price: number; // Additional price for this flavor
  description?: string;
  available: boolean;
}

export interface FlavorCombination {
  id: string;
  name: string; // e.g., "Meia Margherita, Meia Pepperoni"
  flavors: Array<{
    flavorId: string;
    percentage: number; // 50 for 50%
  }>;
  price: number; // Total price for this combination
  description?: string;
}

export type SpicinessLevel = 'leve' | 'médio' | 'forte' | 'nenhum';
export type DietaryTag = 'vegano' | 'vegetariano' | 'sem-gluten' | 'low-carb';

// Estrutura principal e COMPLETA do Item do Cardápio
// Esta será a nossa "fonte da verdade"
export interface MenuItem {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  basePrice: number;
  sizes: SizeOption[];
  allowMultipleFlavors: boolean;
  // New fields for multiple flavors
  availableFlavors: FlavorOption[];
  flavorCombinations: FlavorCombination[];
  maxFlavors: number; // Maximum number of flavors per item (default: 4)
  stuffedCrust: {
    available: boolean;
    options: StuffedCrustOption[];
  };
  addons: AddonOption[];
  removableIngredients: string[];
  suggestedDrinks: string[];
  suggestedDesserts: string[];
  availability: {
    [day: string]: { from: string; to: string } | null;
  };
  stock: number | null;
  averagePrepTime: number;
  isDishOfDay: boolean;
  promoPrice?: number;
  inStock: boolean;
  dietaryTags: DietaryTag[];
  spiciness: SpicinessLevel;
  isPopular: boolean;
}

// Outros tipos que você usa no projeto
export interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  schedule?: string; // Mantive este campo que estava no seu MenuClientPage
  coverUrl?: string;
}