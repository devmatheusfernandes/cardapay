// app/dashboard/waiter/[tableId]/page.tsx
// app/dashboard/waiter/[tableId]/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  CreditCard,
  LoaderCircle,
  MessageSquare,
  Send,
  CheckCircle,
  Package,
  Ban,
  Plus,
  Trash2,
  PlusCircle,
  Users,
  Pencil,
  FileText, // 1. Importar ícone de edição
} from "lucide-react";

import { useMenuWaiter, MenuItem } from "@/lib/hooks/useMenuWaiter";
import { useWaiter, WaiterOrderItem, Seat } from "@/lib/hooks/useWaiter"; // Adicionado 'Seat' para tipagem
import { SelectedOptions } from "@/lib/context/CartContext";
import { Order } from "@/lib/hooks/useOrders";

import MenuModal from "@/app/components/waiter/MenuModal";
import ItemOptionsModal from "@/app/components/waiter/ItemOptionsModal";
import SeatSelectionModal from "@/app/components/waiter/SeatSelectionModal";
import ActionButton from "@/app/components/shared/ActionButton";
// 2. Importar o novo modal e seu tipo
import EditPersonNameModal, {
  PersonWithName,
} from "@/app/components/waiter/EditPersonNameModal";

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

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const { isLoading: menuLoading } = useMenuWaiter();
  const {
    isLoading: actionLoading,
    tableState,
    kitchenOrders,
    addSeat,
    addItemToSeat,
    removeItemFromSeat,
    updateSeatName, // 3. Adicionar a nova função do hook (você precisará criá-la)
    sendToKitchen,
    markAsDelivered,
    prepareFinalBill,
    calculateItemPrice,
  } = useWaiter(tableId);

  // Estados dos modais
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false); // 4. Estado para o novo modal

  // Estado para os itens
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    addons: [],
    removableIngredients: [],
  });
  const [itemNotes, setItemNotes] = useState<string>("");

  // Estado para a pessoa a ser editada
  const [personToEdit, setPersonToEdit] = useState<PersonWithName | null>(null); // 5. Estado para guardar a pessoa em edição

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

  const handleItemSelect = (item: MenuItem) => {
    const hasOptions =
      (item.sizes && item.sizes.length > 0) ||
      (item.addons && item.addons.length > 0) ||
      item.stuffedCrust?.available ||
      (item.removableIngredients && item.removableIngredients.length > 0);

    setSelectedItem(item);
    setItemNotes("");
    setSelectedOptions({ addons: [], removableIngredients: [] });
    setIsMenuModalOpen(false);

    if (hasOptions) {
      setIsOptionsModalOpen(true);
    } else {
      setIsSeatModalOpen(true);
    }
  };

  const handleOptionsConfirm = (
    options: SelectedOptions,
    notes: string,
    price: number
  ) => {
    if (!selectedItem) return;
    setSelectedOptions(options);
    setItemNotes(notes);
    setIsOptionsModalOpen(false);
    setIsSeatModalOpen(true);
  };

  const handleSeatSelect = (seatId: number, additionalNotes: string) => {
    if (!selectedItem) return;
    const combinedNotes = [itemNotes, additionalNotes]
      .filter(Boolean)
      .join(". ");
    addItemToSeat(
      seatId,
      selectedItem,
      combinedNotes,
      selectedOptions.size,
      selectedOptions.addons,
      selectedOptions.stuffedCrust,
      selectedOptions.removableIngredients
    );
    toast.success(`${selectedItem.name} adicionado para Pessoa ${seatId}`);
    setIsSeatModalOpen(false);
    setSelectedItem(null);
    setItemNotes("");
    setSelectedOptions({ addons: [], removableIngredients: [] });
  };

  const handleGoToPayment = async () => {
    // 1. Checagem de itens pendentes (lógica existente)
    if (hasNewItems) {
      toast.error(
        "Existem itens novos que ainda não foram enviados para a cozinha."
      );
      return;
    }

    // 2. NOVA CHECAGEM: Verificar se a mesa já está em pagamento
    if (tableState.isInPayment) {
      // Se já estiver em pagamento, redireciona para a conta existente
      if (tableState.isInPayment) {
        toast.success("Esta mesa já está em pagamento. Redirecionando...");
        router.push(`/dashboard/billing`); // nao consigo usar billid pq ele so é decladaro em baixo
      } else {
        // Caso de segurança para um estado inconsistente
        toast.error(
          "A mesa está em pagamento, mas não foi possível encontrar a conta. Por favor, atualize a página ou contate o suporte."
        );
      }
      return; // Para a execução aqui
    }

    // 3. Se não estiver em pagamento, cria uma nova conta (lógica existente)
    // A função prepareFinalBill deve marcar a mesa como 'isInPayment: true'
    const billId = await prepareFinalBill();
    if (billId) {
      router.push(`/dashboard/billing/${billId}`);
    }
  };

  // 6. Handlers para o novo modal
  const handleOpenEditNameModal = (seat: Seat) => {
    setPersonToEdit({ id: seat.id, name: seat.name || "" });
    setIsEditNameModalOpen(true);
  };

  const handleSavePersonName = (personId: number, name: string) => {
    updateSeatName(personId, name); // Chama a função do hook
    toast.success("Nome atualizado com sucesso!");
    setIsEditNameModalOpen(false); // Fecha o modal ao salvar
  };

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-gray-50">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard/waiter")}
            className="text-slate-600 hover:text-emerald-600"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Mesa {tableId}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow min-h-0">
          <div className="lg:col-span-2 space-y-6 flex flex-col min-h-0">
            <h2 className="text-2xl font-semibold text-slate-700">
              Pedido da Mesa
            </h2>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-bold text-lg text-slate-800 mb-2">
                Pedidos na Cozinha
              </h3>
              {kitchenOrders.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Nenhum pedido ativo na cozinha.
                </p>
              ) : (
                <div className="space-y-3">
                  {kitchenOrders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onDeliver={markAsDelivered}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto flex-grow pr-2">
              {tableState.seats.map((seat) => (
                <div
                  key={seat.id}
                  className="bg-white p-4 rounded-lg shadow-sm border"
                >
                  {/* 7. Atualizar o cabeçalho do card da pessoa */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-slate-800 truncate">
                      {seat.name || `Pessoa ${seat.id}`}
                      <span className="font-normal text-base">
                        {" "}
                        - Novos Itens
                      </span>
                    </h3>
                    <button
                      onClick={() => handleOpenEditNameModal(seat)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                      aria-label={`Editar nome de ${
                        seat.name || `Pessoa ${seat.id}`
                      }`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
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

          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border flex flex-col gap-4 self-start">
            <h2 className="text-2xl font-semibold text-slate-700">Ações</h2>
            <ActionButton
              label="Adicionar do Cardápio"
              onClick={() => setIsMenuModalOpen(true)}
              icon={<PlusCircle className="w-5 h-5" />}
              variant={tableState.isInPayment ? "warning" : "primary"}
              fullWidth
              disabled={tableState.isInPayment}
            />
            <ActionButton
              label="Adicionar Pessoa"
              onClick={addSeat}
              icon={<Users className="w-5 h-5" />}
              variant={tableState.isInPayment ? "warning" : "secondary"}
              fullWidth
              disabled={tableState.isInPayment}
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
          <div>
            <ActionButton
              onClick={sendToKitchen}
              disabled={actionLoading || !hasNewItems}
              label="Enviar Novos Itens"
              icon={<Send className="w-5 h-5" />}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300"
            />
          </div>
          <div className="text-right">
            <p className="text-slate-600">Total da Mesa (geral)</p>
            <p className="text-3xl font-bold text-slate-800">
              R${totalAmount.toFixed(2)}
            </p>
          </div>
          <ActionButton
            onClick={handleGoToPayment}
            disabled={actionLoading || hasNewItems}
            label={tableState.isInPayment ? "Ver Conta" : "Ir para Pagamento"}
            icon={
              tableState.isInPayment ? (
                <FileText className="w-5 h-5" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )
            }
            variant={tableState.isInPayment ? "secondary" : "primary"}
          />
        </div>
      </div>

      {/* Modals */}
      <MenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onItemSelect={handleItemSelect}
      />

      <ItemOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        item={selectedItem}
        onAddToCart={handleOptionsConfirm}
      />

      <SeatSelectionModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        seats={tableState.seats.map((seat) => ({
          id: seat.id,
          name: seat.name || null,
        }))}
        onSeatSelect={handleSeatSelect}
        itemName={selectedItem?.name || ""}
      />

      {/* 8. Renderizar o novo modal */}
      <EditPersonNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => setIsEditNameModalOpen(false)}
        person={personToEdit}
        onSave={handleSavePersonName}
      />
    </>
  );
}

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
  const addons = item.selectedAddons || [];
  const removed = item.removedIngredients || [];

  return (
    <div className="flex justify-between items-start p-3 rounded-md bg-emerald-50 border border-emerald-100">
      <div className="flex-grow">
        <div className="flex items-start gap-2 mb-2">
          <span className="font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full text-xs min-w-fit">
            {item.quantity}x
          </span>
          <div className="flex-grow">
            <span className="font-semibold text-emerald-800">{item.name}</span>
            {!item.submitted && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                (Novo)
              </span>
            )}
          </div>
        </div>

        <div className="ml-6 space-y-1.5 mb-2">
          {item.selectedSize && (
            <div className="flex items-center gap-1.5 text-xs">
              <Package className="w-3 h-3 text-orange-500 flex-shrink-0" />
              <span className="text-orange-700 font-medium">
                Tamanho: {item.selectedSize.name}
              </span>
            </div>
          )}
          {item.selectedStuffedCrust && (
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
          {removed.length > 0 && (
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

// Componente para card de pedido enviado à cozinha
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
        <ActionButton
          onClick={() => onDeliver(order.id)}
          label="Marcar como Entregue"
          icon={<CheckCircle className="w-4 h-4" />}
          fullWidth
          size="sm"
          className="mt-3 bg-green-500 hover:bg-green-600 text-white"
        />
      )}
    </div>
  );
};
