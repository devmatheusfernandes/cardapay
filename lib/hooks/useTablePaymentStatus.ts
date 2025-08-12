'use client';

import { db, auth } from '../firebase';
import { 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast from 'react-hot-toast';
import { TableState } from './useTableStatus'; // Importar a interface para os dados da mesa

export const useTablePaymentStatus = () => {
  const [user] = useAuthState(auth);

  /**
   * Marca a mesa como "em pagamento"
   * Isso previne que ela seja mostrada como livre enquanto está sendo processada
   */
  const setTableInPayment = async (tableId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    try {
      const docId = `${user.uid}_${tableId}`;
      const tableRef = doc(db, 'tableStates', docId);
      await updateDoc(tableRef, {
        isInPayment: true,
        lastActivity: serverTimestamp()
      });
      console.log(`✅ Mesa ${tableId} marcada como em pagamento`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao marcar mesa ${tableId} como em pagamento:`, error);
      toast.error('Erro ao processar mesa para pagamento');
      return false;
    }
  };

  /**
   * Limpa completamente o estado da mesa
   * Usado quando o pagamento é finalizado com sucesso
   */
  const clearTableState = async (tableId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    try {
      const docId = `${user.uid}_${tableId}`;
      const tableRef = doc(db, 'tableStates', docId);
      await deleteDoc(tableRef);
      console.log(`✅ Estado da mesa ${tableId} limpo completamente`);
      toast.success(`Mesa ${tableId} liberada com sucesso!`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao limpar estado da mesa ${tableId}:`, error);
      toast.error('Erro ao liberar mesa');
      return false;
    }
  };

  /**
   * Remove o status "em pagamento" mas mantém o estado da mesa
   * Usado quando o usuário cancela o processo de pagamento
   */
  const removePaymentStatus = async (tableId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    try {
      const docId = `${user.uid}_${tableId}`;
      const tableRef = doc(db, 'tableStates', docId);
      await updateDoc(tableRef, {
        isInPayment: false,
        lastActivity: serverTimestamp()
      });
      console.log(`✅ Status de pagamento removido da mesa ${tableId}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover status de pagamento da mesa ${tableId}:`, error);
      toast.error('Erro ao cancelar processo de pagamento');
      return false;
    }
  };

  /**
   * Redefine a mesa para o estado inicial (apenas uma pessoa, sem itens)
   * Usado quando queremos manter a mesa ativa mas limpar todos os pedidos
   */
  const resetTableToInitialState = async (tableId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    try {
      const docId = `${user.uid}_${tableId}`;
      const tableRef = doc(db, 'tableStates', docId);
      await setDoc(tableRef, {
        restaurantId: user.uid,
        seats: [{ id: 1, items: [] }],
        paymentMethod: 'together',
        isInPayment: false,
        lastActivity: serverTimestamp()
      });
      console.log(`✅ Mesa ${tableId} redefinida para estado inicial`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao redefinir mesa ${tableId}:`, error);
      toast.error('Erro ao redefinir mesa');
      return false;
    }
  };

  /**
   * Marca todos os pedidos de uma mesa como finalizados
   */
  const markTableOrdersAsCompleted = async (tableId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('restaurantId', '==', user.uid),
        where('tableId', '==', tableId),
        where('status', '!=', 'Completed') 
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log(`Nenhum pedido ativo encontrado para a mesa ${tableId}.`);
        return true;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, { status: 'Completed' });
      });
      await batch.commit();

      console.log(`✅ ${querySnapshot.size} pedido(s) da mesa ${tableId} marcado(s) como completado(s).`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao marcar pedidos da mesa ${tableId} como completados:`, error);
      toast.error('Erro ao finalizar pedidos da mesa.');
      return false;
    }
  };
  
  /**
   * Orquestra todo o processo de fechamento da mesa a partir da tela de mesas.
   */
  const finalizeTablePayment = async (tableId: string, tableData: TableState, totalAmount: number): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    const toastId = toast.loading('Finalizando pagamento...');

    try {
      const ordersMarked = await markTableOrdersAsCompleted(tableId);
      if (!ordersMarked) throw new Error("Falha ao marcar os pedidos como concluídos.");

      const allItems = tableData.seats.flatMap(seat => 
        (seat.items || []).map(item => ({...item, seat: seat.id}))
      );
      
      await addDoc(collection(db, 'bills'), {
        restaurantId: user.uid,
        tableId: tableId,
        createdAt: serverTimestamp(),
        paymentMethod: tableData.paymentMethod,
        items: allItems,
        totalAmount: totalAmount,
        status: 'Completed'
      });
      console.log(`🧾 Conta da mesa ${tableId} criada com sucesso.`);

      await clearTableState(tableId);
      
      toast.success('Pagamento finalizado com sucesso!', { id: toastId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      console.error(`❌ Erro ao finalizar pagamento da mesa ${tableId}:`, error);
      toast.error(`Falha ao finalizar: ${errorMessage}`, { id: toastId });
      await removePaymentStatus(tableId);
      return false;
    }
  }

  /**
   * (NOVA FUNÇÃO ATUALIZADA) Confirma o pagamento de uma conta existente,
   * atualiza os pedidos e libera a mesa.
   * Esta função deve ser chamada da página de cobrança.
   */
  const confirmAndUpdateBill = async (billId: string, tableId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    const toastId = toast.loading('Finalizando pagamento...');

    try {
      const batch = writeBatch(db);

      // Passo 1: Atualizar o status da conta em 'bills' para 'Completed'
      const billRef = doc(db, 'bills', billId);
      batch.update(billRef, { status: 'Completed' });
      console.log(`✅ Conta ${billId} marcada para 'Completed'`);

      // Passo 2: Encontrar e atualizar todos os pedidos ('orders') da mesa para 'Completed'
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('restaurantId', '==', user.uid),
        where('tableId', '==', tableId),
        where('status', '!=', 'Completed')
      );
      const ordersSnapshot = await getDocs(q);
      ordersSnapshot.forEach(orderDoc => {
        batch.update(orderDoc.ref, { status: 'Completed' });
      });
      console.log(`✅ ${ordersSnapshot.size} pedido(s) da mesa ${tableId} marcados para 'Completed'`);

      // Passo 3: Apagar o estado da mesa ('tableStates') para liberá-la
      const tableStateRef = doc(db, 'tableStates', `${user.uid}_${tableId}`);
      batch.delete(tableStateRef);
      console.log(`✅ Estado da mesa ${tableId} marcado para exclusão`);

      // Executar todas as operações em lote
      await batch.commit();

      toast.success('Pagamento finalizado e mesa liberada!', { id: toastId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      console.error(`❌ Erro ao finalizar conta ${billId}:`, error);
      toast.error(`Falha na finalização: ${errorMessage}`, { id: toastId });
      return false;
    }
  };

  return {
    setTableInPayment,
    clearTableState,
    removePaymentStatus,
    resetTableToInitialState,
    markTableOrdersAsCompleted, 
    finalizeTablePayment,
    confirmAndUpdateBill // <-- Exporta a nova função
  };
};