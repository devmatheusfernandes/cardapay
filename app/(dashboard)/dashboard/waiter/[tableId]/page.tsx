// app/dashboard/waiter/[tableId]/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useMenuWaiter,
  MenuItem,
  SizeOption,
  AddonOption,
  StuffedCrustOption,
} from "@/lib/hooks/useMenuWaiter";
import { useWaiter, WaiterOrderItem } from "@/lib/hooks/useWaiter";
import {
  ChevronLeft,
  User,
  Users,
  Trash2,
  PlusCircle,
  CreditCard,
  LoaderCircle,
  MessageSquare,
  Send,
  CheckCircle,
  Utensils,
  Plus,
  X,
  Package,
  Ban,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Order } from "@/lib/hooks/useOrders";

const statusConfig = {
  "In Progress": {
    text: "Em Preparo",
    color: "text-blue-500",
    bg: "bg-blue-100",
  },
  "Ready to Serve": {
    text: "Pronto para Servir",
    color: "text-green-500",
    bg: "bg-green-100",
  },
  Delivered: { text: "Entregue", color: "text-slate-500", bg: "bg-slate-100" },
};

// Interface para as opções selecionadas (ATUALIZADA)
interface SelectedOptions {
  size?: SizeOption;
  addons: AddonOption[];
  stuffedCrust?: StuffedCrustOption; // <-- NOVO
  removedIngredients: string[]; // <-- NOVO
}

// Modal para seleção de pessoa com campo de observações
interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: any[];
  onSeatSelect: (seatId: number, notes: string) => void;
  itemName: string;
}

