// app/components/restaurantSlug/ItemOptionsModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Leaf, Palette } from "lucide-react";
import {
  SelectedOptions,
  SizeOption,
  StuffedCrustOption,
} from "@/lib/context/CartContext";
import { MenuItem } from "@/lib/types/restaurantSlug/types";
import { AddonOption } from "@/lib/hooks/useOrders";
import FlavorSelectionModal, { SelectedFlavor } from "./FlavorSelectionModal";

interface ItemOptionsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    options: SelectedOptions & {
      removableIngredients?: string[];
      observation?: string;
      selectedFlavors?: SelectedFlavor[];
    }
  ) => void;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ItemOptionsModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ItemOptionsModalProps) {
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>(
    undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [selectedStuffedCrust, setSelectedStuffedCrust] = useState<
    StuffedCrustOption | undefined
  >(undefined);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
  const [selectedFlavors, setSelectedFlavors] = useState<SelectedFlavor[]>([]);
  const [showFlavorModal, setShowFlavorModal] = useState(false);

  useEffect(() => {
    if (item) {
      setSelectedSize(
        item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined
      );
      setSelectedAddons([]);
      setSelectedStuffedCrust(undefined);
      setRemovedIngredients([]);
      setObservation("");
      setSelectedFlavors([]);
    }
  }, [item]);

  const basePrice = useMemo(() => {
    if (!item) return 0;
    if (item.promoPrice && item.promoPrice > 0) {
      return item.promoPrice;
    }
    if (selectedSize) {
      return selectedSize.price;
    }
    return item.basePrice;
  }, [item, selectedSize]);

  const finalPrice = useMemo(() => {
    if (!item) return 0;
    let total = basePrice;
    total += selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    if (selectedStuffedCrust) {
      total += selectedStuffedCrust.price;
    }
    // Add flavor costs
    selectedFlavors.forEach((flavor) => {
      total += flavor.additionalPrice * (flavor.percentage / 100);
    });
    return total;
  }, [basePrice, selectedAddons, selectedStuffedCrust, selectedFlavors]);

  const handleAddonClick = (addon: AddonOption) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleRemoveIngredientClick = (ingredient: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleFlavorSelection = (
    flavors: SelectedFlavor[],
    totalPrice: number
  ) => {
    setSelectedFlavors(flavors);
    setShowFlavorModal(false);
  };

  const handleAddToCartClick = () => {
    if (!item) return;
    onAddToCart({
      size: selectedSize,
      addons: selectedAddons,
      stuffedCrust: selectedStuffedCrust,
      removableIngredients: removedIngredients,
      notes: observation,
      selectedFlavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
    });
  };

  if (!item) return null;

  const showStuffedCrust =
    item.stuffedCrust &&
    item.stuffedCrust.available &&
    item.stuffedCrust.options.length > 0;
  const showRemovableIngredients =
    item.removableIngredients && item.removableIngredients.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
          >
            <div className="relative">
              <img
                src={item.imageUrl || "/placeholder.png"}
                alt={item.name}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {item.name}
                  </h2>
                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.dietaryTags?.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <Leaf size={12} /> {capitalize(tag.replace("-", " "))}
                    </span>
                  ))}
                  {item.spiciness !== "nenhum" && (
                    <span className="flex items-center gap-1.5 bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      <Flame size={12} /> Picância {capitalize(item.spiciness)}
                    </span>
                  )}
                </div>

                {item.promoPrice && item.promoPrice > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-lg text-amber-800">
                      <span className="line-through mr-2">
                        R$ {item.basePrice.toFixed(2)}
                      </span>
                      <span className="font-bold">
                        R$ {item.promoPrice.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}

                {item.sizes && item.sizes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">
                      Tamanho
                    </h3>
                    <div className="space-y-3">
                      {item.sizes.map((size) => (
                        <label
                          key={size.id}
                          className="flex justify-between items-center p-4 rounded-lg border border-gray-200 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 transition-all cursor-pointer hover:border-gray-300"
                        >
                          <div>
                            <span className="font-medium text-gray-800">
                              {size.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-800">
                              R$ {size.price.toFixed(2)}
                            </span>
                            <input
                              type="radio"
                              name="size"
                              checked={selectedSize?.id === size.id}
                              onChange={() => setSelectedSize(size)}
                              className="form-radio h-5 w-5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {showStuffedCrust && (
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">
                      Borda Recheada
                    </h3>
                    <div className="space-y-3">
                      <label className="flex justify-between items-center p-4 rounded-lg border border-gray-200 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 transition-all cursor-pointer hover:border-gray-300">
                        <div>
                          <span className="font-medium text-gray-800">
                            Nenhuma
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="stuffedCrust"
                            checked={!selectedStuffedCrust}
                            onChange={() => setSelectedStuffedCrust(undefined)}
                            className="form-radio h-5 w-5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                          />
                        </div>
                      </label>
                      {item.stuffedCrust.options.map((crust) => (
                        <label
                          key={crust.id}
                          className="flex justify-between items-center p-4 rounded-lg border border-gray-200 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 transition-all cursor-pointer hover:border-gray-300"
                        >
                          <div>
                            <span className="font-medium text-gray-800">
                              {crust.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-800">
                              + R$ {crust.price.toFixed(2)}
                            </span>
                            <input
                              type="radio"
                              name="stuffedCrust"
                              checked={selectedStuffedCrust?.id === crust.id}
                              onChange={() => setSelectedStuffedCrust(crust)}
                              className="form-radio h-5 w-5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multiple Flavors Section */}
                {item.allowMultipleFlavors &&
                  item.availableFlavors &&
                  item.availableFlavors.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 mb-3">
                        Seleção de Sabores
                      </h3>
                      <div className="space-y-3">
                        {selectedFlavors.length > 0 ? (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-emerald-800">
                                Sabores selecionados:
                              </span>
                              <button
                                onClick={() => setShowFlavorModal(true)}
                                className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                              >
                                Editar
                              </button>
                            </div>
                            <div className="space-y-1">
                              {selectedFlavors.map((flavor, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-emerald-700">
                                    {flavor.percentage}% {flavor.flavorName}
                                  </span>
                                  <span className="text-emerald-600">
                                    +R$ {flavor.additionalPrice.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowFlavorModal(true)}
                            className="w-full p-4 border-2 border-dashed border-emerald-300 rounded-lg text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Palette className="w-5 h-5" />
                            Escolher Sabores
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                {item.addons && item.addons.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">
                      Adicionais
                    </h3>
                    <div className="space-y-3">
                      {item.addons.map((addon) => (
                        <label
                          key={addon.id}
                          className="flex justify-between items-center p-4 rounded-lg border border-gray-200 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 transition-all cursor-pointer hover:border-gray-300"
                        >
                          <div>
                            <span className="font-medium text-gray-800">
                              {addon.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-800">
                              + R$ {addon.price.toFixed(2)}
                            </span>
                            <input
                              type="checkbox"
                              checked={selectedAddons.some(
                                (a) => a.id === addon.id
                              )}
                              onChange={() => handleAddonClick(addon)}
                              className="form-checkbox h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {showRemovableIngredients && (
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">
                      Remover Ingredientes
                    </h3>
                    <div className="space-y-3">
                      {item.removableIngredients.map((ingredient) => (
                        <label
                          key={ingredient}
                          className="flex justify-between items-center p-4 rounded-lg border border-gray-200 has-[:checked]:bg-red-50 has-[:checked]:border-red-500 transition-all cursor-pointer hover:border-gray-300"
                        >
                          <div>
                            <span className="font-medium text-gray-800">
                              {capitalize(ingredient)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                              Remover
                            </span>
                            <input
                              type="checkbox"
                              checked={removedIngredients.includes(ingredient)}
                              onChange={() =>
                                handleRemoveIngredientClick(ingredient)
                              }
                              className="form-checkbox h-5 w-5 text-red-500 rounded border-gray-300 focus:ring-red-500"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Observações
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Alguma instrução especial? Ex: tirar algum ingrediente,
                    ponto da carne, etc.
                  </p>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={3}
                    placeholder="Digite sua observação aqui..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            <footer className="p-6 border-t border-gray-200 bg-white sticky bottom-0">
              <button
                onClick={handleAddToCartClick}
                className="w-full bg-emerald-600 text-white rounded-lg py-3.5 font-semibold flex justify-between items-center px-6 hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <span>Adicionar ao Carrinho</span>
                <span>R$ {finalPrice.toFixed(2)}</span>
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}

      {/* Flavor Selection Modal */}
      {item && item.allowMultipleFlavors && showFlavorModal && (
        <FlavorSelectionModal
          key={`flavor-modal-${item.id}`}
          isOpen={showFlavorModal}
          onClose={() => setShowFlavorModal(false)}
          onConfirm={handleFlavorSelection}
          availableFlavors={item.availableFlavors || []}
          flavorCombinations={item.flavorCombinations || []}
          maxFlavors={item.maxFlavors || 4}
          basePrice={basePrice}
          itemName={item.name}
        />
      )}
    </AnimatePresence>
  );
}
