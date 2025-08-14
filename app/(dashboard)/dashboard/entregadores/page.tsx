"use client";

import { useState } from "react";
import { useDrivers, Driver } from "../../../../lib/hooks/useDrivers";
import { LoaderCircle, UserPlus, Key } from "lucide-react";

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

// Modal para associar um novo entregador
const AssociateDriverModal = ({
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
    if (!code.trim()) return;
    onAssociate(code);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Entregador por Código"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-slate-600">
          Peça ao entregador o código único que ele recebeu ao se cadastrar e
          insira-o abaixo.
        </p>
        <InputField
          icon={Key}
          name="code"
          placeholder="Código do Entregador"
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
          />
          <ActionButton
            label={isLoading ? "Adicionando..." : "Adicionar"}
            onClick={() => {}} // O submit é tratado pelo form
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
export default function EntregadoresPage() {
  const { drivers, isLoading, associateDriverByCode } = useDrivers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAssociateDriver = async (code: string) => {
    setIsActionLoading(true);
    try {
      await associateDriverByCode(code);
      setIsModalOpen(false);
    } catch (error) {
      // Idealmente, mostrar um toast/notificação de erro aqui
      console.error("Falha ao associar entregador:", error);
    } finally {
      setIsActionLoading(false);
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
            title="Gerenciamento de Entregadores"
            subtitle="Adicione e visualize os entregadores associados à sua loja."
            actionButton={{
              label: "Adicionar Entregador",
              icon: <UserPlus />,
              onClick: () => setIsModalOpen(true),
              variant: "primary",
            }}
          />

          <main className="mt-8">
            <SubContainer variant={drivers.length > 0 ? "white" : "gray"}>
              {drivers.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <UserPlus className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-700">
                    Nenhum entregador cadastrado
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Clique em "Adicionar Entregador" para vincular um novo
                    entregador usando o código dele.
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
                      </tr>
                    </thead>
                    <tbody className="bg-emerald-50 divide-y divide-slate-200">
                      {drivers.map((driver: Driver) => (
                        <tr key={driver.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-900">
                              {driver.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-600">
                              {driver.email}
                            </div>
                            <div className="text-sm text-slate-500">
                              {driver.phone}
                            </div>
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

      <AssociateDriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssociate={handleAssociateDriver}
        isLoading={isActionLoading}
      />
    </SubscriptionGuard>
  );
}
