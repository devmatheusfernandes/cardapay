// app/dashboard/orders/page.tsx

"use client";

import Link from "next/link";
import { SectionContainer } from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import {
  ChefHat,
  Laptop,
  ClipboardList,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import React from "react";

// Definição dos tipos para os cards
interface OrderCardProps {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

// Dados para os cards de gerenciamento de pedidos
// OBS: A rota para "Pedidos do Site" foi ajustada para /dashboard/orders/online para evitar que a página aponte para si mesma.
const orderRoutes: OrderCardProps[] = [
  {
    href: "/dashboard/kitchen",
    icon: ChefHat,
    label: "Pedidos na Cozinha",
    description: "Acompanhe o status dos itens em preparo.",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    href: "/dashboard/orders",
    icon: Laptop,
    label: "Pedidos do Site",
    description: "Veja os pedidos recebidos pelo seu site.",
    bgColor: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    href: "/dashboard/waiter",
    icon: ClipboardList,
    label: "Pedidos do Garçom",
    description: "Gerencie os pedidos feitos presencialmente.",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    href: "/dashboard/billing",
    icon: CreditCard,
    label: "Contas e Pagamentos",
    description: "Visualize e feche as contas dos clientes.",
    bgColor: "bg-rose-50",
    iconColor: "text-rose-600",
  },
];

// Componente do Card
const OrderCard: React.FC<{ card: OrderCardProps }> = ({ card }) => (
  <Link href={card.href} passHref>
    <motion.div
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      }}
      whileTap={{ scale: 0.98 }}
      className="bg-emerald-50 rounded-2xl p-6 h-full flex flex-col cursor-pointer border border-emerald-200/80 transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgColor}`}
        >
          <card.icon className={`w-6 h-6 ${card.iconColor}`} />
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>
      <div className="mt-4 flex-grow">
        <h2 className="text-lg font-bold text-slate-800">{card.label}</h2>
        <p className="text-sm text-slate-500 mt-1">{card.description}</p>
      </div>
    </motion.div>
  </Link>
);

// Página principal de Pedidos
export default function OrdersPage() {
  return (
    <SectionContainer>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Gerenciamento de Pedidos"
          subtitle="Selecione uma área para visualizar e gerenciar os pedidos do seu negócio."
          className="mb-10"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {orderRoutes.map((card) => (
            <OrderCard key={card.href} card={card} />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
