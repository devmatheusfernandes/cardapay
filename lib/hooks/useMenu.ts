import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { db, auth, storage } from '../firebase'; // Make sure to export storage from firebase.ts
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';

// Define the shape of a menu item
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  imagePath?: string; // To store the path for easy deletion
  inStock: boolean;
}

// Define the shape of the data to create/update a menu item
export type MenuItemData = Omit<MenuItem, 'id'>;

/**
 * Custom hook for managing menu items in Firestore.
 * Handles real-time data fetching, creating, updating, and deleting items, including image uploads.
 * @returns {object} An object containing menu items, categories, loading states, and CRUD functions.
 */
export const useMenu = () => {
  const [user, authLoading] = useAuthState(auth);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time data fetching
  useEffect(() => {
    if (authLoading) return; // Wait until auth state is confirmed
    if (!user) {
      setIsLoading(false); // No user, so we're done loading
      return;
    }

    const q = query(collection(db, "menuItems"), where("ownerId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items: MenuItem[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as MenuItem);
        });
        setMenuItems(items);
        setIsLoading(false);
      }, 
      (error) => {
        console.error("Error fetching menu items: ", error);
        toast.error("Could not fetch your menu.");
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user, authLoading]);

  const categories = useMemo(() => ['All Categories', ...new Set(menuItems.map(item => item.category))], [menuItems]);

  // Function to save (create or update) a menu item
  const saveItem = async (itemData: MenuItemData, currentItem: MenuItem | null, imageFile: File | null) => {
    if (!user) {
      toast.error("You must be logged in to save items.");
      return;
    }

    const toastId = toast.loading(currentItem ? 'Updating item...' : 'Adding item...');

    try {
      let imageUrl = currentItem?.imageUrl || '';
      let imagePath = currentItem?.imagePath || '';

      // If a new image file is provided, upload it
      if (imageFile) {
        const filePath = `menu_images/${user.uid}/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
        imagePath = filePath;
      }

      const dataToSave = { ...itemData, imageUrl, imagePath };

      if (currentItem) {
        // Update existing item
        const itemRef = doc(db, 'menuItems', currentItem.id);
        await updateDoc(itemRef, dataToSave);
        toast.success('Item updated successfully!', { id: toastId });
      } else {
        // Add new item with the owner's ID
        await addDoc(collection(db, 'menuItems'), { ...dataToSave, ownerId: user.uid });
        toast.success('Item added successfully!', { id: toastId });
      }
    } catch (error) {
      console.error("Error saving item: ", error);
      toast.error('Failed to save item.', { id: toastId });
    }
  };

  // Function to delete a menu item
  const deleteItem = async (item: MenuItem) => {
    if (!user) {
        toast.error("You must be logged in to delete items.");
        return;
    }
    
    const toastId = toast.loading('Deleting item...');

    try {
      // Delete the document from Firestore
      const itemRef = doc(db, 'menuItems', item.id);
      await deleteDoc(itemRef);

      // If there's an associated image, delete it from Storage
      if (item.imagePath) {
        const imageRef = ref(storage, item.imagePath);
        await deleteObject(imageRef);
      }

      toast.success('Item deleted successfully.', { id: toastId });
    } catch (error) {
      console.error("Error deleting item: ", error);
      toast.error('Failed to delete item.', { id: toastId });
    }
  };
  
  // Function to quickly toggle the inStock status
  const toggleInStock = async (itemId: string, currentStatus: boolean) => {
    const itemRef = doc(db, 'menuItems', itemId);
    try {
        await updateDoc(itemRef, {
            inStock: !currentStatus
        });
        toast.success(`Item marked as ${!currentStatus ? 'in stock' : 'out of stock'}.`);
    } catch (error) {
        console.error("Error toggling stock status: ", error);
        toast.error("Could not update stock status.");
    }
  };

  return { 
    menuItems, 
    categories, 
    isLoading: authLoading || isLoading, 
    saveItem, 
    deleteItem,
    toggleInStock 
  };
};
