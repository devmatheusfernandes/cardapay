"use client";

import { useState, useEffect } from "react";
import { useWaiters, Waiter } from "../../../../lib/hooks/useWaiters";
import { LoaderCircle, UserPlus, Key } from "lucide-react";
import { toast } from "react-hot-toast";

// Componentes do Design System
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import ActionButton from "@/app/components/shared/ActionButton";
import Loading from "@/app/components/shared/Loading";
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";
import InputField from "@/app/components/ui/InputField";
import Modal from "@/app/components/ui/Modal";

// Modal para associar um novo garçom
const AssociateWaiterModal = ({
  isOpen,
  onClose,
  onAssociate,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssociate: (code: string) => void;
  isLoading: boolean;
}) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with code:", code);
    if (!code.trim()) {
      toast.error("Por favor, insira um código válido.");
      return;
    }
    onAssociate(code);
    // Reset the form after submission
    setCode("");
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCode("");
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Garçom por Código"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-slate-600">
          Peça ao garçom o código único que ele recebeu ao se cadastrar e
          insira-o abaixo.
        </p>
        <InputField
          icon={Key}
          name="code"
          placeholder="Código do Garçom"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          autoFocus
        />
        <div className="flex justify-end gap-3 pt-2">
          <ActionButton
            label="Cancelar"
            onClick={onClose}
            variant="secondary"
            type="button"
          />
          <ActionButton
            label={isLoading ? "Adicionando..." : "Adicionar"}
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading || !code.trim()}
          />
        </div>
      </form>
    </Modal>
  );
};

// Componente principal da página
export default function GarconsPage() {
  const { waiters, isLoading, associateWaiterByCode, removeWaiter } =
    useWaiters();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAssociateWaiter = async (code: string) => {
    console.log("Attempting to associate waiter with code:", code);
    setIsActionLoading(true);
    try {
      await associateWaiterByCode(code);
      console.log("Waiter associated successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Falha ao associar garçom:", error);
      // Show error toast
      toast.error(
        "Falha ao associar garçom. Verifique o código e tente novamente."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveWaiter = async (waiterId: string) => {
    if (confirm("Tem certeza que deseja remover este garçom do restaurante?")) {
      try {
        await removeWaiter(waiterId);
      } catch (error) {
        console.error("Falha ao remover garçom:", error);
      }
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SubscriptionGuard>
      <SectionContainer>
        <div className="w-full mx-auto">
          <PageHeader
            title="Gerenciamento de Garçons"
            subtitle="Adicione e visualize os garçons associados à sua loja."
            actionButton={{
              label: "Adicionar Garçom",
              icon: <UserPlus />,
              onClick: () => setIsModalOpen(true),
              variant: "primary",
            }}
          />

          <main className="mt-8">
            <SubContainer variant={waiters.length > 0 ? "white" : "gray"}>
              {waiters.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <UserPlus className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-700">
                    Nenhum garçom cadastrado
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Clique em "Adicionar Garçom" para vincular um novo garçom
                    usando o código dele.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-emerald-100">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          Nome
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          Contato
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-emerald-50 divide-y divide-slate-200">
                      {waiters.map((waiter: Waiter) => (
                        <tr key={waiter.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-900">
                              {waiter.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">
                              {waiter.email}
                            </div>
                            <div className="text-sm text-slate-500">
                              {waiter.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleRemoveWaiter(waiter.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transition-colors"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SubContainer>
          </main>
        </div>
      </SectionContainer>

      <AssociateWaiterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssociate={handleAssociateWaiter}
        isLoading={isActionLoading}
      />
    </SubscriptionGuard>
  );
}
