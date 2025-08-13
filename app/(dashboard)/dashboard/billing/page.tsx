"use client";

import { useRouter } from "next/navigation";
import { useBills, Bill } from "@/lib/hooks/useBills";
import {
  FileText,
  ChevronRight,
  CreditCard,
  Filter,
  Calendar,
  Hash,
  DollarSign,
  X,
  Search,
} from "lucide-react";
import TimeAgo from "react-timeago";
import ptBrStrings from "react-timeago/lib/language-strings/pt-br";
import buildFormatter from "react-timeago/lib/formatters/buildFormatter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

// Componentes do Design System
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import Loading from "@/app/components/shared/Loading";

const formatter = buildFormatter(ptBrStrings);

// Interfaces para filtros
interface FilterState {
  search: string;
  status: "all" | "paid" | "pending";
  dateRange: "all" | "today" | "week" | "month" | "custom";
  minAmount: string;
  maxAmount: string;
  tableId: string;
}

// Componente de filtros
const FilterPanel = ({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
  totalBills,
  filteredCount,
}: {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
  totalBills: number;
  filteredCount: number;
}) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      dateRange: "all",
      minAmount: "",
      maxAmount: "",
      tableId: "",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.dateRange !== "all" ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.tableId;

  return (
    <>
      {/* Header dos filtros */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              isOpen
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {
                  [
                    filters.search,
                    filters.status !== "all",
                    filters.dateRange !== "all",
                    filters.minAmount,
                    filters.maxAmount,
                    filters.tableId,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="text-sm text-slate-500">
          {filteredCount === totalBills
            ? `${totalBills} conta${totalBills !== 1 ? "s" : ""}`
            : `${filteredCount} de ${totalBills} conta${
                totalBills !== 1 ? "s" : ""
              }`}
        </div>
      </div>

      {/* Panel de filtros */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <SubContainer className="p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Busca */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Buscar
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    placeholder="Mesa, valor..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter("status", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">Todos</option>
                    <option value="paid">Pagas</option>
                    <option value="pending">Pendentes</option>
                  </select>
                </div>

                {/* Período */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Período
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilter("dateRange", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">Todos</option>
                    <option value="today">Hoje</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mês</option>
                  </select>
                </div>

                {/* Mesa */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Mesa
                  </label>
                  <input
                    type="text"
                    value={filters.tableId}
                    onChange={(e) => updateFilter("tableId", e.target.value)}
                    placeholder="Número da mesa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Valor mínimo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor mínimo
                  </label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => updateFilter("minAmount", e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Valor máximo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor máximo
                  </label>
                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => updateFilter("maxAmount", e.target.value)}
                    placeholder="999,99"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </SubContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Componente para um item da lista de contas
const BillItem = ({ bill, onClick }: { bill: Bill; onClick: () => void }) => {
  const isPaid = bill.status === "Completed";
  const itemColor = isPaid ? "green" : "amber";

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 4px 10px -1px rgb(0 0 0 / 0.1)" }}
      className="cursor-pointer"
      layout
    >
      <SubContainer className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-lg ${
              isPaid ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                isPaid ? "text-green-600" : "text-amber-600"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-800">Mesa {bill.tableId}</p>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isPaid ? "Paga" : "Pendente"}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Fechada{" "}
              <TimeAgo date={bill.createdAt.toDate()} formatter={formatter} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`font-bold text-lg ${
              isPaid ? "text-green-600" : "text-amber-600"
            }`}
          >
            R$ {bill.totalAmount.toFixed(2).replace(".", ",")}
          </span>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </SubContainer>
    </motion.div>
  );
};

// Componente principal da página
export default function BillingHistoryPage() {
  const router = useRouter();
  const { bills, isLoading } = useBills();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    dateRange: "all",
    minAmount: "",
    maxAmount: "",
    tableId: "",
  });

  // Filtrar contas baseado nos filtros ativos
  const filteredBills = useMemo(() => {
    if (!bills) return [];

    return bills.filter((bill) => {
      // Filtro de busca (mesa ou valor)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTable = bill.tableId?.toString().includes(searchLower);
        const matchesAmount = bill.totalAmount.toFixed(2).includes(searchLower);
        if (!matchesTable && !matchesAmount) return false;
      }

      // Filtro de status
      if (filters.status !== "all") {
        const isPaid = bill.status === "Completed";
        if (filters.status === "paid" && !isPaid) return false;
        if (filters.status === "pending" && isPaid) return false;
      }

      // Filtro de mesa específica
      if (
        filters.tableId &&
        !bill.tableId?.toString().includes(filters.tableId)
      ) {
        return false;
      }

      // Filtro de valor mínimo
      if (
        filters.minAmount &&
        bill.totalAmount < parseFloat(filters.minAmount)
      ) {
        return false;
      }

      // Filtro de valor máximo
      if (
        filters.maxAmount &&
        bill.totalAmount > parseFloat(filters.maxAmount)
      ) {
        return false;
      }

      // Filtro de período
      if (filters.dateRange !== "all") {
        const billDate = bill.createdAt.toDate();
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        switch (filters.dateRange) {
          case "today":
            if (billDate < today) return false;
            break;
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (billDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              today.getDate()
            );
            if (billDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [bills, filters]);

  if (isLoading) {
    return <Loading fullScreen text="Carregando histórico de contas..." />;
  }

  return (
    <SubscriptionGuard>
      <SectionContainer>
        <PageHeader
          title="Histórico de Contas"
          subtitle="Visualize e filtre os detalhes de todas as contas."
        />

        <main className="mt-8">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
            totalBills={bills?.length || 0}
            filteredCount={filteredBills.length}
          />

          {filteredBills.length === 0 ? (
            <div className="flex items-center justify-center pt-16">
              <SubContainer className="text-center p-10 max-w-md">
                <CreditCard className="mx-auto h-16 w-16 text-slate-400" />
                <h2 className="mt-4 text-2xl font-semibold text-slate-700">
                  {bills?.length === 0
                    ? "Nenhuma conta encontrada"
                    : "Nenhum resultado"}
                </h2>
                <p className="mt-1 text-slate-500">
                  {bills?.length === 0
                    ? "O histórico de contas fechadas das mesas aparecerá aqui."
                    : "Tente ajustar os filtros para encontrar o que procura."}
                </p>
              </SubContainer>
            </div>
          ) : (
            <motion.div className="space-y-3" layout>
              <AnimatePresence>
                {filteredBills.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
                    onClick={() => router.push(`/dashboard/billing/${bill.id}`)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </SectionContainer>
    </SubscriptionGuard>
  );
}
