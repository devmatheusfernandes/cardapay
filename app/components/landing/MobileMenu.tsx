import { motion, AnimatePresence } from "framer-motion";
// Ícones
import { X, LogIn, UserPlus, PackageSearch } from "lucide-react";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export default function MobileMenu({
  isMenuOpen,
  setIsMenuOpen,
}: MobileMenuProps) {
  // CHANGE 1: Transformado em um array de objetos com texto e href
  const navItems = [
    { text: "Sobre Nós", href: "#about" },
    { text: "Recursos", href: "#features" },
    { text: "Preços", href: "#pricing" },
    { text: "FAQ", href: "#faq" },
    { text: "Contato", href: "#contact" },
  ];
  
  const router = useRouter();

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
            className="fixed inset-0 bg-black/30 z-50"
          />

          {/* SIDEBAR */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-64 h-full bg-white/30 shadow-lg z-[99] p-6 backdrop-blur-md rounded-tl-xl rounded-bl-xl flex flex-col"
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-6 h-6 text-slate-700" />
            </button>
            <nav className="mt-12 flex flex-col gap-8 items-center">
              {/* CHANGE 2: Atualizado para usar item.href e item.text */}
              {navItems.map((item) => (
                <a
                  key={item.text}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-slate-900 font-bold text-lg hover:text-indigo-600 transition-colors"
                >
                  {item.text}
                </a>
              ))}
            </nav>
            
            <div className="mt-auto space-y-3 flex flex-col items-center">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/sign-in");
                }}
                className="w-full px-4 py-2 rounded-lg bg-white text-indigo-500 font-medium hover:bg-indigo-100 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>
              
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/sign-up");
                }}
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Conta</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/track");
                }}
                className="w-full px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 flex items-center justify-center gap-2"
              >
                <PackageSearch className="w-4 h-4" />
                <span>Acompanhar pedido</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}