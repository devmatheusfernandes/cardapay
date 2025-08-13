"use client";

import { useRouter } from "next/navigation";
import { useBills, Bill } from "@/lib/hooks/useBills";
import { FileText, ChevronRight, CreditCard } from "lucide-react";
import TimeAgo from "react-timeago";
import ptBrStrings from "react-timeago/lib/language-strings/pt-br";
import buildFormatter from "react-timeago/lib/formatters/buildFormatter";
import { motion } from "framer-motion";

// Componentes do Design System
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import Loading from "@/app/components/shared/Loading";

const formatter = buildFormatter(ptBrStrings);

// Componente para um item da lista de contas
const BillItem = ({ bill, onClick }: { bill: Bill; onClick: () => void }) => {
  const isPaid = bill.status === "Completed";
  const itemColor = isPaid ? "green" : "emerald";

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 4px 10px -1px rgb(0 0 0 / 0.1)" }}
      className="cursor-pointer"
    >
      <SubContainer className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-${itemColor}-100`}>
            <FileText className={`w-5 h-5 text-${itemColor}-600`} />
          </div>
          <div>
            <p className="font-bold text-slate-800">Mesa {bill.tableId}</p>
            <p className="text-sm text-slate-500">
              Fechada{" "}
              <TimeAgo date={bill.createdAt.toDate()} formatter={formatter} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-bold text-lg text-${itemColor}-600`}>
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

  if (isLoading) {
    return <Loading fullScreen text="Carregando histórico de contas..." />;
  }

  return (
    <SubscriptionGuard>
      <SectionContainer>
        <PageHeader
          title="Histórico de Contas"
          subtitle="Visualize os detalhes de todas as contas pagas."
        />

        <main className="mt-8">
          {bills.length === 0 ? (
            <div className="flex items-center justify-center pt-16">
              <SubContainer className="text-center p-10 max-w-md">
                <CreditCard className="mx-auto h-16 w-16 text-slate-400" />
                <h2 className="mt-4 text-2xl font-semibold text-slate-700">
                  Nenhuma conta encontrada
                </h2>
                <p className="mt-1 text-slate-500">
                  O histórico de contas fechadas das mesas aparecerá aqui.
                </p>
              </SubContainer>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <BillItem
                  key={bill.id}
                  bill={bill}
                  onClick={() => router.push(`/dashboard/billing/${bill.id}`)}
                />
              ))}
            </div>
          )}
        </main>
      </SectionContainer>
    </SubscriptionGuard>
  );
}
