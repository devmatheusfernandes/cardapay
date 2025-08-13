"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderItem } from "@/lib/hooks/useOrders";
import { useTablePaymentStatus } from "@/lib/hooks/useTablePaymentStatus";
import {
  CheckCircle,
  History,
  User,
  Divide,
  List,
  UserCheck,
  FileWarning,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// Componentes do Design System
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import ActionButton from "@/app/components/shared/ActionButton";
import Loading from "@/app/components/shared/Loading";
import BackButton from "@/app/components/shared/BackButton";

// --- Componentes Locais ---

// --- Componentes Locais ---

const PaymentTerminal = ({ bill }: { bill: Order }) => {
  const [view, setView] = useState<"together" | "separated" | "split">(
    bill.paymentMethod || "together"
  );
  const [splitBy, setSplitBy] = useState(2);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const { confirmAndUpdateBill } = useTablePaymentStatus();
  const router = useRouter();
  const params = useParams();
  const billId = params.billId as string;

  // NOVO: Criar um mapa de ID da pessoa para o nome para fácil acesso.
  const seatNameMap = useMemo(() => {
    const nameMap = new Map<number, string | null>();
    if (bill.seatsInvolved) {
      for (const seat of bill.seatsInvolved) {
        nameMap.set(seat.id, seat.name);
      }
    }
    return nameMap;
  }, [bill.seatsInvolved]);

  // Em seu componente PaymentTerminal
  const seatsData = useMemo(() => {
    // 1. A inicialização da lista de pessoas a partir de 'seatsInvolved' está CORRETA e permanece igual.
    const allPeople = (bill.seatsInvolved || []).map((seat) => ({
      seatId: seat.id,
      name: seat.name,
      items: [] as OrderItem[],
      total: 0,
    }));

    // Cria um mapa para acesso rápido e eficiente.
    const peopleMap = new Map(allPeople.map((p) => [p.seatId, p]));

    // 2. ALTERADO: Agora vamos ler do local correto: 'bill.seats'.
    // Itera sobre cada 'seat' que contém os itens no documento do Firebase.
    (bill.seats || []).forEach((seatWithItems: { id: number; items: any }) => {
      // Encontra a pessoa correspondente no nosso mapa.
      const person = peopleMap.get(seatWithItems.id);

      if (person) {
        // Itera sobre os itens DENTRO do 'seat' atual.
        (seatWithItems.items || []).forEach((item: OrderItem) => {
          person.items.push(item);
          person.total += item.price * item.quantity;
        });
      }
    });

    // 3. Retorna a lista completa de pessoas com seus itens e totais devidamente preenchidos.
    return allPeople;
  }, [bill.seats, bill.seatsInvolved]);

  // NOVO: Criar uma lista plana de todos os itens para a "Conta Total"
  const allItemsFlat = useMemo(() => {
    return (bill.seats || []).flatMap((seat: { items: any; id: any }) =>
      // Adiciona o ID da pessoa a cada item para podermos identificar quem pediu
      (seat.items || []).map((item: any) => ({
        ...item,
        seatId: seat.id,
      }))
    );
  }, [bill.seats]);

  const handleFinalizePayment = async () => {
    if (bill.tableId && billId) {
      setIsFinalizing(true);
      const success = await confirmAndUpdateBill(billId, bill.tableId);
      if (success) {
        toast.success(`Mesa ${bill.tableId} liberada com sucesso!`);
        router.push("/dashboard/waiter");
      }
      setIsFinalizing(false);
    } else {
      toast.error("ID da mesa ou da conta não encontrado.");
    }
  };

  const renderContent = () => {
    switch (view) {
      case "separated":
        return (
          <div className="space-y-4">
            {/* ALTERADO: Usar o nome da pessoa no título do card */}
            {seatsData.map(({ seatId, items, total, name }) => (
              <SubContainer key={seatId} variant="gray" className="p-4">
                <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" /> Conta -{" "}
                  {name || `Pessoa ${seatId}`}
                </h3>
                <div className="space-y-2 border-t pt-3 mt-2">
                  {(items || []).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-semibold">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="font-bold">Subtotal</span>
                  <span className="text-xl font-bold text-emerald-600">
                    R$ {total.toFixed(2)}
                  </span>
                </div>
              </SubContainer>
            ))}
          </div>
        );
      case "split":
        return (
          <div className="space-y-4 text-center p-4">
            <label
              htmlFor="split-by"
              className="block text-sm font-medium text-gray-700"
            >
              Dividir o valor total por:
            </label>
            <input
              type="number"
              id="split-by"
              value={splitBy}
              onChange={(e) =>
                setSplitBy(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="mt-2 text-center text-lg font-semibold w-24 mx-auto block rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <SubContainer variant="default" className="p-4">
              <p className="text-sm text-emerald-800">Valor por pessoa</p>
              <p className="text-4xl font-bold text-emerald-600">
                R$ {(bill.totalAmount / splitBy).toFixed(2)}
              </p>
            </SubContainer>
          </div>
        );
      // DENTRO DO SEU COMPONENTE PaymentTerminal

      // ...
      case "together":
      default:
        return (
          <div className="space-y-2 border-t border-b py-4">
            {allItemsFlat.map((item: any, index: number) => {
              const personName = seatNameMap.get(item.seatId);
              const displayName = personName || `Pessoa ${item.seatId}`;
              return (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex justify-between"
                >
                  <span className="text-slate-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-semibold">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <SubContainer className="p-6 sm:p-8">
      {/* Seletor de visualização */}
      <div className="flex justify-center gap-1 bg-slate-100 p-1 rounded-lg mb-6 shadow-sm">
        <ActionButton
          label="Conta Total"
          icon={<List className="w-4 h-4" />}
          onClick={() => setView("together")}
          className={
            view !== "together"
              ? "bg-transparent shadow-none text-slate-500"
              : ""
          }
          variant="secondary"
        />
        <ActionButton
          label="Por Pessoa"
          icon={<User className="w-4 h-4" />}
          onClick={() => setView("separated")}
          className={
            view !== "separated"
              ? "bg-transparent shadow-none text-slate-500"
              : ""
          }
          variant="secondary"
        />
        <ActionButton
          label="Dividir Valor"
          icon={<Divide className="w-4 h-4" />}
          onClick={() => setView("split")}
          className={
            view !== "split" ? "bg-transparent shadow-none text-slate-500" : ""
          }
          variant="secondary"
        />
      </div>

      {renderContent()}

      {/* Total da Mesa */}
      <div className="mt-6 pt-6 border-t-2 border-dashed flex justify-between items-center">
        <span className="text-xl font-bold">Total da Mesa</span>
        <span className="text-3xl font-bold text-slate-800">
          R$ {bill.totalAmount.toFixed(2)}
        </span>
      </div>

      {/* Botão de Ação */}
      <div className="mt-8">
        {bill.status !== "Completed" ? (
          <ActionButton
            label="Finalizar e Liberar Mesa"
            icon={<CheckCircle className="w-6 h-6" />}
            onClick={handleFinalizePayment}
            variant="success"
            size="lg"
            fullWidth
            isLoading={isFinalizing}
            disabled={isFinalizing}
          />
        ) : (
          <div className="text-center p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
            <p className="font-semibold text-green-800">
              Esta conta já foi paga e finalizada.
            </p>
          </div>
        )}
      </div>
    </SubContainer>
  );
};

// --- Componente Principal da Página ---

export default function BillingPage() {
  const params = useParams();
  const billId = params.billId as string;
  const [bill, setBill] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (billId) {
      const fetchBill = async () => {
        setIsLoading(true);
        const docRef = doc(db, "bills", billId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBill({ id: docSnap.id, ...docSnap.data() } as Order);
        }
        setIsLoading(false);
      };
      fetchBill();
    } else {
      setIsLoading(false);
    }
  }, [billId]);

  if (isLoading) {
    return <Loading fullScreen text="Carregando detalhes da conta..." />;
  }

  if (!bill) {
    return (
      <SectionContainer className="flex items-center justify-center">
        <SubContainer variant="gray" className="text-center p-10">
          <FileWarning className="mx-auto h-16 w-16 text-slate-400" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-700">
            Conta não encontrada
          </h2>
          <p className="mt-1 text-slate-500">
            Não foi possível carregar os detalhes. Verifique o ID ou volte para
            o histórico.
          </p>
          <div className="mt-6">
            <BackButton pathLink="/dashboard/billing" />
          </div>
        </SubContainer>
      </SectionContainer>
    );
  }

  const goBack = () => {
    router.push("/dashboard/billing");
  };

  return (
    <SectionContainer>
      <div className="w-full mx-auto">
        <PageHeader
          title={`Recebimento - Mesa ${bill.tableId}`}
          subtitle="Confira os itens e finalize o pagamento para liberar a mesa."
          actionButton={{
            label: "Ver histórico",
            onClick: goBack,
            icon: <History className="w-4 h-4" />,
            activeIcon: <X className="w-4 h-4" />,
            variant: "primary",
          }}
        />
        <main className="mt-8">
          <PaymentTerminal bill={bill} />
        </main>
      </div>
    </SectionContainer>
  );
}
