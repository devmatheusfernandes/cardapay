'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, X, DollarSign, Package, BookOpen, LoaderCircle, UtensilsCrossed, UploadCloud, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useMenu, MenuItem, MenuItemData } from '../../../../lib/hooks/useMenu';
import InputField from '@/app/components/ui/InputField';
import TextAreaField from '@/app/components/ui/TextAreaField';
import Modal from '@/app/components/ui/Modal';

export default function MenuPage() {
  const { menuItems, categories, isLoading, saveItem, deleteItem, toggleInStock } = useMenu();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const handleOpenModal = (item: MenuItem | null = null) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isActionLoading) return;
    setIsModalOpen(false);
    setCurrentItem(null);
  };
  
  const handleOpenDeleteConfirm = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    if (isActionLoading) return;
    setItemToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleSaveFlow = async (itemData: MenuItemData, imageFile: File | null) => {
    setIsActionLoading(true);
    await saveItem(itemData, currentItem, imageFile);
    setIsActionLoading(false);
    handleCloseModal();
  };

  const handleDeleteFlow = async () => {
    if (!itemToDelete) return;
    setIsActionLoading(true);
    await deleteItem(itemToDelete);
    setIsActionLoading(false);
    handleCloseDeleteConfirm();
  };
  
  // Filtered menu items based on search and category selection
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
        const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);
  
  const displayedCategories = useMemo(() => {
      if(selectedCategory === 'All Categories' && searchTerm === '') {
          return categories.filter(c => c !== 'All Categories');
      }
      return [...new Set(filteredMenuItems.map(item => item.category))];
  }, [filteredMenuItems, categories, selectedCategory, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Menu Management</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </motion.button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                <input 
                    type="text"
                    placeholder="Search for a menu item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 transition"
                />
            </div>
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-64 border border-slate-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 transition py-2 px-3"
            >
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>

        {menuItems.length === 0 ? (
          <EmptyState onAddItem={() => handleOpenModal()} />
        ) : (
          <div className="space-y-8">
            {displayedCategories.map(category => (
              <div key={category}>
                <h2 className="text-2xl font-semibold text-slate-700 mb-4 border-b-2 border-slate-200 pb-2">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMenuItems.filter(item => item.category === category).map(item => (
                    <MenuItemCard key={item.id} item={item} onEdit={handleOpenModal} onDelete={handleOpenDeleteConfirm} onToggleStock={toggleInStock} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <MenuItemModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveFlow}
        item={currentItem}
        isLoading={isActionLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDeleteFlow}
        itemName={itemToDelete?.name}
        isLoading={isActionLoading}
      />
    </div>
  );
}

// --- Reusable Components ---

const EmptyState = ({ onAddItem }: { onAddItem: () => void }) => (
    <div className="text-center py-20 px-6 bg-white rounded-lg shadow-md">
        <UtensilsCrossed className="mx-auto h-16 w-16 text-slate-400" />
        <h3 className="mt-4 text-2xl font-semibold text-slate-800">Your menu is empty</h3>
        <p className="mt-2 text-slate-500">Get started by adding your first dish or drink.</p>
        <div className="mt-6">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddItem}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition"
            >
                <Plus className="w-5 h-5" />
                Add First Item
            </motion.button>
        </div>
    </div>
);

const MenuItemCard = ({ item, onEdit, onDelete, onToggleStock }: { item: MenuItem, onEdit: (item: MenuItem) => void, onDelete: (item: MenuItem) => void, onToggleStock: (id: string, status: boolean) => void }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
  >
    <img src={item.imageUrl || 'https://placehold.co/600x400/EAEAEA/1A1A1A?text=No+Image'} alt={item.name} className="w-full h-48 object-cover" />
    <div className="p-4 flex-grow">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-slate-800 pr-2">{item.name}</h3>
        {/* In Stock Toggle Switch */}
        <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${item.inStock ? 'text-green-600' : 'text-slate-500'}`}>{item.inStock ? 'In Stock' : 'Out'}</span>
            <button
                onClick={() => onToggleStock(item.id, item.inStock)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.inStock ? 'bg-green-500' : 'bg-slate-300'}`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.inStock ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
      </div>
      <p className="text-slate-600 mt-2 text-sm">{item.description}</p>
    </div>
    <div className="p-4 bg-slate-50 flex justify-between items-center">
      <p className="text-lg font-semibold text-rose-600">${item.price.toFixed(2)}</p>
      <div className="flex gap-2">
        <button onClick={() => onEdit(item)} className="p-2 text-slate-500 hover:text-indigo-600 transition"><Edit className="w-5 h-5" /></button>
        <button onClick={() => onDelete(item)} className="p-2 text-slate-500 hover:text-rose-600 transition"><Trash2 className="w-5 h-5" /></button>
      </div>
    </div>
  </motion.div>
);

const MenuItemModal = ({ isOpen, onClose, onSave, item, isLoading }: { isOpen: boolean, onClose: () => void, onSave: (data: MenuItemData, imageFile: File | null) => void, item: MenuItem | null, isLoading: boolean }) => {
  const [formData, setFormData] = useState<MenuItemData>({ name: '', description: '', price: 0, category: '', inStock: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({ name: item.name, description: item.description, price: item.price, category: item.category, inStock: item.inStock });
        setImagePreview(item.imageUrl || null);
      } else {
        setFormData({ name: '', description: '', price: 0, category: '', inStock: true });
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [item, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, imageFile);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Menu Item' : 'Add New Menu Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Item Image</label>
                <div 
                    className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-500 cursor-pointer hover:border-rose-500 hover:text-rose-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md"/>
                    ) : (
                        <div className="text-center">
                            <UploadCloud className="mx-auto h-12 w-12" />
                            <p>Click to upload an image</p>
                            <p className="text-xs">PNG, JPG up to 5MB</p>
                        </div>
                    )}
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
            </div>

            <InputField icon={Package} name="name" placeholder="Item Name" value={formData.name} onChange={handleChange} required />
            <InputField icon={BookOpen} name="category" placeholder="Category (e.g., Appetizers)" value={formData.category} onChange={handleChange} required />
            <TextAreaField icon={BookOpen} name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
            <InputField 
                icon={DollarSign} 
                name="price" 
                type="number" 
                placeholder="Price" 
                value={isNaN(formData.price) ? '' : formData.price} 
                onChange={handleChange} 
                required 
                step="0.01" 
            />
            
            <div className="flex items-center justify-between">
                <label htmlFor="inStock" className="text-slate-700 font-medium">In Stock</label>
                <input type="checkbox" id="inStock" name="inStock" checked={formData.inStock} onChange={handleChange} className="h-5 w-5 text-rose-600 border-slate-300 rounded focus:ring-rose-500" />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition flex items-center gap-2 disabled:bg-rose-400">
                {isLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Saving...' : 'Save Item'}
              </button>
            </div>
        </form>
    </Modal>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isLoading } : { isOpen: boolean, onClose: () => void, onConfirm: () => void, itemName?: string, isLoading: boolean }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" size="sm">
        <p className="text-slate-600 my-4">Are you sure you want to delete the item "{itemName}"? This action cannot be undone.</p>
        <div className="flex justify-end gap-4">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Cancel</button>
            <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition flex items-center gap-2 disabled:bg-rose-400">
                {isLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Deleting...' : 'Delete'}
            </button>
        </div>
    </Modal>
);
