'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, X, Image as ImageIcon, DollarSign, Package, BookOpen, LoaderCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA & TYPES ---
// In a real app, this would come from Firestore and a types definition file.
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
}

const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Classic Burger', description: 'A juicy beef patty with fresh lettuce, tomato, and our secret sauce.', price: 12.99, category: 'Burgers', inStock: true, imageUrl: 'https://placehold.co/600x400/FF6B6B/FFFFFF?text=Burger' },
  { id: '2', name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, tomatoes, and basil.', price: 15.50, category: 'Pizzas', inStock: true },
  { id: '3', name: 'Caesar Salad', description: 'Crisp romaine lettuce with parmesan, croutons, and Caesar dressing.', price: 9.75, category: 'Salads', inStock: false },
  { id: '4', name: 'Spaghetti Carbonara', description: 'Pasta with a creamy egg sauce, pancetta, and pecorino cheese.', price: 14.25, category: 'Pastas', inStock: true },
  { id: '5', name: 'Volcano Roll', description: 'Spicy tuna, cucumber, topped with baked crab and spicy mayo.', price: 16.00, category: 'Sushi', inStock: true, imageUrl: 'https://placehold.co/600x400/4ECDC4/FFFFFF?text=Sushi' },
];
// --- END MOCK DATA ---

export default function MenuPage() {
  // State for menu items (replace with Firestore data later)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For async operations

  const handleOpenModal = (item: MenuItem | null = null) => {
    setCurrentItem(item); // If null, it's a new item
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };
  
  const handleOpenDeleteConfirm = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setItemToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleSaveItem = (itemData: Omit<MenuItem, 'id'>) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (currentItem) {
        // Update existing item
        setMenuItems(menuItems.map(item => item.id === currentItem.id ? { ...item, ...itemData } : item));
      } else {
        // Add new item
        const newItem: MenuItem = { ...itemData, id: Date.now().toString() };
        setMenuItems([...menuItems, newItem]);
      }
      setIsLoading(false);
      handleCloseModal();
    }, 1000);
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        setMenuItems(menuItems.filter(item => item.id !== itemToDelete.id));
        setIsLoading(false);
        handleCloseDeleteConfirm();
    }, 1000);
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </motion.button>
        </div>

        {/* Menu Items Grid */}
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-red-200 pb-2">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.filter(item => item.category === category).map(item => (
                  <MenuItemCard key={item.id} item={item} onEdit={handleOpenModal} onDelete={handleOpenDeleteConfirm} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <MenuItemModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveItem}
        item={currentItem}
        isLoading={isLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDeleteItem}
        itemName={itemToDelete?.name}
        isLoading={isLoading}
      />
    </div>
  );
}

// --- Reusable Components (would be in /components folder) ---

const MenuItemCard = ({ item, onEdit, onDelete }: { item: MenuItem, onEdit: (item: MenuItem) => void, onDelete: (item: MenuItem) => void }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105"
  >
    <img src={item.imageUrl || 'https://placehold.co/600x400/EAEAEA/1A1A1A?text=No+Image'} alt={item.name} className="w-full h-48 object-cover" />
    <div className="p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
      <p className="text-gray-600 mt-2 text-sm">{item.description}</p>
      <p className="text-lg font-semibold text-red-600 mt-4">${item.price.toFixed(2)}</p>
    </div>
    <div className="p-4 bg-gray-50 flex justify-end gap-2">
      <button onClick={() => onEdit(item)} className="p-2 text-gray-600 hover:text-blue-600 transition"><Edit className="w-5 h-5" /></button>
      <button onClick={() => onDelete(item)} className="p-2 text-gray-600 hover:text-red-600 transition"><Trash2 className="w-5 h-5" /></button>
    </div>
  </motion.div>
);

const MenuItemModal = ({ isOpen, onClose, onSave, item, isLoading }: { isOpen: boolean, onClose: () => void, onSave: (data: Omit<MenuItem, 'id'>) => void, item: MenuItem | null, isLoading: boolean }) => {
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, category: '', inStock: true });

  // When the modal opens, populate the form if we are editing an item
  useState(() => {
    if (item) {
      setFormData({ name: item.name, description: item.description, price: item.price, category: item.category, inStock: item.inStock });
    } else {
      setFormData({ name: '', description: '', price: 0, category: '', inStock: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{item ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields with icons */}
                <InputField icon={Package} name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} required />
                <InputField icon={BookOpen} name="category" placeholder="Category (e.g., Appetizers)" value={formData.category} onChange={handleChange} required />
                <TextAreaField icon={BookOpen} name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
                <InputField icon={DollarSign} name="price" type="number" placeholder="Price" value={formData.price} onChange={handleChange} required step="0.01" />
                
                <div className="flex items-center justify-between">
                    <label htmlFor="inStock" className="text-gray-700 font-medium">In Stock</label>
                    <input type="checkbox" id="inStock" name="inStock" checked={formData.inStock} onChange={handleChange} className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:bg-red-400">
                    {isLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
                    {isLoading ? 'Saving...' : 'Save Item'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isLoading } : { isOpen: boolean, onClose: () => void, onConfirm: () => void, itemName?: string, isLoading: boolean }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
                >
                    <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                    <p className="text-gray-600 my-4">Are you sure you want to delete the item "{itemName}"? This action cannot be undone.</p>
                    <div className="flex justify-end gap-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                        <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:bg-red-400">
                            {isLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
                            {isLoading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);


// Helper components for form fields
const InputField = ({ icon: Icon, ...props }) => (
    <div className="relative">
        <Icon className="absolute w-5 h-5 text-gray-400 top-3 left-3" />
        <input {...props} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition" />
    </div>
);

const TextAreaField = ({ icon: Icon, ...props }) => (
    <div className="relative">
        <Icon className="absolute w-5 h-5 text-gray-400 top-3 left-3" />
        <textarea {...props} rows={3} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition" />
    </div>
);
