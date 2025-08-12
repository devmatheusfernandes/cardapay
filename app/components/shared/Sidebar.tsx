"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  CoinsIcon,
  Utensils,
  ShoppingCart,
  ChefHat,
  Globe,
  Home,
  CreditCard,
  Bike,
  BarChart,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const navItems = [
  // Perfil Section
  {
    href: "/dashboard",
    icon: User,
    label: "Perfil",
    isMainItem: true,
  },
  {
    href: "/dashboard/profile",
    icon: CoinsIcon,
    label: "Meu Negócio",
    isSubItem: true,
  },
  {
    href: "/dashboard/subscription",
    icon: CoinsIcon,
    label: "Meu Plano",
    isSubItem: true,
  },

  // Cardápio Section
  {
    href: "/dashboard/menu",
    icon: Utensils,
    label: "Cardápio",
    isMainItem: true,
  },

  // Pedidos Section
  {
    href: "/dashboard/orders",
    icon: ShoppingCart,
    label: "Pedidos",
    isMainItem: true,
  },
  {
    href: "/dashboard/kitchen",
    icon: ChefHat,
    label: "Cozinha",
    isSubItem: true,
  },
  {
    href: "/dashboard/orders",
    icon: Globe,
    label: "Site",
    isSubItem: true,
  },
  {
    href: "/dashboard/waiter",
    icon: Home,
    label: "Casa",
    isSubItem: true,
  },
  {
    href: "/dashboard/billing",
    icon: CreditCard,
    label: "Pagamento",
    isSubItem: true,
  },

  // Entregadores Section
  {
    href: "/dashboard/entregadores",
    icon: Bike,
    label: "Entregadores",
    isMainItem: true,
  },

  // Estatísticas Section
  {
    href: "/dashboard/analytics",
    icon: BarChart,
    label: "Estatísticas",
    isMainItem: true,
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/sign-in");
      toast.success("Você saiu com sucesso!");
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast.error("Não foi possível sair. Tente novamente.");
    }
  };

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <motion.aside
        initial={{ x: -20 }}
        animate={{
          x: 0,
          width: isCollapsed ? 80 : 280,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
        className={`hidden md:flex flex-shrink-0 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/60 flex-col h-screen sticky top-0 shadow-sm ${
          isCollapsed ? "w-20" : "w-70"
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/dashboard/menu"
                  className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Cardapay
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item, i) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <motion.li
                  key={`${item.href}-${i}`}
                  whileHover={{ scale: isCollapsed ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={item.isSubItem && !isCollapsed ? "ml-4" : ""}
                >
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-purple-600 text-white shadow-lg shadow-emerald-500/25"
                        : item.isMainItem
                        ? "text-slate-700 hover:bg-slate-100 hover:shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-600"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  >
                    <div
                      className={`flex-shrink-0 ${
                        isActive ? "text-white" : ""
                      }`}
                    >
                      <item.icon
                        className={`${
                          isCollapsed ? "w-6 h-6" : "w-5 h-5"
                        } transition-all`}
                      />
                    </div>

                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`font-medium ${
                            item.isMainItem ? "text-sm" : "text-sm"
                          }`}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-purple-600 -z-10"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                        <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-l-0 border-r-4 border-r-slate-800 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                      </div>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <motion.button
            onClick={handleSignOut}
            whileHover={{ scale: isCollapsed ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group flex w-full items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut
              className={`${
                isCollapsed ? "w-6 h-6" : "w-5 h-5"
              } transition-all`}
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium text-sm"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Sair
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-l-0 border-r-4 border-r-slate-800 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
              </div>
            )}
          </motion.button>
        </div>
      </motion.aside>
    );
  }

  // Mobile Bottom Navigation
  return (
    <motion.div
      initial={{ y: 20 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-lg md:hidden z-50"
    >
      <div className="flex justify-around items-center px-2 py-2">
        {/* Main mobile items */}
        {[
          { href: "/dashboard/profile", icon: User, label: "Perfil" },
          { href: "/dashboard/menu", icon: Utensils, label: "Menu" },
          { href: "/dashboard/orders", icon: ShoppingCart, label: "Pedidos" },
          { href: "/dashboard/analytics", icon: BarChart, label: "Stats" },
        ].map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex flex-col items-center"
            >
              <Link
                href={item.href}
                className="flex flex-col items-center p-2 rounded-2xl transition-all"
              >
                <div
                  className={`p-3 rounded-2xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-purple-600 text-white shadow-lg shadow-emerald-500/25"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs mt-1 font-medium transition-colors ${
                    isActive ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </motion.div>
          );
        })}

        {/* More menu for mobile */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 flex flex-col items-center"
        >
          <div className="relative group">
            <button className="flex flex-col items-center p-2 rounded-2xl text-slate-500">
              <div className="p-3 rounded-2xl hover:bg-slate-100 transition-all">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1 font-medium">Mais</span>
            </button>

            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 hidden group-hover:block w-56 bg-white rounded-2xl shadow-xl border border-slate-200/60 z-50 backdrop-blur-md">
              <div className="p-2">
                {navItems
                  .filter(
                    (item) =>
                      ![
                        "/dashboard/profile",
                        "/dashboard/menu",
                        "/dashboard/orders",
                        "/dashboard/analytics",
                      ].includes(item.href)
                  )
                  .map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-xl mb-1 transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-500 to-purple-600 text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        } ${item.isSubItem ? "ml-4 text-sm" : ""}`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                <hr className="my-2 border-slate-200" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
