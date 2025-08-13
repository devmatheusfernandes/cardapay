// app/components/waiter/SeatSelectionModal.tsx
"use client";

import { useState } from "react";
import { User, MessageSquare } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import TextAreaField from "@/app/components/ui/TextAreaField";
import ActionButton from "@/app/components/shared/ActionButton";

interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: { id: number; name: string | null }[];
  onSeatSelect: (seatId: number, notes: string) => void;
  itemName: string;
}

export default function SeatSelectionModal({
  isOpen,
  onClose,
  seats,
  onSeatSelect,
  itemName,
}: SeatSelectionModalProps) {
  const [notes, setNotes] = useState<string>("");

  const handleSeatSelect = (seatId: number) => {
    onSeatSelect(seatId, notes);
    setNotes(""); // Limpa as notas após a seleção
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adicionar "${itemName}" para:`}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">
            Observações do Item
          </h4>
          <TextAreaField
            icon={MessageSquare}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Alergia a camarão, sem pimenta..."
            rows={3}
          />
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">
            Selecionar pessoa:
          </h4>
          <div className="space-y-2">
            {seats.map((seat) => (
              <ActionButton
                key={seat.id}
                label={seat.name || `Pessoa ${seat.id}`}
                onClick={() => handleSeatSelect(seat.id)}
                icon={<User className="w-4 h-4" />}
                variant="secondary"
                fullWidth
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
