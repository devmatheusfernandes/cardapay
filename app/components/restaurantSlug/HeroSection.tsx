import { Restaurant } from "@/app/[restaurantSlug]/MenuClientPage";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  restaurant: Restaurant;
  heroRef: any;
  isScrolled: boolean;
}

export function HeroSection({
  restaurant,
  heroRef,
  isScrolled,
}: HeroSectionProps) {
  return (
    <div
      ref={heroRef}
      className="relative h-screen max-h-[100vh] w-full overflow-hidden bg-gray-900"
    >
      {restaurant.logoUrl ? (
        <motion.img
          src={restaurant.logoUrl}
          alt={restaurant.name}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          initial={{ scale: 1 }}
          animate={{ scale: isScrolled ? 1.1 : 1 }}
          transition={{ duration: 0.5 }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-purple-900" />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {restaurant.name}
        </motion.h1>

        <motion.button
          onClick={() =>
            window.scrollTo({
              top: heroRef.current?.offsetHeight,
              behavior: "smooth",
            })
          }
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-15"
        >
          <ArrowDown className="w-10 h-10" />
        </motion.button>
      </div>
    </div>
  );
}
