// app/components/waiter/MenuModal.tsx
"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { MenuItem, useMenuWaiter } from "@/lib/hooks/useMenuWaiter";

import Modal from "@/app/components/ui/Modal";
import InputField from "@/app/components/ui/InputField";
import ActionButton from "@/app/components/shared/ActionButton";
import Loading from "@/app/components/shared/Loading";
import WaiterMenuItemCard from "./WaiterMenuItemCard";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelect: (item: MenuItem) => void;
}

export default function MenuModal({
  isOpen,
  onClose,
  onItemSelect,
}: MenuModalProps) {
  const { menuItems, isLoading: menuLoading } = useMenuWaiter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    if (!menuItems) return [];
    return [...new Set(menuItems.map((item) => item.category))];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCategory === "all" || item.category === selectedCategory)
    );
  }, [menuItems, searchTerm, selectedCategory]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cardápio" size="lg">
      <div className="space-y-4">
        <InputField
          icon={Search}
          placeholder="Buscar pratos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {/* Categoria "Todos" */}
          <ActionButton
            label="Todos"
            onClick={() => setSelectedCategory("all")}
            variant={selectedCategory === "all" ? "primary" : "secondary"}
            size="sm"
          />
          {/* Outras Categorias */}
          {categories.map((category, index) => (
            <ActionButton
              key={`${category}-${index}`}
              label={category || "Outros"}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "primary" : "secondary"}
              size="sm"
            />
          ))}
        </div>
        {menuLoading ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
            {filteredItems.map((item) => (
              <WaiterMenuItemCard
                key={item.id}
                item={item}
                onAddToCart={onItemSelect}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