function SeatSelectionModal({
  isOpen,
  onClose,
  seats,
  onSeatSelect,
  itemName,
}: SeatSelectionModalProps) {
  const [notes, setNotes] = useState<string>("");

  const handleSeatSelect = (seatId: number) => {
    onSeatSelect(seatId, notes);
    setNotes(""); // Reset notes after selection
    onClose();
  };

  const handleClose = () => {
    setNotes(""); // Reset notes on close
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md p-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Adicionar "{itemName}"
        </h3>

        {/* Observações Section */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-2">
            Observações Adicionais
          </h4>
          <p className="text-sm text-gray-500 mb-2">
            Use para detalhes que não estão nas opções.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Ponto da carne, molho à parte..."
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            rows={3}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {notes.length}/200 caracteres
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-3">
            Selecionar pessoa:
          </h4>
          <div className="space-y-2">
            {seats.map((seat) => (
              <button
                key={seat.id}
                onClick={() => handleSeatSelect(seat.id)}
                className="w-full flex items-center justify-center gap-3 p-3 border-2 rounded-lg hover:bg-indigo-50 hover:border-indigo-500 transition-all"
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-gray-800">
                  Pessoa {seat.id}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          Cancelar
        </button>
      </motion.div>
    </div>
  );
}

// Componente MenuItemCard adaptado para TablePage
interface WaiterMenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

function WaiterMenuItemCard({ item, onAddToCart }: WaiterMenuItemCardProps) {
  const hasVaryingPrices =
    item.sizes &&
    item.sizes.length > 0 &&
    item.sizes.some((size) => size.price !== item.basePrice);
  const displayPrice = `R$${(item.basePrice || 0).toFixed(2)}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-gray-300" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-base font-bold text-gray-800">{item.name}</h3>
            <p className="text-base font-semibold text-indigo-600 whitespace-nowrap">
              {hasVaryingPrices ? `A partir de ${displayPrice}` : displayPrice}
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>

        <div className="mt-4 h-10 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddToCart(item)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Modal de opções do item (ATUALIZADO)
interface ItemOptionsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (options: SelectedOptions, notes: string) => void;
}

function ItemOptionsModal({
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

  // Reset state when modal opens with new item
  useEffect(() => {
    if (item) {
      setSelectedSize(item.sizes?.[0]);
      setSelectedAddons([]);
      setSelectedStuffedCrust(undefined); // Começa sem borda
      setRemovedIngredients([]);
      setNotes("");
    }
  }, [item, isOpen]); // Roda quando o item muda ou o modal abre

  const finalPrice = useMemo(() => {
    if (!item) return 0;
    let total = selectedSize ? selectedSize.price : item.basePrice;
    total += selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    if (selectedStuffedCrust) {
      total += selectedStuffedCrust.price;
    }
    return total;
  }, [item, selectedSize, selectedAddons, selectedStuffedCrust]);

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

  const handleAddToCartClick = () => {
    const options: SelectedOptions = {
      size: selectedSize,
      addons: selectedAddons,
      stuffedCrust: selectedStuffedCrust,
      removedIngredients: removedIngredients,
    };
    onAddToCart(options, notes);
    onClose();
  };

  if (!item || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        <img
          src={item.imageUrl || "/placeholder.png"}
          alt={item.name}
          className="w-full h-48 object-cover rounded-t-2xl"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
            <p className="text-gray-500 mt-1">{item.description}</p>
          </div>

          {/* Sizes Section */}
          {item.sizes && item.sizes.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg text-gray-700">Tamanho</h3>
              <div className="space-y-2 mt-2">
                {item.sizes.map((size) => (
                  <label
                    key={size.id}
                    className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 transition-all cursor-pointer"
                  >
                    <span className="font-medium">{size.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-800">
                        R${size.price.toFixed(2)}
                      </span>
                      <input
                        type="radio"
                        name="size"
                        checked={selectedSize?.id === size.id}
                        onChange={() => setSelectedSize(size)}
                        className="form-radio h-5 w-5 text-indigo-600"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Stuffed Crust Section (NOVO) */}
          {item.stuffedCrust?.available &&
            item.stuffedCrust.options.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-gray-700">
                  Borda Recheada
                </h3>
                <div className="space-y-2 mt-2">
                  {/* Opção para Nenhuma Borda */}
                  <label className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 transition-all cursor-pointer">
                    <span className="font-medium">Nenhuma</span>
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="stuffedCrust"
                        checked={!selectedStuffedCrust}
                        onChange={() => setSelectedStuffedCrust(undefined)}
                        className="form-radio h-5 w-5 text-indigo-600"
                      />
                    </div>
                  </label>
                  {/* Opções de Borda */}
                  {item.stuffedCrust.options.map((crust) => (
                    <label
                      key={crust.id}
                      className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 transition-all cursor-pointer"
                    >
                      <span className="font-medium">{crust.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-800">
                          + R${crust.price.toFixed(2)}
                        </span>
                        <input
                          type="radio"
                          name="stuffedCrust"
                          checked={selectedStuffedCrust?.id === crust.id}
                          onChange={() => setSelectedStuffedCrust(crust)}
                          className="form-radio h-5 w-5 text-indigo-600"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

          {/* Addons Section */}
          {item.addons && item.addons.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg text-gray-700">
                Adicionais
              </h3>
              <div className="space-y-2 mt-2">
                {item.addons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-500 transition-all cursor-pointer"
                  >
                    <span className="font-medium">{addon.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-800">
                        + R${addon.price.toFixed(2)}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedAddons.some((a) => a.id === addon.id)}
                        onChange={() => handleAddonClick(addon)}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Removable Ingredients Section (NOVO) */}
          {item.removableIngredients &&
            item.removableIngredients.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-gray-700">
                  Remover Ingredientes
                </h3>
                <div className="space-y-2 mt-2">
                  {item.removableIngredients.map((ingredient) => (
                    <label
                      key={ingredient}
                      className="flex justify-between items-center p-3 rounded-lg border has-[:checked]:bg-red-50 has-[:checked]:border-red-500 transition-all cursor-pointer"
                    >
                      <span className="font-medium text-gray-700">
                        Sem {ingredient}
                      </span>
                      <input
                        type="checkbox"
                        checked={removedIngredients.includes(ingredient)}
                        onChange={() => handleRemoveIngredientClick(ingredient)}
                        className="form-checkbox h-5 w-5 text-red-600 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

          {/* Observações Section */}
          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-700">
              Observações Gerais
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Qualquer detalhe que não esteja nas opções acima.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Ponto da carne, molho à parte..."
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              rows={3}
              maxLength={200}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {notes.length}/200 caracteres
            </div>
          </div>
        </div>

        <footer className="p-6 mt-auto border-t">
          <button
            onClick={handleAddToCartClick}
            className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold flex justify-between items-center hover:bg-indigo-700 transition-colors px-6"
          >
            <span>Adicionar</span>
            <span>R${finalPrice.toFixed(2)}</span>
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const { menuItems, isLoading: menuLoading } = useMenuWaiter();
  const {
    isLoading: actionLoading,
    tableState,
    kitchenOrders,
    addSeat,
    addItemToSeat,
    removeItemFromSeat,
    setPaymentMethod,
    sendToKitchen,
    markAsDelivered,
    prepareFinalBill,
    calculateItemPrice,
  } = useWaiter(tableId);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    addons: [],
    removedIngredients: [],
  });
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  const [itemNotes, setItemNotes] = useState<string>("");

  const hasNewItems = useMemo(() => {
    return tableState.seats.some((seat) =>
      seat.items.some((item) => !item.submitted)
    );
  }, [tableState.seats]);

  const totalAmount = useMemo(() => {
    return tableState.seats.reduce(
      (total, seat) =>
        total +
        seat.items.reduce(
          (seatTotal, item) =>
            seatTotal + calculateItemPrice(item) * item.quantity,
          0
        ),
      0
    );
  }, [tableState.seats, calculateItemPrice]);

  const handleItemClick = (item: MenuItem) => {
    const hasOptions =
      (item.sizes && item.sizes.length > 0) ||
      (item.addons && item.addons.length > 0) ||
      item.stuffedCrust?.available ||
      (item.removableIngredients && item.removableIngredients.length > 0);

    setSelectedItem(item);
    setItemNotes(""); // Reset notes
    setSelectedOptions({ addons: [], removedIngredients: [] });

    if (hasOptions) {
      setIsOptionsModalOpen(true);
    } else {
      setIsSeatModalOpen(true);
    }
  };

  const handleOptionsConfirm = (options: SelectedOptions, notes: string) => {
    if (!selectedItem) return;
    setSelectedOptions(options);
    setItemNotes(notes); // Notes from the options modal
    setIsOptionsModalOpen(false);
    setIsSeatModalOpen(true);
  };

  const handleSeatSelect = (seatId: number, additionalNotes: string) => {
    if (!selectedItem) return;

    // Combine notes from both modals
    const combinedNotes = [itemNotes, additionalNotes]
      .filter(Boolean)
      .join(". ");

    // ATENÇÃO: A função `addItemToSeat` no seu hook `useWaiter` precisará ser atualizada
    // para aceitar `selectedOptions.stuffedCrust` e `selectedOptions.removedIngredients`.
    addItemToSeat(
      seatId,
      selectedItem,
      combinedNotes,
      selectedOptions.size,
      selectedOptions.addons,
      selectedOptions.stuffedCrust,
      selectedOptions.removedIngredients
    );

    toast.success(`${selectedItem.name} adicionado para Pessoa ${seatId}`);
    setSelectedItem(null);
    setItemNotes("");
    setSelectedOptions({ addons: [], removedIngredients: [] });
  };

  const handleGoToPayment = async () => {
    if (hasNewItems) {
      toast.error(
        "Existem itens novos que ainda não foram enviados para a cozinha."
      );
      return;
    }
    const billId = await prepareFinalBill();
    if (billId) {
      router.push(`/dashboard/billing/${billId}`);
    }
  };

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/waiter")}
            className="text-slate-600 hover:text-indigo-600"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Mesa {tableId}</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow min-h-0">
          {/* Order Section */}
          <div className="lg:col-span-2 space-y-6 flex flex-col min-h-0">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-slate-700">
                Pedido da Mesa
              </h2>
              <button
                onClick={addSeat}
                className="flex items-center gap-2 text-indigo-600 font-semibold"
              >
                <PlusCircle className="w-5 h-5" /> Adicionar Pessoa
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-bold text-lg text-slate-800 mb-2">
                Pedidos na Cozinha
              </h3>
              {kitchenOrders.length === 0 && (
                <p className="text-sm text-slate-400">
                  Nenhum pedido ativo na cozinha.
                </p>
              )}
              <div className="space-y-3">
                {kitchenOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    onDeliver={markAsDelivered}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto flex-grow pr-2">
              {tableState.seats.map((seat) => (
                <div
                  key={seat.id}
                  className="bg-white p-4 rounded-lg shadow-sm border"
                >
                  <h3 className="font-bold text-lg text-slate-800 mb-2">
                    Pessoa {seat.id} - Novos Itens
                  </h3>
                  <div className="space-y-2">
                    {seat.items.filter((i) => !i.submitted).length === 0 && (
                      <p className="text-sm text-slate-400">
                        Nenhum item novo para enviar.
                      </p>
                    )}
                    {seat.items.map(
                      (item, index) =>
                        !item.submitted && (
                          <OrderItemCard
                            key={index}
                            item={item}
                            onRemove={() => removeItemFromSeat(seat.id, index)}
                            calculateItemPrice={calculateItemPrice}
                          />
                        )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col min-h-0">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">
              Cardápio
            </h2>
            <div className="flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-1 gap-4">
                {menuItems.map((item) => (
                  <WaiterMenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleItemClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <button
              onClick={sendToKitchen}
              disabled={actionLoading || !hasNewItems}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              <Send className="w-5 h-5" /> Enviar Novos Itens
            </button>
          </div>
          <div className="text-right">
            <p className="text-slate-600">Total da Mesa (geral)</p>
            <p className="text-3xl font-bold text-slate-800">
              R${totalAmount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleGoToPayment}
            disabled={actionLoading || hasNewItems}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" /> Ir para Pagamento
          </button>
        </div>
      </div>

      {/* Modals */}
      <ItemOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        item={selectedItem}
        onAddToCart={handleOptionsConfirm}
      />

      <SeatSelectionModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        seats={tableState.seats}
        onSeatSelect={handleSeatSelect}
        itemName={selectedItem?.name || ""}
      />
    </>
  );
}

// Componente para mostrar detalhes do item do pedido (ATUALIZADO)
interface OrderItemCardProps {
  item: WaiterOrderItem;
  onRemove: () => void;
  calculateItemPrice: (item: WaiterOrderItem) => number;
}

function OrderItemCard({
  item,
  onRemove,
  calculateItemPrice,
}: OrderItemCardProps) {
  const itemPrice = calculateItemPrice(item);

  // Certifique-se de que selectedAddons e removedIngredients sejam arrays
  const addons = item.selectedAddons || [];
  const removed = item.removedIngredients || [];

  return (
    <div className="flex justify-between items-start p-3 rounded-md bg-indigo-50 border border-indigo-100">
      <div className="flex-grow">
        <div className="flex items-start gap-2 mb-2">
          <span className="font-bold text-indigo-800 bg-indigo-200 px-2 py-0.5 rounded-full text-xs min-w-fit">
            {item.quantity}x
          </span>
          <div className="flex-grow">
            <span className="font-semibold text-indigo-800">{item.name}</span>
            {!item.submitted && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                (Novo)
              </span>
            )}
          </div>
        </div>

        {/* Mostrar opções selecionadas */}
        <div className="ml-6 space-y-1.5 mb-2">
          {item.selectedSize && (
            <div className="flex items-center gap-1.5 text-xs">
              <Package className="w-3 h-3 text-orange-500 flex-shrink-0" />
              <span className="text-orange-700 font-medium">
                Tamanho: {item.selectedSize.name}
              </span>
            </div>
          )}
          {item.selectedStuffedCrust && ( // <-- NOVO
            <div className="flex items-center gap-1.5 text-xs">
              <PlusCircle className="w-3 h-3 text-purple-500 flex-shrink-0" />
              <span className="text-purple-700 font-medium">
                Borda: {item.selectedStuffedCrust.name}
              </span>
            </div>
          )}
          {addons.length > 0 && (
            <div className="text-xs">
              <div className="text-green-700 font-medium flex items-center gap-1.5">
                <Plus className="w-3 h-3 text-green-500" /> Adicionais:
              </div>
              <span className="ml-4 text-green-600">
                {addons.map((a) => a.name).join(", ")}
              </span>
            </div>
          )}
          {removed.length > 0 && ( // <-- NOVO
            <div className="text-xs">
              <div className="text-red-700 font-medium flex items-center gap-1.5">
                <Ban className="w-3 h-3 text-red-500" /> Removidos:
              </div>
              <span className="ml-4 text-red-600">{removed.join(", ")}</span>
            </div>
          )}
        </div>

        {item.notes && (
          <div className="ml-6 bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
            <p className="text-xs text-blue-800 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              {item.notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-4">
        <span className="font-semibold text-slate-800 whitespace-nowrap">
          R${(itemPrice * item.quantity).toFixed(2)}
        </span>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const KitchenOrderCard = ({
  order,
  onDeliver,
}: {
  order: Order;
  onDeliver: (orderId: string) => void;
}) => {
  const config = statusConfig[order.status as keyof typeof statusConfig] || {
    text: order.status,
    color: "text-slate-500",
  };
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div
      className={`p-3 rounded-lg border ${
        order.status === "Delivered" ? "bg-slate-50" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-center">
        <span
          className={`text-sm font-bold px-2 py-1 rounded-full ${config.bg} ${config.color}`}
        >
          {config.text}
        </span>
        <span className="text-sm font-semibold">
          Subtotal: R${subtotal.toFixed(2)}
        </span>
      </div>
      <ul className="mt-2 text-sm space-y-1 border-t pt-2">
        {order.items.map((item, index) => (
          <li key={index}>
            <span>
              {item.quantity}x {item.name} (P{item.seat})
            </span>
          </li>
        ))}
      </ul>
      {order.status === "Ready to Serve" && (
        <button
          onClick={() => onDeliver(order.id)}
          className="w-full mt-3 flex items-center justify-center gap-2 py-1.5 bg-green-500 text-white font-semibold rounded-md text-sm hover:bg-green-600 transition"
        >
          <CheckCircle className="w-4 h-4" />
          Marcar como Entregue
        </button>
      )}
    </div>
  );
};
