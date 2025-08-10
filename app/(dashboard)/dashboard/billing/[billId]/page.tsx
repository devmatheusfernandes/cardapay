// app/dashboard/billing/[billId]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderItem } from '@/lib/hooks/useOrders';
import { LoaderCircle, CheckCircle, Users, User, ChevronLeft, Divide, List, UserCheck } from 'lucide-react';

// This is the new, interactive payment terminal component
const PaymentTerminal = ({ bill }: { bill: Order }) => {
    // State to manage the current view (total, separated, or split)
    const [view, setView] = useState<'together' | 'separated' | 'split'>(bill.paymentMethod || 'together');
    const [splitBy, setSplitBy] = useState(2);

    // This calculation groups all items by the person (seat) who ordered them.
    const seatsData = useMemo(() => {
        const seatsMap: Record<number, { items: OrderItem[], total: number }> = {};
        bill.items.forEach(item => {
            const seatId = item.seat || 0;
            if (!seatsMap[seatId]) seatsMap[seatId] = { items: [], total: 0 };
            seatsMap[seatId].items.push(item);
            seatsMap[seatId].total += item.price * item.quantity;
        });
        return Object.entries(seatsMap).map(([seatId, data]) => ({ seatId: parseInt(seatId, 10), ...data }));
    }, [bill]);

    const renderContent = () => {
        switch (view) {
            // Case 1: Show the bill separated by person
            case 'separated':
                return (
                    <div className="space-y-4">
                        {seatsData.map(({ seatId, items, total }) => (
                            <div key={seatId} className="p-4 rounded-lg border bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2"><UserCheck className="w-5 h-5 text-indigo-600"/> Conta - Pessoa {seatId}</h3>
                                <div className="space-y-2 border-t pt-3 mt-2">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm"><span className="text-slate-600">{item.quantity}x {item.name}</span><span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span></div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 border-t flex justify-between items-center"><span className="font-bold">Subtotal</span><span className="text-xl font-bold text-indigo-600">${total.toFixed(2)}</span></div>
                            </div>
                        ))}
                    </div>
                );
            // Case 2: Allow splitting the total amount evenly
            case 'split':
                 return (
                    <div className="space-y-4 text-center p-4">
                        <div>
                            <label htmlFor="split-by" className="block text-sm font-medium text-gray-700">Dividir o valor total por:</label>
                            <input
                                type="number"
                                id="split-by"
                                value={splitBy}
                                onChange={(e) => setSplitBy(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-2 text-center text-lg font-semibold w-24 mx-auto block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg">
                            <p className="text-sm text-indigo-800">Valor por pessoa</p>
                            <p className="text-4xl font-bold text-indigo-600">${(bill.totalAmount / splitBy).toFixed(2)}</p>
                        </div>
                    </div>
                );
            // Default Case: Show the single, total bill
            case 'together':
            default:
                return (
                    <div>
                        <div className="space-y-2 border-t border-b py-4">
                            {bill.items.map((item, index) => (
                                <div key={index} className="flex justify-between"><span className="text-slate-600">{item.quantity}x {item.name} (P{item.seat})</span><span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span></div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            {/* View Toggle Buttons */}
            <div className="flex justify-center gap-2 bg-slate-100 p-1 rounded-lg mb-6">
                <button onClick={() => setView('together')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${view === 'together' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}><List className="w-5 h-5"/> Conta Total</button>
                <button onClick={() => setView('separated')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${view === 'separated' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}><User className="w-5 h-5"/> Por Pessoa</button>
                <button onClick={() => setView('split')} className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${view === 'split' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}><Divide className="w-5 h-5"/> Dividir Valor</button>
            </div>

            {/* Render the selected view */}
            {renderContent()}

            {/* Always show the final total */}
            <div className="mt-6 pt-6 border-t-2 border-dashed flex justify-between items-center">
                <span className="text-xl font-bold">Total da Mesa</span>
                <span className="text-3xl font-bold text-slate-800">${bill.totalAmount.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default function BillingPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.billId as string;
  const [bill, setBill] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (billId) {
      const fetchBill = async () => {
        setIsLoading(true);
        const docRef = doc(db, 'bills', billId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBill(docSnap.data() as Order);
        }
        setIsLoading(false);
      };
      fetchBill();
    } else {
      setIsLoading(false);
    }
  }, [billId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50"><LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" /></div>;
  }

  if (!bill) {
    return <div className="text-center p-8 bg-slate-50 min-h-screen">Conta não encontrada.</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <button onClick={() => router.push('/dashboard/billing')} className="absolute top-4 left-4 flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold">
            <ChevronLeft />
            Voltar para Histórico
        </button>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-800">Recebimento</h1>
          <p className="text-slate-500 text-lg">Mesa {bill.tableId}</p>
        </div>

        <PaymentTerminal bill={bill} />
      </div>
    </div>
  );
}