// app/(dashboard)/dashboard/menu/page.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  LoaderCircle,
  UtensilsCrossed,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMenu, MenuItem } from "../../../../lib/hooks/useMenu";
import Modal from "@/app/components/ui/Modal";
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";

export default function MenuPage() {
  const { menuItems, categories, isLoading, deleteItem, toggleInStock } =
    useMenu();
  const router = useRouter();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    "Todas as Categorias"
  );

  const handleAddItem = () => {
    router.push("/dashboard/menu/new");
  };

  const handleEditItem = (item: MenuItem) => {
    router.push(`/dashboard/menu/${item.id}`);
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

  const handleDeleteFlow = async () => {
    if (!itemToDelete) return;
    setIsActionLoading(true);
    await deleteItem(itemToDelete);
    setIsActionLoading(false);
    handleCloseDeleteConfirm();
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todas as Categorias" ||
        item.category === selectedCategory;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const displayedCategories = useMemo(() => {
    if (selectedCategory === "Todas as Categorias" && searchTerm === "") {
      return categories.filter((c) => c !== "Todas as Categorias");
    }
    return [...new Set(filteredMenuItems.map((item) => item.category))];
  }, [filteredMenuItems, categories, selectedCategory, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              Gerenciamento do Cardápio
            </h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              Adicionar Novo Item
            </motion.button>
          </div>

          {/* Controles de Busca e Filtro */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por um item do cardápio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-64 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition py-2 px-3"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {menuItems.length === 0 ? (
            <EmptyState onAddItem={handleAddItem} />
          ) : (
            <div className="space-y-8">
              {displayedCategories.map((category) => (
                <div key={category}>
                  <h2 className="text-2xl font-semibold text-slate-700 mb-4 border-b-2 border-slate-200 pb-2">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMenuItems
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onEdit={handleEditItem}
                          onDelete={handleOpenDeleteConfirm}
                          onToggleStock={toggleInStock}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DeleteConfirmationModal
          isOpen={isDeleteConfirmOpen}
          onClose={handleCloseDeleteConfirm}
          onConfirm={handleDeleteFlow}
          itemName={itemToDelete?.name}
          isLoading={isActionLoading}
        />
      </div>
    </SubscriptionGuard>
  );
}

// --- Componentes Reutilizáveis (sem alterações significativas) ---

const EmptyState = ({ onAddItem }: { onAddItem: () => void }) => (
  <div className="text-center py-20 px-6">
    <UtensilsCrossed className="mx-auto h-16 w-16 text-slate-400" />
    <h3 className="mt-4 text-2xl font-semibold text-slate-800">
      Seu cardápio está vazio
    </h3>
    <p className="mt-2 text-slate-500">
      Comece adicionando seu primeiro prato ou bebida.
    </p>
    <div className="mt-6">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddItem}
        className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition"
      >
        <Plus className="w-5 h-5" />
        Adicionar Primeiro Item
      </motion.button>
    </div>
  </div>
);

const MenuItemCard = ({
  item,
  onEdit,
  onDelete,
  onToggleStock,
}: {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleStock: (id: string, status: boolean) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
  >
    <img
      src={
        item.imageUrl ||
        "https://placehold.co/600x400/EAEAEA/1A1A1A?text=Sem+Imagem"
      }
      alt={item.name}
      className="w-full h-48 object-cover"
    />
    <div className="p-4 flex-grow">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold text-slate-800 pr-2">{item.name}</h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold ${
              item.inStock ? "text-green-600" : "text-slate-500"
            }`}
          >
            {item.inStock ? "Em Estoque" : "Esgotado"}
          </span>
          <button
            onClick={() => onToggleStock(item.id, item.inStock)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              item.inStock ? "bg-green-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                item.inStock ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
      <p className="text-slate-600 mt-2 text-sm line-clamp-2">
        {item.description}
      </p>
    </div>
    <div className="p-4 bg-slate-50 flex justify-between items-center">
      <p className="text-lg font-semibold text-emerald-600">
        {/* Lógica de preço corrigida abaixo */}
        {item.promoPrice ? (
          <>
            <span className="line-through text-slate-500 text-sm mr-2">
              {/* Adicionamos (item.basePrice || 0) */}
              R${(item.basePrice || 0).toFixed(2).replace(".", ",")}
            </span>
            {/* Adicionamos (item.promoPrice || 0) */}
            R${(item.promoPrice || 0).toFixed(2).replace(".", ",")}
          </>
        ) : (
          `R$${(item.basePrice || 0).toFixed(2).replace(".", ",")}`
        )}
        {/* Adicionamos (item.basePrice || 0) aqui também */}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="p-2 text-slate-500 hover:text-emerald-600 transition"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-2 text-slate-500 hover:text-emerald-600 transition"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  </motion.div>
);

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  isLoading: boolean;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão" size="sm">
    <p className="text-slate-600 my-4">
      Tem certeza de que deseja excluir o item "{itemName}"? Esta ação não pode
      ser desfeita.
    </p>
    <div className="flex justify-end gap-4">
      <button
        onClick={onClose}
        className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        disabled={isLoading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:bg-red-400"
      >
        {isLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
        {isLoading ? "Excluindo..." : "Excluir"}
      </button>
    </div>
  </Modal>
);
