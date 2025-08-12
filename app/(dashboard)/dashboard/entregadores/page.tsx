"use client";

import { useState } from "react";
import { useDrivers, Driver } from "../../../../lib/hooks/useDrivers";
import { LoaderCircle, UserPlus, User, Phone, Mail, Key } from "lucide-react";
import { motion } from "framer-motion";
import Modal from "@/app/components/ui/Modal";
import InputField from "@/app/components/ui/InputField";
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";

export default function EntregadoresPage() {
  const { drivers, isLoading, associateDriverByCode } = useDrivers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAssociateDriver = async (code: string) => {
    setIsActionLoading(true);
    await associateDriverByCode(code);
    setIsActionLoading(false);
    setIsModalOpen(false);
  };

  return (
    <SubscriptionGuard>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
              <h1 className="text-3xl font-bold text-slate-800">
                Gerenciamento de Entregadores
              </h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition w-full md:w-auto"
              >
                <UserPlus className="w-5 h-5" />
                Adicionar Entregador
              </motion.button>
            </div>

            {drivers.length === 0 ? (
              <div className="text-center py-20 px-6 rounded-lg">
                <UserPlus className="mx-auto h-16 w-16 text-slate-400" />
                <h3 className="mt-4 text-2xl font-semibold text-slate-800">
                  Nenhum entregador cadastrado
                </h3>
                <p className="mt-2 text-slate-500">
                  Adicione um entregador usando o código fornecido por ele.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
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
                  <tbody className="bg-white divide-y divide-slate-200">
                    {drivers.map((driver) => (
                      <tr key={driver.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {driver.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500">
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
          </div>

          <AssociateDriverModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAssociate={handleAssociateDriver}
            isLoading={isActionLoading}
          />
        </div>
      )}
    </SubscriptionGuard>
  );
}

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
    onAssociate(code);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Entregador por Código"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Peça ao entregador o código único que ele recebeu ao se cadastrar e
          insira-o abaixo.
        </p>
        <InputField
          icon={Key}
          name="code"
          placeholder="Código do Entregador"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="uppercase"
        />

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 disabled:bg-emerald-400"
          >
            {isLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
            {isLoading ? "Adicionando..." : "Adicionar Entregador"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
