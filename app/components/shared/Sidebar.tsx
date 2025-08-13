"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  Utensils,
  ShoppingCart,
  ChefHat,
  Bike,
  BarChart,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Store,
  Gem,
  Laptop,
  ClipboardList,
  CreditCard,
  X,
  ChevronDown,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Estrutura de dados aprimorada para agrupar itens
type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
};

type NavSection = {
  title: string;
  icon: React.ElementType;
  mainHref: string;
  subItems?: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Perfil",
    icon: User,
    mainHref: "/dashboard",
    subItems: [
      { href: "/dashboard/profile", icon: Store, label: "Meu Negócio" },
      { href: "/dashboard/subscription", icon: Gem, label: "Meu Plano" },
    ],
  },
  {
    title: "Cardápio",
    icon: Utensils,
    mainHref: "/dashboard/menu",
  },
  {
    title: "Pedidos",
    icon: ShoppingCart,
    mainHref: "/dashboard/pedidos",
    subItems: [
      { href: "/dashboard/kitchen", icon: ChefHat, label: "Cozinha" },
      { href: "/dashboard/orders", icon: Laptop, label: "Do site" },
      {
        href: "/dashboard/waiter",
        icon: ClipboardList,
        label: "Do garçom",
      },
      { href: "/dashboard/billing", icon: CreditCard, label: "Pagamentos" },
    ],
  },
  {
    title: "Entregadores",
    icon: Bike,
    mainHref: "/dashboard/entregadores",
  },
  {
    title: "Estatísticas",
    icon: BarChart,
    mainHref: "/dashboard/analytics",
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const NavLink = ({
    item,
    isSubItem = false,
  }: {
    item: NavItem | NavSection;
    isSubItem?: boolean;
  }) => {
    const label = "label" in item ? item.label : item.title;
    const href = "href" in item ? item.href : item.mainHref;
    const isActive =
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

    return (
      <Link
        href={href}
        className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
          isActive
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
            : isSubItem
            ? "text-slate-500 hover:bg-emerald-100 hover:text-slate-700"
            : "text-slate-700 hover:bg-emerald-100"
        } ${isCollapsed ? "justify-center" : ""}`}
      >
        <item.icon className={isCollapsed ? "w-6 h-6" : "w-5 h-5"} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-medium text-sm"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="hidden md:flex flex-shrink-0 bg-emerald-50 border-r border-slate-200/80 flex-col h-screen sticky top-0"
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-200/80">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/dashboard/menu"
                  className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                >
                  Cardapay
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>

        <nav className="flex-grow p-3 overflow-y-auto">
          <ul className="space-y-1">
            {navSections.map((section) => (
              <li key={section.title}>
                <NavLink item={section} />
                {!isCollapsed && section.subItems && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200/80 pl-4"
                  >
                    {section.subItems.map((subItem) => (
                      <li key={subItem.href}>
                        <NavLink item={subItem} isSubItem />
                      </li>
                    ))}
                  </motion.ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-slate-200/80">
          <button
            onClick={handleSignOut}
            className={`group flex w-full items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className={isCollapsed ? "w-6 h-6" : "w-5 h-5"} />
            {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 z-50">
                Sair
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-emerald-50 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden z-40">
        <div className="flex justify-around items-center h-20">
          {[
            { href: "/dashboard", icon: User, label: "Perfil" },
            { href: "/dashboard/menu", icon: Utensils, label: "Cardápio" },
            { href: "/dashboard/orders", icon: ShoppingCart, label: "Pedidos" },
          ].map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-2 rounded-lg"
              >
                <item.icon
                  className={`w-6 h-6 mb-1 transition-colors ${
                    isActive ? "text-emerald-600" : "text-slate-500"
                  }`}
                />
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isActive ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center p-2 rounded-lg"
          >
            <Menu className="w-6 h-6 mb-1 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500">Mais</span>
          </button>
        </div>
      </div>

      {/* --- MOBILE MENU DRAWER --- */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        handleSignOut={handleSignOut}
      />
    </>
  );
};

const MobileMenuDrawer = ({
  isOpen,
  onClose,
  handleSignOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  handleSignOut: () => void;
}) => {
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const activeSection = navSections.find((section) =>
      section.subItems?.some((sub) => pathname.startsWith(sub.href))
    );
    if (activeSection) {
      setOpenSection(activeSection.title);
    }
  }, [isOpen, pathname]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-50 rounded-t-2xl p-4 z-50 md:hidden max-h-[80vh] flex flex-col"
          >
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Menu</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-200"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <nav className="flex-grow overflow-y-auto">
              <ul className="space-y-2">
                {navSections.map((section) => (
                  <li key={section.title}>
                    <div
                      onClick={() =>
                        section.subItems &&
                        setOpenSection(
                          openSection === section.title ? null : section.title
                        )
                      }
                      className="flex items-center justify-between p-4 rounded-xl bg-white hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Link
                        href={section.mainHref}
                        className="flex items-center gap-4"
                        onClick={(e) => section.subItems && e.preventDefault()}
                      >
                        <section.icon className="w-6 h-6 text-emerald-600" />
                        <span className="font-semibold text-slate-700">
                          {section.title}
                        </span>
                      </Link>
                      {section.subItems && (
                        <ChevronDown
                          className={`w-5 h-5 text-slate-500 transition-transform ${
                            openSection === section.title ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {openSection === section.title && section.subItems && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-8 pr-2 py-2 space-y-1 overflow-hidden"
                        >
                          {section.subItems.map((subItem) => {
                            const isActive = pathname.startsWith(subItem.href);
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    isActive
                                      ? "bg-emerald-100 text-emerald-700 font-semibold"
                                      : "text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  <subItem.icon className="w-5 h-5" />
                                  {subItem.label}
                                </Link>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
                <li>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center p-4 rounded-xl text-red-600 hover:bg-red-50 transition-colors mt-4"
                  >
                    <LogOut className="w-6 h-6 mr-4" />
                    <span className="font-semibold">Sair</span>
                  </button>
                </li>
              </ul>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
