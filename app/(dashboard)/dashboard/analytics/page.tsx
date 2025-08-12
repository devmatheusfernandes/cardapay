"use client";

import { useAnalytics, TimePeriod } from "../../../../lib/hooks/useAnalytics";
import {
  LoaderCircle,
  DollarSign,
  ShoppingCart,
  BarChart,
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

export default function AnalyticsPage() {
  const { analyticsData, isLoading, setPeriod, activePeriod } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!analyticsData || analyticsData.totalOrders === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BarChart className="mx-auto h-20 w-20 text-slate-300" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-700">
            Ainda não há dados de vendas
          </h2>
          <p className="mt-2 text-slate-500">
            Suas análises de vendas aparecerão aqui assim que você receber seu
            primeiro pedido.
          </p>
        </div>
      </div>
    );
  }

  const {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    salesByDay,
    topSellingItems,
    deliveryOrders,
    pickupOrders,
    deliveryVsPickup,
  } = analyticsData;
  const COLORS = ["#3b82f6", "#8b5cf6"]; // Azul para Entrega, Roxo para Retirada

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Análises</h1>
        <TimePeriodFilter activePeriod={activePeriod} setPeriod={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          title="Receita Total"
          value={`R$${totalRevenue.toFixed(2)}`}
        />
        <StatCard
          icon={ShoppingCart}
          title="Pedidos Totais"
          value={totalOrders.toString()}
        />
        <StatCard
          icon={Truck}
          title="Pedidos de Entrega"
          value={deliveryOrders.toString()}
        />
        <StatCard
          icon={Store}
          title="Pedidos de Retirada"
          value={pickupOrders.toString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Vendas */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Visão Geral das Vendas
          </h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <RechartsBarChart
                data={salesByDay}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b" }}
                  fontSize={12}
                />
                <YAxis
                  tickFormatter={(value) => `R$${value}`}
                  tick={{ fill: "#64748b" }}
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => [
                    `R$${value.toFixed(2)}`,
                    "Total",
                  ]}
                />
                <Bar dataKey="total" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Entrega vs. Retirada
          </h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={deliveryVsPickup}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {deliveryVsPickup.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Pedidos"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Itens Mais Vendidos */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Itens Mais Vendidos
        </h2>
        <ul className="space-y-4">
          {topSellingItems.map((item, index) => (
            <li key={item.name} className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-400 w-6 text-center">
                  {index + 1}
                </span>
                <span className="font-semibold text-slate-700">
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-slate-800">
                {item.quantity} vendidos
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const StatCard = ({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
    <div className="bg-emerald-100 p-3 rounded-full">
      <Icon className="w-6 h-6 text-emerald-600" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
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
    { label: "Todo o Período", value: "all" },
  ];
  return (
    <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-lg">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
            activePeriod === p.value
              ? "bg-white shadow-sm text-slate-800"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
