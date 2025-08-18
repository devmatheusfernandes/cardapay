import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LogIn,
  UserPlus,
  PackageSearch,
  ChevronRight,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export default function MobileMenu({
  isMenuOpen,
  setIsMenuOpen,
}: MobileMenuProps) {
  const navItems = [
    { text: "Sobre Nós", href: "#about" },
    { text: "Recursos", href: "#features" },
    { text: "Preços", href: "#pricing" },
    { text: "FAQ", href: "#faq" },
    { text: "Contato", href: "#contact" },
  ];

  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24,
      },
    },
    exit: {
      x: 50,
      opacity: 0,
      transition: {
        duration: 0.1,
      },
    },
  };

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          {/* OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-sm z-50"
          />

          {/* SIDEBAR */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
              opacity: { duration: 0.3 },
            }}
            className="fixed top-0 right-0 w-80 h-full bg-gradient-to-br from-slate-400/95 via-slate-400/90 to-slate-400/95 
                     shadow-2xl z-[99] backdrop-blur-xl border-l border-white/20
                     flex flex-col overflow-hidden"
          >
            {/* Header with Close Button */}
            <div className="relative p-6 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <Utensils className="w-8 h-8 text-emerald-600" />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>
            </div>

            {/* Navigation */}
            <motion.nav
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex-1 p-6 space-y-2"
            >
              {navItems.map((item, index) => (
                <motion.a
                  key={item.text}
                  variants={itemVariants}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  whileHover={{ x: 8 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center justify-between p-4 rounded-xl 
                           hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100/50 
                           transition-all duration-200 cursor-pointer"
                >
                  <span className="text-gray-800 font-medium text-lg group-hover:text-emerald-700 transition-colors">
                    {item.text}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" />
                </motion.a>
              ))}
            </motion.nav>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="p-6 space-y-3 border-t border-gray-100/50 bg-gradient-to-t from-gray-50/30 to-transparent"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/sign-in");
                }}
                className="w-full px-6 py-3.5 rounded-xl bg-white/80 text-gray-700 font-semibold 
                         hover:bg-white hover:shadow-lg border border-gray-200/50
                         flex items-center justify-center gap-3 transition-all duration-200
                         backdrop-blur-sm"
              >
                <LogIn className="w-5 h-5" />
                <span>Entrar</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/sign-up");
                }}
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 
                         text-white font-semibold hover:from-emerald-700 hover:to-emerald-800 
                         flex items-center justify-center gap-3 transition-all duration-200
                         shadow-lg hover:shadow-xl shadow-emerald-600/25"
              >
                <UserPlus className="w-5 h-5" />
                <span>Criar Conta</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/track");
                }}
                className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 
                         text-white font-semibold hover:from-indigo-700 hover:to-indigo-800 
                         flex items-center justify-center gap-3 transition-all duration-200
                         shadow-lg hover:shadow-xl shadow-indigo-600/25"
              >
                <PackageSearch className="w-5 h-5" />
                <span>Acompanhar Pedido</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
