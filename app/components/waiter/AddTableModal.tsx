// app/dashboard/waiter/components/AddTableModal.tsx
'use client';

import { useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTable: (tableId: number) => void;
  existingTableIds: number[];
}

export default function AddTableModal({ isOpen, onClose, onAddTable, existingTableIds }: AddTableModalProps) {
  const [tableNumber, setTableNumber] = useState('');

  const handleSubmit = () => {
    const id = parseInt(tableNumber, 10);
    if (!id || id <= 0) {
      toast.error('Por favor, insira um número de mesa válido.');
      return;
    }
    if (existingTableIds.includes(id)) {
      toast.error(`A mesa de número ${id} já existe.`);
      return;
    }
    onAddTable(id);
    setTableNumber('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Nova Mesa">
      <div className="space-y-4">
        <div>
          <label htmlFor="table-number" className="block text-sm font-medium text-gray-700">
            Número da Mesa
          </label>
          <input
            type="number"
            id="table-number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Ex: 13"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Adicionar Mesa
          </button>
        </div>
      </div>
    </Modal>
  );
}