"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import {
  FlavorOption,
  FlavorCombination,
} from "@/lib/types/restaurantSlug/types";

interface FlavorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFlavors: SelectedFlavor[], totalPrice: number) => void;
  availableFlavors: FlavorOption[];
  flavorCombinations: FlavorCombination[];
  maxFlavors: number;
  basePrice: number;
  itemName: string;
}

export interface SelectedFlavor {
  flavorId: string;
  flavorName: string;
  percentage: number;
  additionalPrice: number;
}

export default function FlavorSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  availableFlavors,
  flavorCombinations,
  maxFlavors,
  basePrice,
  itemName,
}: FlavorSelectionModalProps) {
  const [selectedFlavors, setSelectedFlavors] = useState<SelectedFlavor[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<string>("");
  const [customFlavors, setCustomFlavors] = useState<SelectedFlavor[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFlavors([]);
      setSelectedCombination("");
      setCustomFlavors([]);
    }
  }, [isOpen]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (selectedCombination) {
      const combination = flavorCombinations.find(
        (c) => c.id === selectedCombination
      );
      return combination ? combination.price : basePrice;
    }

    let total = basePrice;
    customFlavors.forEach((flavor) => {
      total += flavor.additionalPrice * (flavor.percentage / 100);
    });
    return total;
  }, [selectedCombination, customFlavors, flavorCombinations, basePrice]);

  // Handle combination selection
  const handleCombinationSelect = (combinationId: string) => {
    if (combinationId === selectedCombination) {
      setSelectedCombination("");
      return;
    }

    setSelectedCombination(combinationId);
    setCustomFlavors([]);
  };

  // Handle custom flavor percentage change
  const handleFlavorPercentageChange = (
    flavorId: string,
    percentage: number
  ) => {
    const flavor = availableFlavors.find((f) => f.id === flavorId);
    if (!flavor) return;

    setCustomFlavors((prev) => {
      const existing = prev.find((f) => f.flavorId === flavorId);
      if (existing) {
        return prev.map((f) =>
          f.flavorId === flavorId
            ? { ...f, percentage: Math.min(100, Math.max(0, percentage)) }
            : f
        );
      } else {
        return [
          ...prev,
          {
            flavorId,
            flavorName: flavor.name,
            percentage: Math.min(100, Math.max(0, percentage)),
            additionalPrice: flavor.price,
          },
        ];
      }
    });
  };

  // Handle custom flavor removal
  const handleFlavorRemove = (flavorId: string) => {
    setCustomFlavors((prev) => prev.filter((f) => f.flavorId !== flavorId));
  };

  // Calculate total percentage
  const totalPercentage = customFlavors.reduce(
    (sum, flavor) => sum + flavor.percentage,
    0
  );

  // Handle confirmation
  const handleConfirm = () => {
    if (selectedCombination) {
      const combination = flavorCombinations.find(
        (c) => c.id === selectedCombination
      );
      if (combination) {
        const flavors = combination.flavors.map((f) => {
          const flavor = availableFlavors.find((af) => af.id === f.flavorId);
          return {
            flavorId: f.flavorId,
            flavorName: flavor?.name || "Sabor desconhecido",
            percentage: f.percentage,
            additionalPrice: flavor?.price || 0,
          };
        });
        onConfirm(flavors, totalPrice);
      }
    } else {
      onConfirm(customFlavors, totalPrice);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800">
            Escolha os Sabores - {itemName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pre-defined Combinations */}
          {flavorCombinations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-3">
                Combinações Pré-definidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {flavorCombinations.map((combination) => (
                  <button
                    key={combination.id}
                    onClick={() => handleCombinationSelect(combination.id)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedCombination === combination.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800">
                        {combination.name}
                      </span>
                      {selectedCombination === combination.id && (
                        <Check className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {combination.description || "Combinação especial"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {combination.flavors
                          .map((f) => {
                            const flavor = availableFlavors.find(
                              (af) => af.id === f.flavorId
                            );
                            return `${f.percentage}% ${
                              flavor?.name || "Sabor"
                            }`;
                          })
                          .join(", ")}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        R$ {combination.price.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Flavor Selection */}
          <div>
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Ou crie sua própria combinação
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Selecione os sabores e defina as porcentagens (máximo {maxFlavors}{" "}
              sabores)
            </p>

            {/* Available Flavors */}
            <div className="space-y-3">
              {availableFlavors
                .filter((flavor) => flavor.available)
                .map((flavor) => {
                  const isSelected = customFlavors.some(
                    (f) => f.flavorId === flavor.id
                  );
                  const selectedFlavor = customFlavors.find(
                    (f) => f.flavorId === flavor.id
                  );

                  return (
                    <div
                      key={flavor.id}
                      className={`p-3 border rounded-lg transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-slate-800">
                            {flavor.name}
                          </span>
                          {flavor.description && (
                            <p className="text-sm text-slate-500">
                              {flavor.description}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-slate-600">
                          +R$ {flavor.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-sm text-slate-600 mb-1">
                              Porcentagem:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={selectedFlavor?.percentage || 0}
                                onChange={(e) =>
                                  handleFlavorPercentageChange(
                                    flavor.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 p-2 border rounded-md text-center"
                              />
                              <span className="text-sm text-slate-500">%</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFlavorRemove(flavor.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {!isSelected && customFlavors.length < maxFlavors && (
                        <button
                          onClick={() =>
                            handleFlavorPercentageChange(flavor.id, 50)
                          }
                          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar sabor
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Total Percentage Warning */}
            {customFlavors.length > 0 && (
              <div
                className={`mt-3 p-3 rounded-lg ${
                  totalPercentage === 100
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <p
                  className={`text-sm ${
                    totalPercentage === 100
                      ? "text-green-700"
                      : "text-yellow-700"
                  }`}
                >
                  {totalPercentage === 100
                    ? "✅ Porcentagem total: 100% (perfeito!)"
                    : `⚠️ Porcentagem total: ${totalPercentage}% (deve ser 100%)`}
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Preço Total:</span>
              <span className="text-emerald-600">
                R$ {totalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              (selectedCombination === "" && customFlavors.length === 0) ||
              (selectedCombination === "" && totalPercentage !== 100)
            }
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirmar Seleção
          </button>
        </div>
      </div>
    </div>
  );
}
