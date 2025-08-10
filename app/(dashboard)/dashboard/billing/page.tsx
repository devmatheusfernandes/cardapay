// app/dashboard/billing/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useBills, Bill } from '@/lib/hooks/useBills';
import { LoaderCircle, FileText, ChevronRight, CreditCard } from 'lucide-react';
import TimeAgo from 'react-timeago';
import { motion } from 'framer-motion';
import SubscriptionGuard from '@/app/components/guards/SubscriptionGuard';

export default function BillingHistoryPage() {
  const router = useRouter();
  const { bills, isLoading } = useBills();

  const handleBillClick = (billId: string) => {
    router.push(`/dashboard/billing/${billId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <FileText className="w-8 h-8 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-800">Histórico de Contas</h1>
        </div>

        {bills.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <CreditCard className="mx-auto h-20 w-20 text-slate-300" />
              <h2 className="mt-4 text-2xl font-semibold text-slate-700">Nenhuma conta encontrada</h2>
              <p className="mt-1 text-slate-500">As contas fechadas das mesas aparecerão aqui.</p>
            </div>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="space-y-3">
              {bills.map((bill) => (
                <motion.button
                  key={bill.id}
                  onClick={() => handleBillClick(bill.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  className="w-full flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-left"
                >
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-indigo-100 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600"/>
                     </div>
                     <div>
                        <p className="font-bold text-slate-800">Mesa {bill.tableId}</p>
                        <p className="text-sm text-slate-500">
                           Fechada <TimeAgo date={bill.createdAt.toDate()} />
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-indigo-600">${bill.totalAmount.toFixed(2)}</span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </SubscriptionGuard>
  );
}