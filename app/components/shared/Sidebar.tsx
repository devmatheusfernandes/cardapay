'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Utensils, User, ShoppingCart, BarChart, LogOut, Bike, CoinsIcon } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard/menu', icon: Utensils, label: 'Menu' },
  { href: '/dashboard/profile', icon: User, label: 'Perfil' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos' },
  { href: '/dashboard/entregadores', icon: Bike, label: 'Entregadores' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Estatísticas' },
  { href: '/dashboard/subscription', icon: CoinsIcon, label: 'Assinatura' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/sign-in');
      toast.success('Você saiu com sucesso!');
    } catch (error) {
      console.error('Erro ao sair:', error);
      toast.error('Não foi possível sair. Tente novamente.');
    }
  };

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <motion.aside 
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-gray-100 flex-col h-screen sticky top-0"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <Link href="/dashboard/menu" className="text-2xl font-bold text-rose-600">
            Cardapay
          </Link>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item, i) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <motion.li 
                  key={item.href}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-rose-50 text-rose-600 font-medium shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <motion.button
            onClick={handleSignOut}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </motion.button>
        </div>
      </motion.aside>
    );
  }

  // Mobile Bottom Menu
  return (
    <motion.div
      initial={{ y: 20 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg md:hidden z-50"
    >
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="flex-1 flex flex-col items-center"
            >
              <Link
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-full ${
                  isActive ? 'text-rose-600' : 'text-gray-500'
                }`}
              >
                <div className={`p-2 rounded-full ${isActive ? 'bg-rose-50' : ''}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
        
        {/* More Items Dropdown */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex-1 flex flex-col items-center"
        >
          <div className="relative group">
            <button className="flex flex-col items-center p-2 rounded-full text-gray-500">
              <div className="p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
              <span className="text-xs mt-1">Mais</span>
            </button>
            
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
              {navItems.slice(4).map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 ${
                      isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center px-4 py-3 text-gray-600 hover:bg-gray-50 border-t border-gray-100"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;