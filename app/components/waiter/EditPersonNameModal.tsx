// app/components/waiter/EditPersonNameModal.tsx
"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import InputField from "@/app/components/ui/InputField";
import ActionButton from "@/app/components/shared/ActionButton";
export interface PersonWithName {
  id: number;
  name: string;
}
interface EditPersonNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: PersonWithName | null;
  onSave: (personId: number, name: string) => void;
}

export default function EditPersonNameModal({
  isOpen,
  onClose,
  person,
  onSave,
}: EditPersonNameModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (person) {
      setName(person.name || "");
    }
  }, [person]);

  const handleSave = () => {
    if (person && name.trim()) {
      onSave(person.id, name.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Nome" size="sm">
      <div className="space-y-4">
        <InputField
          icon={User}
          placeholder="Nome da pessoa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />
        <div className="flex gap-2">
          <ActionButton
            label="Cancelar"
            onClick={onClose}
            variant="secondary"
            fullWidth
          />
          <ActionButton
            label="Salvar"
            onClick={handleSave}
            variant="primary"
            fullWidth
            disabled={!name.trim()}
          />
        </div>
      </div>
    </Modal>
  );
}
