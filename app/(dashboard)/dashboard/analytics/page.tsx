"use client";

import { useAnalytics, TimePeriod } from "@/lib/hooks/useAnalytics";
import {
  DollarSign,
  ShoppingCart,
  BarChart as BarChartIcon,
  TrendingUp,
  Truck,
  Store,
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Componentes do Design System
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import Loading from "@/app/components/shared/Loading";

// --- Componentes Locais Refatorados ---

const StatCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) => (
  <SubContainer className="p-6 flex items-center gap-4">
    <div className="bg-emerald-100 p-3 rounded-full">
      <Icon className="w-6 h-6 text-emerald-600" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </SubContainer>
);

const TimePeriodFilter = ({
  activePeriod,
  setPeriod,
}: {
  activePeriod: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
}) => {
  const periods: { label: string; value: TimePeriod }[] = [
    { label: "Hoje", value: "today" },
    { label: "7 Dias", value: "7d" },
    { label: "30 Dias", value: "30d" },
    { label: "Período Completo", value: "all" },
  ];
  return (
    <div className="flex items-center gap-1 bg-emerald-100 p-1 rounded-lg shadow-sm">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 ${
            activePeriod === p.value
              ? "bg-emerald-50 text-emerald-700"
              : "text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

// --- Componente Principal da Página ---

export default function AnalyticsPage() {
  const { analyticsData, isLoading, setPeriod, activePeriod } = useAnalytics();

  if (isLoading) {
    return <Loading fullScreen text="Processando dados..." />;
  }

  if (!analyticsData || analyticsData.totalOrders === 0) {
    return (
      <SectionContainer className="flex items-center justify-center">
        <SubContainer className="text-center p-10">
          <BarChartIcon className="mx-auto h-16 w-16 text-slate-400" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-700">
            Ainda não há dados de vendas
          </h2>
          <p className="mt-2 text-slate-500 max-w-sm">
            Suas análises de vendas aparecerão aqui assim que você receber seu
            primeiro pedido.
          </p>
        </SubContainer>
      </SectionContainer>
    );
  }

  const {
    totalRevenue,
    totalOrders,
    salesByDay,
    deliveryVsPickup,
    topSellingItems,
    deliveryOrders,
    pickupOrders,
  } = analyticsData;

  const COLORS = ["#3b82f6", "#8b5cf6"]; // Azul para Entrega, Roxo para Retirada

  return (
    <SectionContainer>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <PageHeader
          title="Análises de Vendas"
          subtitle="Acompanhe o desempenho e as métricas da sua loja."
        />
        <TimePeriodFilter activePeriod={activePeriod} setPeriod={setPeriod} />
      </div>

      <main className="mt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            title="Receita Total"
            value={`R$ ${totalRevenue.toFixed(2).replace(".", ",")}`}
          />
          <StatCard
            icon={ShoppingCart}
            title="Pedidos Totais"
            value={totalOrders.toString()}
          />
          <StatCard
            icon={Truck}
            title="Pedidos p/ Entrega"
            value={deliveryOrders.toString()}
          />
          <StatCard
            icon={Store}
            title="Pedidos p/ Retirada"
            value={pickupOrders.toString()}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SubContainer className="p-4 sm:p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Vendas por Dia
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tick={{ fill: "#64748b" }}
                  />
                  <YAxis
                    fontSize={12}
                    tickFormatter={(value) => `R$${value}`}
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toFixed(2)}`,
                      "Vendas",
                    ]}
                    cursor={{ fill: "rgba(240, 249, 255, 0.5)" }}
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </SubContainer>

          <SubContainer className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Entrega vs. Retirada
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deliveryVsPickup}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={({ percent }) =>
                      `${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {deliveryVsPickup.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} pedidos`]}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SubContainer>
        </div>

        <SubContainer className="p-4 sm:p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Itens Mais Vendidos
          </h3>
          <ul className="space-y-4">
            {topSellingItems.map((item, index) => (
              <li key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-400 text-lg w-6 text-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-700">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold text-emerald-600">
                  {item.quantity} vendidos
                </span>
              </li>
            ))}
          </ul>
        </SubContainer>
      </main>
    </SectionContainer>
  );
}
