import { motion, Variants } from "framer-motion";
import { Utensils, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  setIsMenuOpen: (isOpen: boolean) => void;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  navItems: string[];
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
            className="hidden md:flex items-center gap-18"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {navItems.map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                className="relative"
              >
                <a
                  href={`#${item.toLowerCase()}`}
                  className="text-white hover:text-indigo-600 font-medium tracking-wide text-[17px] transition-all duration-300 ease-in-out"
                >
                  {item}
                </a>
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-indigo-600"
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
              onClick={() => router.push('/sign-in')}
              className="text-white font-medium px-4 py-2 rounded-lg hover:text-indigo-700 cursor-pointer"
              whileHover={{
                backgroundColor: "#f3f4f6",
                boxShadow: "0px 3px 10px rgba(0,0,0,0.1)",
                transition: {
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1], // Smooth ease-in-out cubic bezier
                },
              }}
              whileTap={{
                scale: 0.97,
                transition: {
                  duration: 0.4,
                  ease: [0.25, 0.1, 0.25, 1], // Consistent easing
                },
              }}
            >
              Entrar
            </motion.button>

            <motion.button
              className="cursor-pointer px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium"
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
            <Menu className="w-6 h-6 text-slate-900" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}


