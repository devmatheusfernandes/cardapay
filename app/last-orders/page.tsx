"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle, Loader2 } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";

// Simples mock do status do pedido — no seu app você pode buscar no Firestore para obter status real
// Aqui só como exemplo
function getOrderStatus(orderId: string) {
  // Vai retornar um status aleatório para demonstração
  const statuses = [
    { label: "Pending", color: "text-indigo-600" },
    { label: "In Progress", color: "text-blue-600" },
    { label: "Completed", color: "text-green-600" },
    { label: "Canceled", color: "text-red-600" },
  ];
  // Escolhe status com base no hash simples do ID
  const index = orderId.charCodeAt(0) % statuses.length;
  return statuses[index];
}

export default function LastOrdersPage() {
  const [orders, setOrders] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lastOrders");
      if (stored) {
        setOrders(JSON.parse(stored));
      }
    } catch {}
  }, []);

  function copyToClipboard(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("ID copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <h1 className="text-2xl font-bold text-slate-700 mb-4">Últimos Pedidos</h1>
        <p className="text-slate-600">Nenhum pedido encontrado. Faça um pedido para que ele apareça aqui.</p>
        <Link href="/" className="mt-6 text-indigo-600 hover:underline">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Últimos Pedidos</h1>

        <ul className="w-full max-w-3xl space-y-4">
          {orders.map((id) => {
            const status = getOrderStatus(id);
            return (
              <li
                key={id}
                className="bg-white rounded-xl p-4 shadow flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/track/${id}`}
                    className="text-indigo-600 font-semibold hover:underline"
                    title="Ver detalhes do pedido"
                  >
                    Pedido: <span className="font-mono">{id}</span>
                  </Link>
                  <p className={`mt-1 font-medium ${status.color}`}>Status: {status.label}</p>
                </div>

                <button
                  onClick={() => copyToClipboard(id)}
                  className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
                  aria-label={`Copiar ID do pedido ${id}`}
                >
                  {copiedId === id ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  Copiar
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
