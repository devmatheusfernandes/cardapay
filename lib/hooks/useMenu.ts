// lib/hooks/useMenu.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth, storage } from '../firebase';
import { 
  collection, query, where, onSnapshot, addDoc, 
  updateDoc, doc, deleteDoc, getDoc, writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { AddonOption } from './useOrders';

// --- Interfaces para a Nova Estrutura de Dados ---

export interface SizeOption {
  id: string;
  name: string; // Pequeno, Médio, Grande
  price: number;
}

export interface StuffedCrustOption {
  id: string;
  name: string; // Catupiry, Cheddar
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

// Estrutura principal do Item do Cardápio
export interface MenuItem {
  id: string;
  ownerId: string;
  
  // 1. Informações Básicas
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  imagePath?: string;
  basePrice: number;

  // 2. Opções de Variação
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

  // 3. Bebidas e Acompanhamentos (Simplificado como texto por enquanto)
  suggestedDrinks: string[];
  suggestedDesserts: string[];

  // 4. Configurações Avançadas
  availability: {
    [day: string]: { from: string; to: string; } | null; // ex: { "seg": { from: "18:00", to: "22:00" }, "ter": null }
  };
  stock: number | null; // null para infinito, número para quantidade limitada
  averagePrepTime: number; // em minutos
  isDishOfDay: boolean;
  promoPrice?: number;
  inStock: boolean;

  // 5. Etiquetas e Filtros
  dietaryTags: DietaryTag[];
  spiciness: SpicinessLevel;
  isPopular: boolean;
}

// Omitimos 'id' e 'ownerId' para criação/atualização
export type MenuItemData = Omit<MenuItem, 'id' | 'ownerId' | 'imagePath' | 'imageUrl'>;

// Estrutura para os Modelos
export interface MenuTemplate extends Omit<MenuItem, 'id' | 'ownerId' | 'imageUrl' | 'imagePath' | 'inStock'> {
    id: string;
    templateName: string;
    ownerId: string;
}
export type MenuTemplateData = Omit<MenuTemplate, 'id' | 'ownerId'>;


export const useMenu = () => {
  const [user, authLoading] = useAuthState(auth);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTemplates, setMenuTemplates] = useState<MenuTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Busca em tempo real de todos os itens do cardápio do usuário
  useEffect(() => {
    if (!user) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    const q = query(collection(db, "menuItems"), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenuItems(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching menu items: ", error);
      toast.error("Não foi possível carregar seu cardápio.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);
  
  // Busca em tempo real dos modelos salvos pelo usuário
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "menuTemplates"), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuTemplate));
        setMenuTemplates(templates);
    }, (error) => {
        console.error("Error fetching menu templates: ", error);
        toast.error("Não foi possível carregar seus modelos.");
    });
    return () => unsubscribe();
  }, [user]);

  const categories = useMemo(() => ['Todas as Categorias', ...new Set(menuItems.map(item => item.category))], [menuItems]);

  // Busca um único item pelo seu ID (para a página de edição)
  const getItemById = useCallback(async (itemId: string): Promise<MenuItem | null> => {
    if (!user) {
      toast.error("Você precisa estar logado.");
      return null;
    }
    const docRef = doc(db, "menuItems", itemId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
      return { id: docSnap.id, ...docSnap.data() } as MenuItem;
    } else {
      toast.error("Item não encontrado ou você não tem permissão para editá-lo.");
      router.push('/dashboard/menu');
      return null;
    }
  }, [user, router]);

  // Salva (cria ou atualiza) um item
  const saveItem = async (itemId: string | 'new', itemData: MenuItemData, imageFile: File | null) => {
    if (!user) return toast.error("Você precisa estar logado.");

    const isNewItem = itemId === 'new';
    const toastId = toast.loading(isNewItem ? 'Adicionando item...' : 'Atualizando item...');

    try {
      let imageUrl: string | undefined = undefined;
      let imagePath: string | undefined = undefined;

      // Se for edição, busca os dados da imagem atual
      if (!isNewItem) {
          const currentItem = await getItemById(itemId);
          imageUrl = currentItem?.imageUrl;
          imagePath = currentItem?.imagePath;
      }
      
      if (imageFile) {
        const filePath = `menu_images/${user.uid}/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        imagePath = filePath;
      }

      const dataToSave = { 
          ...itemData, 
          ownerId: user.uid,
          ...(imageUrl && { imageUrl }),
          ...(imagePath && { imagePath }),
      };

      if (isNewItem) {
        await addDoc(collection(db, 'menuItems'), dataToSave);
      } else {
        const itemRef = doc(db, 'menuItems', itemId);
        await updateDoc(itemRef, dataToSave);
      }
      
      toast.success(`Item ${isNewItem ? 'adicionado' : 'atualizado'} com sucesso!`, { id: toastId });
      router.push('/dashboard/menu');
    } catch (error) {
      console.error("Error saving item: ", error);
      toast.error('Falha ao salvar o item.', { id: toastId });
    }
  };
  
  // Salva o item atual como um modelo
  const saveAsTemplate = async (templateData: MenuTemplateData) => {
      if (!user) return toast.error("Você precisa estar logado.");
      const toastId = toast.loading("Salvando modelo...");
      try {
          await addDoc(collection(db, "menuTemplates"), {
              ...templateData,
              ownerId: user.uid
          });
          toast.success("Modelo salvo com sucesso!", { id: toastId });
      } catch (error) {
          console.error("Error saving template:", error);
          toast.error("Falha ao salvar o modelo.", { id: toastId });
      }
  };

  // Exclui um item
   // Função para excluir um item
  const deleteItem = async (item: MenuItem) => {
    if (!user) {
        toast.error("Você precisa estar logado para excluir itens.");
        return;
    }
    
    const toastId = toast.loading('Excluindo item...');

    try {
      // Deleta o documento da coleção 'menuItems' no Firestore
      const itemRef = doc(db, 'menuItems', item.id);
      await deleteDoc(itemRef);

      // --- LÓGICA PARA DELETAR A IMAGEM DO STORAGE ---

      // 1. Verifica se o item possui um 'imagePath' salvo no documento
      if (item.imagePath) {
        // 2. Cria uma referência para o arquivo no Firebase Storage usando o caminho salvo
        const imageRef = ref(storage, item.imagePath);

        // 3. Deleta o objeto (a imagem) do Storage
        await deleteObject(imageRef);
        
        console.log("Imagem associada deletada do Storage com sucesso!");
      }
      // --- FIM DA LÓGICA DE EXCLUSÃO DA IMAGEM ---

      toast.success('Item excluído com sucesso.', { id: toastId });
      
      // Se estiver na página de edição do item deletado, volta para a lista
      if (window.location.pathname.includes(item.id)) {
        router.push('/dashboard/menu');
      }
    } catch (error: any) {
      // Tratamento de erro aprimorado
      console.error("Erro ao excluir item: ", error);

      // Se o erro for que a imagem não foi encontrada, não precisamos alarmar o usuário.
      if (error.code === 'storage/object-not-found') {
          toast.success('Item excluído, mas a imagem já não existia no armazenamento.', { id: toastId });
      } else {
          toast.error('Falha ao excluir o item.', { id: toastId });
      }
    }
  };

  // Alterna o status de estoque rapidamente
  const toggleInStock = async (itemId: string, currentStatus: boolean) => {
    const itemRef = doc(db, 'menuItems', itemId);
    try {
      await updateDoc(itemRef, { inStock: !currentStatus });
      toast.success(`Item marcado como ${!currentStatus ? 'disponível' : 'esgotado'}.`);
    } catch (error) {
      console.error("Error toggling stock status: ", error);
      toast.error("Não foi possível atualizar o status.");
    }
  };

  return { 
    menuItems, 
    menuTemplates,
    categories, 
    isLoading: authLoading || isLoading, 
    saveItem, 
    deleteItem,
    toggleInStock,
    getItemById,
    saveAsTemplate
  };
};