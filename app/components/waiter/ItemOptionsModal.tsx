// app/components/waiter/ItemOptionsModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { MessageSquare, Plus } from "lucide-react";

import Modal from "@/app/components/ui/Modal";
import TextAreaField from "@/app/components/ui/TextAreaField";
import ActionButton from "@/app/components/shared/ActionButton";
import {
  MenuItem,
  SizeOption,
  StuffedCrustOption,
} from "@/lib/hooks/useMenuWaiter";
import { SelectedOptions } from "@/lib/context/CartContext";
import { AddonOption } from "@/lib/hooks/useOrders";

interface ItemOptionsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (options: SelectedOptions, notes: string, price: number) => void;
}

export default function ItemOptionsModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemOptionsModalProps) {
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>();
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [selectedStuffedCrust, setSelectedStuffedCrust] = useState<
    StuffedCrustOption | undefined
  >();
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  // Reseta o estado do modal sempre que um novo item é selecionado ou o modal é aberto
  useEffect(() => {
    if (item && isOpen) {
      setSelectedSize(item.sizes?.[0]);
      setSelectedAddons([]);
      setSelectedStuffedCrust(undefined);
      setRemovedIngredients([]);
      setNotes("");
    }
  }, [item, isOpen]);

  // Calcula o preço final dinamicamente com base nas opções selecionadas
  const finalPrice = useMemo(() => {
    if (!item) return 0;
    let total = selectedSize ? selectedSize.price : item.basePrice;
    total += selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    if (selectedStuffedCrust) total += selectedStuffedCrust.price;
    return total;
  }, [item, selectedSize, selectedAddons, selectedStuffedCrust]);

  // Junta as opções e envia para o componente pai
  const handleAddToCartClick = () => {
    const options: SelectedOptions = {
      size: selectedSize,
      addons: selectedAddons,
      stuffedCrust: selectedStuffedCrust,
      removableIngredients: removedIngredients, // Corrigido para `removedIngredients`
    };
    onAddToCart(options, notes, finalPrice);
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name} size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <p className="text-gray-500">{item.description}</p>

        {/* Seção de Tamanhos (Radio) */}
        {item.sizes && item.sizes.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-3">
              Tamanho
            </h3>
            <div className="space-y-2">
              {item.sizes.map((size) => (
                <label
                  key={size.id}
                  className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 cursor-pointer transition-colors"
                >
                  <span className="font-medium">{size.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      R${size.price.toFixed(2)}
                    </span>
                    <input
                      type="radio"
                      name="size"
                      checked={selectedSize?.id === size.id}
                      onChange={() => setSelectedSize(size)}
                      className="form-radio h-5 w-5 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Adicionais (Checkbox) */}
        {item.addons && item.addons.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-3">
              Adicionais
            </h3>
            <div className="space-y-2">
              {item.addons.map((addon) => (
                <label
                  key={addon.id}
                  className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 cursor-pointer transition-colors"
                >
                  <span className="font-medium">{addon.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      + R${addon.price.toFixed(2)}
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedAddons.some((a) => a.id === addon.id)}
                      onChange={() =>
                        setSelectedAddons((prev) =>
                          prev.some((a) => a.id === addon.id)
                            ? prev.filter((a) => a.id !== addon.id)
                            : [...prev, addon]
                        )
                      }
                      className="form-checkbox h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Remover Ingredientes (Checkbox) */}
        {item.removableIngredients && item.removableIngredients.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg text-gray-700 mb-3">
              Remover Ingredientes
            </h3>
            <div className="space-y-2">
              {item.removableIngredients.map((ingredient) => (
                <label
                  key={ingredient}
                  className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-red-50 has-[:checked]:border-red-500 cursor-pointer transition-colors"
                >
                  <span className="font-medium text-gray-700">
                    Sem {ingredient}
                  </span>
                  <input
                    type="checkbox"
                    checked={removedIngredients.includes(ingredient)}
                    onChange={() =>
                      setRemovedIngredients((prev) =>
                        prev.includes(ingredient)
                          ? prev.filter((i) => i !== ingredient)
                          : [...prev, ingredient]
                      )
                    }
                    className="form-checkbox h-5 w-5 text-red-600 rounded focus:ring-red-500"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Observações */}
        <div>
          <h3 className="font-semibold text-lg text-gray-700 mb-3">
            Observações Gerais
          </h3>
          <TextAreaField
            icon={MessageSquare}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Ponto da carne, molho à parte, alergias..."
            rows={3}
          />
        </div>

        {/* Rodapé fixo com preço e botão de confirmação */}
        <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white pb-1 -mx-6 px-6">
          <span className="text-2xl font-bold text-emerald-600">
            R${finalPrice.toFixed(2)}
          </span>
          <ActionButton
            label="Confirmar e Adicionar"
            onClick={handleAddToCartClick}
            icon={<Plus className="w-4 h-4" />}
            variant="primary"
          />
        </div>
      </div>
    </Modal>
  );
}
