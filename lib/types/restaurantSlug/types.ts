// lib/types.ts

// Opções que podem ser selecionadas para um item
export interface SizeOption {
  id: string;
  name: string;
  price: number;
}

export interface AddonOption {
  id: string;
  name: string;
  price: number;
}

export interface StuffedCrustOption {
  id: string;
  name: string;
  price: number;
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
}