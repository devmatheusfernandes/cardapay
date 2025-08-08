import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export default function MobileMenu({
  isMenuOpen,
  setIsMenuOpen,
}: MobileMenuProps) {
  const navItems = ["Recursos", "Preços", "FAQ", "Sobre", "Contato"];
  const router = useRouter();

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50 p-6"
        >
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-4 right-4"
          >
            <X className="w-6 h-6 text-slate-700" />
          </button>
          <nav className="mt-12 flex flex-col gap-4">
            {navItems.map((item, idx) => (
              <a
                key={idx}
                href={`#${item.toLowerCase()}`}
                className="text-slate-900 hover:text-indigo-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                router.push("/sign-in")
              }}
              className="w-full text-left text-slate-900 hover:text-indigo-600"
            >
              Entrar
            </button>
            <button onClick={() => router.push("/sign-up")} className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700">
              Criar Conta
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


