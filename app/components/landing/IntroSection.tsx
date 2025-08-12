import { motion, useAnimation, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Stat {
  number: string;
  label: string;
}

interface IntroSectionProps {
  stats: Stat[];
}

export default function IntroSection({ stats }: IntroSectionProps) {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const router = useRouter();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <section
      id="about"
      className="bg-slate-50 flex items-center justify-center overflow-hidden pt-0 md:pt-16"
    >
      {/* Hero Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-6xl font-bold text-slate-900 mb-6"
        >
          <p className="flex flex-row gap-2 justify-center">
            Revolução <span className="block text-emerald-600">Digital</span>
          </p>
          para Restaurantes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-xl text-slate-600 max-w-2xl mx-auto mb-8"
        >
          Transforme seu restaurante com cardápios digitais inteligentes,
          pagamentos integrados, use no seu restaurante com sua equipe e receba
          relatórios que impulsionam suas vendas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.push("/#pricing")}
            className="px-8 py-4 rounded-xl bg-emerald-600 text-white font-semibold text-lg shadow-lg hover:bg-emerald-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Começar Gratuitamente
          </button>
          <button
            onClick={() => router.push("/demo")}
            className="px-8 py-4 rounded-xl border-2 border-emerald-600 text-emerald-600 hover:text-white font-semibold text-lg hover:bg-emerald-600 transition-all duration-300"
          >
            Ver Demonstração
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                delayChildren: 0.9,
                staggerChildren: 0.2,
              },
            },
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                },
              }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-emerald-600 h-12 flex items-center justify-center">
                <SmartNumberDisplay value={stat.number} />
              </div>
              <div className="text-slate-600 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const SmartNumberDisplay = ({ value }: { value: string }) => {
  const [displayValue, setDisplayValue] = useState("0");
  const controls = useAnimation();

  useEffect(() => {
    // Check if the value contains non-numeric characters that shouldn't be animated
    const hasNonNumeric = /[^0-9]/.test(value);

    if (hasNonNumeric) {
      // Handle special cases
      if (value === "24/7") {
        // No animation for this case
        setDisplayValue(value);
      } else {
        // Extract numeric part and suffix
        const match = value.match(/(\d+)(\D+)/);
        if (match) {
          const [, numStr, suffix] = match;
          const number = parseInt(numStr, 10);
          const duration = Math.min(2000, number * 10); // Cap duration at 2 seconds

          let current = 0;
          const increment = Math.max(1, Math.floor(number / (duration / 16))); // 60fps

          const timer = setInterval(() => {
            current += increment;
            if (current >= number) {
              current = number;
              clearInterval(timer);
            }
            setDisplayValue(`${current}${suffix}`);
          }, 16);

          return () => clearInterval(timer);
        } else {
          // Fallback for other non-numeric formats
          setDisplayValue(value);
        }
      }
    } else {
      // Regular number animation
      const number = parseInt(value, 10);
      const duration = Math.min(2000, number * 10); // Cap duration at 2 seconds

      let current = 0;
      const increment = Math.max(1, Math.floor(number / (duration / 16))); // 60fps

      const timer = setInterval(() => {
        current += increment;
        if (current >= number) {
          current = number;
          clearInterval(timer);
        }
        setDisplayValue(current.toString());
      }, 16);

      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <motion.span
      animate={controls}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {displayValue}
    </motion.span>
  );
};
