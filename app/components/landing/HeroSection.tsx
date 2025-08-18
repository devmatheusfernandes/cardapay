import { motion } from "framer-motion";
import Image from "next/image";
import { TypeAnimation } from "react-type-animation";
import Hero from "@/public/images/landing/hero2.jpg";

interface HeroSectionProps {
  scrollY: number;
}

export default function HeroSection({ scrollY }: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-14">
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <Image src={Hero} alt="Hero" fill className="object-cover" priority />
      </div>
      <div className="relative z-10 w-full mx-auto px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row gap-2 items-center justify-center text-5xl md:text-7xl font-bold text-white mb-6"
        >
          <span>Revolução</span>
          <TypeAnimation
            sequence={[
              "Digital",
              2000,
              "Gastronômica",
              2000,
              "Necessária",
              2000,
            ]}
            wrapper="span"
            cursor={true}
            repeat={Infinity}
            style={{
              display: "inline-block",
              minWidth: "300px",
              textAlign: "center",
              fontWeight: "bold",
            }}
            className="text-emerald-500"
          />
        </motion.h1>
      </div>
    </section>
  );
}
