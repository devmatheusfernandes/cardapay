// components/landing/Header.tsx

import { motion, Variants } from "framer-motion";
import { Utensils, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavItem {
  text: string;
  href: string;
}

interface HeaderProps {
  setIsMenuOpen: (isOpen: boolean) => void;
  navItems: NavItem[];
  containerVariants: Variants;
}

export default function Header({
  setIsMenuOpen,
  navItems,
  containerVariants,
}: HeaderProps) {
  const router = useRouter();
  return (
    <header className={`absolute top-0 left-0 w-full z-50`}>
      <div className="max-w-[95vw] mx-auto px-0 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo with animation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 5, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <Utensils className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <span className="text-2xl font-bold text-white">Cardapay</span>
          </motion.div>

          {/* Navigation with modern animations */}
          <motion.nav
            className="hidden md:flex items-center gap-14"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {navItems.map((item) => (
              <div key={item.href} className="relative group">
                <a
                  href={item.href}
                  className="text-white hover:text-emerald-600 font-medium tracking-wide text-[17px] transition-colors duration-300 ease-in-out"
                >
                  {item.text}
                </a>
              </div>
            ))}
          </motion.nav>

          {/* Buttons with animations */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => router.push("/sign-in")}
              className="relative text-white hover:text-emerald-600 cursor-pointer 
             ease-in-out duration-300 transition-all font-medium px-4 py-2 rounded-lg
             after:content-[''] after:absolute after:bottom-0 after:left-1/2 
             after:w-0 after:h-0.5 after:bg-emerald-600 after:transition-all 
             after:duration-300 after:ease-in-out after:-translate-x-1/2
             hover:after:w-full"
            >
              Entrar
            </button>

            <button
              className="text-white bg-emerald-600 hover:bg-emerald-400 cursor-pointer 
              ease-in-out duration-300 transition-all font-medium px-4 py-2.5 rounded-lg"
              onClick={() => router.push("/sign-up")}
            >
              Criar Conta
            </button>
          </div>

          {/* Mobile menu button */}
          <motion.button
            className="md:hidden"
            onClick={() => setIsMenuOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-8 h-8 text-white" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
