// lib/hooks/useWaiter.ts
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  MenuItem,
  SizeOption,
  AddonOption,
  StuffedCrustOption,
} from "./useMenuWaiter";
import { Order } from "./useOrders";

export interface WaiterOrderItem extends MenuItem {
  quantity: number;
  notes?: string;
  submitted?: boolean;
  // Adicionamos campos para opções selecionadas
  selectedSize?: SizeOption;
  selectedAddons?: AddonOption[];
  selectedStuffedCrust?: StuffedCrustOption;
  removedIngredients?: string[];
}

export interface Seat {
  id: number;
  items: WaiterOrderItem[];
}

export interface TableState {
  seats: Seat[];
  paymentMethod: "together" | "separated";
}

const defaultTableState: TableState = {
  seats: [{ id: 1, items: [] }],
  paymentMethod: "together",
};

// Função auxiliar para limpar valores undefined recursivamente
const cleanUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedValues(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    });
    return cleaned;
  }
  
  return obj;
};

export const useWaiter = (tableId: string) => {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<Record<string, TableState>>({});
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);

  // Carregar estado da mesa do Firestore
  useEffect(() => {
    if (!user || !tableId) {
      setIsTableLoading(false);
      return;
    }

    const loadTableState = async () => {
      try {
        const tableDocRef = doc(db, "tableStates", `${user.uid}_${tableId}`);
        const tableDoc = await getDoc(tableDocRef);

        if (tableDoc.exists()) {
          const tableData = tableDoc.data() as TableState;
          setTables((prev) => ({
            ...prev,
            [tableId]: tableData,
          }));
        }
      } catch (error) {
        console.error("Error loading table state:", error);
      } finally {
        setIsTableLoading(false);
      }
    };

    loadTableState();
  }, [user, tableId]);

  // Salvar estado da mesa no Firestore e localStorage
  const saveTableState = async (newState: TableState) => {
    if (!user || !tableId) return;

    try {
      // CORREÇÃO: Limpar valores undefined antes de salvar
      const cleanState = cleanUndefinedValues(newState);
      
      // Salvar no Firestore
      const tableDocRef = doc(db, "tableStates", `${user.uid}_${tableId}`);
      await setDoc(tableDocRef, cleanState, { merge: true });

      // Salvar no localStorage como backup
      if (typeof window !== "undefined") {
        const currentLocal = localStorage.getItem(`waiter_tables_${user.uid}`);
        const localTables = currentLocal ? JSON.parse(currentLocal) : {};
        localTables[tableId] = cleanState;
        localStorage.setItem(
          `waiter_tables_${user.uid}`,
          JSON.stringify(localTables)
        );
      }
    } catch (error) {
      console.error("Error saving table state:", error);
      toast.error("Erro ao salvar estado da mesa");
    }
  };

  useEffect(() => {
    if (!user || !tableId) return;
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", user.uid),
      where("tableId", "==", tableId),
      where("source", "==", "waiter")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      orders.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
      setKitchenOrders(orders);
    });
    return () => unsubscribe();
  }, [user, tableId]);

  const getTableState = (): TableState => {
    return tables[tableId] || defaultTableState;
  };

  const updateTableState = async (newState: Partial<TableState>) => {
    const updatedState = { ...getTableState(), ...newState };
    setTables((prev) => ({
      ...prev,
      [tableId]: updatedState,
    }));
    await saveTableState(updatedState);
  };

  const addSeat = async () => {
    const currentSeats = getTableState().seats;
    await updateTableState({
      seats: [...currentSeats, { id: currentSeats.length + 1, items: [] }],
    });
  };

  // Função para adicionar item com opções selecionadas
  const addItemToSeat = async (
    seatId: number,
    item: MenuItem,
    notes: string,
    selectedSize?: SizeOption,
    selectedAddons?: AddonOption[],
    selectedStuffedCrust?: StuffedCrustOption,
    removedIngredients?: string[]
  ) => {
    const tableState = getTableState();
    const newSeats = tableState.seats.map((seat) => {
      if (seat.id === seatId) {
        // Criar chave de identificação sem valores undefined
        const optionsKey = JSON.stringify({
          id: item.id,
          sizeId: selectedSize?.id || null,
          addonIds: selectedAddons?.map((a) => a.id).sort() || [],
          stuffedCrustId: selectedStuffedCrust?.id || null,
          removed: removedIngredients?.sort() || [],
          notes: notes || '',
        });

        const existingItemIndex = seat.items.findIndex((i) => {
          const existingKey = JSON.stringify({
            id: i.id,
            sizeId: i.selectedSize?.id || null,
            addonIds: i.selectedAddons?.map((a) => a.id).sort() || [],
            stuffedCrustId: i.selectedStuffedCrust?.id || null,
            removed: i.removedIngredients?.sort() || [],
            notes: i.notes || '',
          });
          return existingKey === optionsKey && !i.submitted;
        });

        let newItems;
        if (existingItemIndex > -1) {
          newItems = [...seat.items];
          newItems[existingItemIndex].quantity += 1;
        } else {
          // CORREÇÃO: Criar o objeto do item sem valores undefined
          const waiterOrderItem: WaiterOrderItem = {
            ...item,
            quantity: 1,
            submitted: false,
            // Só adicionar campos se não forem undefined/null/vazios
            ...(notes && { notes }),
            ...(selectedSize && { selectedSize }),
            ...(selectedAddons && selectedAddons.length > 0 && { selectedAddons }),
            ...(selectedStuffedCrust && { selectedStuffedCrust }),
            ...(removedIngredients && removedIngredients.length > 0 && { removedIngredients }),
          };
          newItems = [...seat.items, waiterOrderItem];
        }
        return { ...seat, items: newItems };
      }
      return seat;
    });
    await updateTableState({ seats: newSeats });
  };

  const removeItemFromSeat = async (seatId: number, itemIndex: number) => {
    const tableState = getTableState();
    const newSeats = tableState.seats.map((seat) => {
      if (seat.id === seatId) {
        return {
          ...seat,
          items: seat.items.filter((_, index) => index !== itemIndex),
        };
      }
      return seat;
    });
    await updateTableState({ seats: newSeats });
  };

  const setPaymentMethod = async (method: "together" | "separated") => {
    await updateTableState({ paymentMethod: method });
  };

  const clearTable = async (tableIdToClear: string) => {
    if (!user) return;

    try {
      // Remover do Firestore
      const tableDocRef = doc(
        db,
        "tableStates",
        `${user.uid}_${tableIdToClear}`
      );
      await setDoc(tableDocRef, defaultTableState);

      // Remover do estado local
      setTables((prev) => {
        const newTables = { ...prev };
        delete newTables[tableIdToClear];
        return newTables;
      });
    } catch (error) {
      console.error("Error clearing table:", error);
      toast.error("Erro ao limpar mesa");
    }
  };

  // Função helper para calcular o preço final de um item
  const calculateItemPrice = (item: WaiterOrderItem): number => {
    let price = item.selectedSize?.price || item.basePrice;
    
    // Adicionar preço dos adicionais
    if (item.selectedAddons) {
      price += item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    }
    
    // Adicionar preço da borda recheada
    if (item.selectedStuffedCrust) {
      price += item.selectedStuffedCrust.price;
    }
    
    return price;
  };

  const sendToKitchen = async () => {
    if (!user) return toast.error("You must be logged in.");

    const currentTable = getTableState();
    const itemsToSend = currentTable.seats.flatMap((seat) =>
      seat.items
        .filter((item) => !item.submitted)
        .map((item) => {
          const finalPrice = calculateItemPrice(item);

          // Construir o objeto base do item
          const baseItem = {
            productId: item.id,
            name: item.name,
            price: finalPrice,
            quantity: item.quantity,
            seat: seat.id,
          };

          // CORREÇÃO: Adicionar campos opcionais apenas se existirem
          const optionalFields: any = {};
          
          if (item.notes) optionalFields.notes = item.notes;
          if (item.selectedSize) optionalFields.selectedSize = item.selectedSize;
          if (item.selectedAddons && item.selectedAddons.length > 0) {
            optionalFields.selectedAddons = item.selectedAddons;
          }
          if (item.selectedStuffedCrust) {
            optionalFields.selectedStuffedCrust = item.selectedStuffedCrust;
          }
          if (item.removedIngredients && item.removedIngredients.length > 0) {
            optionalFields.removedIngredients = item.removedIngredients;
          }

          // Construir objeto options
          const options: any = {};
          if (item.selectedSize?.id) options.size = item.selectedSize.id;
          if (item.selectedAddons && item.selectedAddons.length > 0) {
            options.addons = item.selectedAddons.map((addon) => addon.id);
          }
          if (item.selectedStuffedCrust?.id) {
            options.stuffedCrust = item.selectedStuffedCrust.id;
          }
          if (item.removedIngredients && item.removedIngredients.length > 0) {
            options.removableIngredients = item.removedIngredients;
          }
          if (item.notes) options.notes = item.notes;

          // Só adicionar options se tiver conteúdo
          if (Object.keys(options).length > 0) {
            optionalFields.options = options;
          }

          return { ...baseItem, ...optionalFields };
        })
    );

    if (itemsToSend.length === 0) return toast.error("No new items to send.");

    setIsLoading(true);
    const toastId = toast.loading("Sending to kitchen...");

    try {
      // CORREÇÃO: Limpar valores undefined antes de enviar
      const cleanItemsToSend = cleanUndefinedValues(itemsToSend);
      
      await addDoc(collection(db, "orders"), {
        items: cleanItemsToSend,
        tableId,
        restaurantId: user.uid,
        status: "In Progress",
        source: "waiter",
        isDelivery: false,
        createdAt: Timestamp.now(),
        totalAmount: itemsToSend.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
      });

      const newSeats = currentTable.seats.map((seat) => ({
        ...seat,
        items: seat.items.map((item) => ({ ...item, submitted: true })),
      }));
      await updateTableState({ seats: newSeats });

      toast.success("Sent to kitchen!", { id: toastId });
    } catch (error) {
      console.error("Error sending to kitchen: ", error);
      toast.error("Failed to send order.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsDelivered = async (orderId: string) => {
    setIsLoading(true);
    const toastId = toast.loading("Updating status...");
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "Delivered" });
      toast.success("Order marked as delivered!", { id: toastId });
    } catch (error) {
      console.error("Error marking as delivered: ", error);
      toast.error("Failed to update status.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const prepareFinalBill = async () => {
    if (!user) {
      toast.error("You must be logged in.");
      return null;
    }

    const currentTable = getTableState();
    const allItems = currentTable.seats.flatMap((seat) =>
      seat.items.map((item) => {
        const finalPrice = calculateItemPrice(item);

        // CORREÇÃO: Construir item sem valores undefined
        const billItem: any = {
          productId: item.id,
          name: item.name,
          price: finalPrice,
          quantity: item.quantity,
          seat: seat.id,
        };

        // Só adicionar notes se existir
        if (item.notes) {
          billItem.notes = item.notes;
        }

        return billItem;
      })
    );

    if (allItems.length === 0) {
      toast.error("Cannot create a bill for an empty table.");
      return null;
    }

    setIsLoading(true);
    const toastId = toast.loading("Preparing final bill...");

    try {
      const finalBill = {
        items: cleanUndefinedValues(allItems),
        totalAmount: allItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
        tableId,
        paymentMethod: currentTable.paymentMethod,
        restaurantId: user.uid,
        status: "Completed",
        source: "waiter-bill",
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "bills"), finalBill);
      toast.success("Bill ready for payment!", { id: toastId });
      await clearTable(tableId);
      return docRef.id;
    } catch (error) {
      console.error("Error creating bill: ", error);
      toast.error("Failed to prepare bill.", { id: toastId });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading: isLoading || isTableLoading,
    tableState: getTableState(),
    kitchenOrders,
    addSeat,
    addItemToSeat,
    removeItemFromSeat,
    setPaymentMethod,
    sendToKitchen,
    markAsDelivered,
    prepareFinalBill,
    tables,
    calculateItemPrice,
  };
};