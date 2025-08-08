'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, User, ShoppingCart, BarChart } from 'lucide-react';

const navItems = [
  { href: '/dashboard/menu', icon: Utensils, label: 'Menu' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Analytics' },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-slate-200">
        <Link href="/dashboard/menu" className="text-2xl font-bold text-rose-600">
          Cardapay
        </Link>
      </div>
      <nav className="flex-grow p-4">
        <ul>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 my-1 rounded-lg text-slate-700 transition-colors ${
                    isActive
                      ? 'bg-rose-100 text-rose-600 font-semibold'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200">
          {/* You can add a user profile/logout button here later */}
          <p className="text-xs text-slate-400 text-center">© 2025 Cardapay</p>
      </div>
    </aside>
  );
};

export default Sidebar;
