'use client';

import SubscriptionGuard from '@/app/components/guards/SubscriptionGuard';
import { useAnalytics } from '../../../../lib/hooks/useAnalytics';
import { LoaderCircle, DollarSign, ShoppingCart, BarChart, TrendingUp } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { analyticsData, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="w-12 h-12 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!analyticsData || analyticsData.totalOrders === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <BarChart className="mx-auto h-20 w-20 text-slate-300" />
                <h2 className="mt-4 text-2xl font-semibold text-slate-700">No sales data yet</h2>
                <p className="mt-2 text-slate-500">Your sales analytics will appear here once you receive your first order.</p>
            </div>
        </div>
    );
  }

  const { totalRevenue, totalOrders, averageOrderValue, salesByDay, topSellingItems } = analyticsData;

  return (
    <SubscriptionGuard>
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Analytics</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={DollarSign} title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard icon={ShoppingCart} title="Total Orders" value={totalOrders.toString()} />
        <StatCard icon={BarChart} title="Avg. Order Value" value={`$${averageOrderValue.toFixed(2)}`} />
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Sales Overview</h2>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <RechartsBarChart data={salesByDay} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748b' }} />
                    <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                    <Bar dataKey="total" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Top Selling Items</h2>
        <ul className="space-y-4">
            {topSellingItems.map((item, index) => (
                <li key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-400 w-6 text-center">{index + 1}</span>
                        <span className="font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{item.quantity} sold</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
    </SubscriptionGuard>
  );
}

const StatCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
        <div className="bg-amber-100 p-3 rounded-full">
            <Icon className="w-6 h-6 text-amber-600" />
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);
