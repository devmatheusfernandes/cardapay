// components/landing/Header.tsx

import { motion, Variants } from "framer-motion";
import { Utensils, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

// Define the correct type for a single navigation item
interface NavItem {
  text: string;
  href: string;
}

interface HeaderProps {
  setIsMenuOpen: (isOpen: boolean) => void;
  // Update navItems to expect an array of NavItem objects
  navItems: NavItem[];
  containerVariants: Variants;
  itemVariants: Variants;
  buttonVariants: Variants;
}

export default function Header({
  setIsMenuOpen,
  navItems,
  containerVariants,
  itemVariants,
  buttonVariants,
}: HeaderProps) {
  const router = useRouter();
  return (
    <header className={`absolute top-0 left-0 w-full z-50`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
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
              <Utensils className="w-8 h-8 text-indigo-600" />
            </motion.div>
            <span className="text-2xl font-bold text-white">Cardapay</span>
          </motion.div>

          {/* Navigation with modern animations */}
          <motion.nav
            className="hidden md:flex items-center gap-8" // Increased gap for better spacing
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {navItems.map((item) => ( // Use the object `item` now
              <motion.div
                key={item.href} // Use a unique value like href for the key
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                className="relative"
              >
                <a
                  href={item.href} // Use item.href for the link
                  className="text-white hover:text-indigo-400 font-medium tracking-wide text-[17px] transition-all duration-300 ease-in-out"
                >
                  {item.text} {/* Use item.text for the display name */}
                </a>
                <motion.div
                  className="absolute bottom-[-4px] left-0 h-0.5 bg-indigo-500" // Adjusted position
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </motion.nav>

          {/* Buttons with animations */}
          <motion.div
            className="hidden md:flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => router.push("/sign-in")}
              className="text-white font-medium px-4 py-2 rounded-lg"
              whileHover={{
                scale: 1.05,
                color: "#4f46e5", // Change text color on hover
              }}
              whileTap={{ scale: 0.95 }}
            >
              Entrar
            </motion.button>

            <motion.button
              className="cursor-pointer px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium shadow-lg"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => router.push("/sign-up")}
            >
              Criar Conta
            </motion.button>
          </motion.div>

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