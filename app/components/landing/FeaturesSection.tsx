import { motion } from "framer-motion";
import {
  Utensils,
  CreditCard,
  BarChart3,
  Smartphone,
  Users,
  TrendingUp,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";

//Images
import Feature01 from "@/public/images/landing/features/OnlineMenu.jpg";
import Feature02 from "@/public/images/landing/features/SafePayment.jpg";
import Feature03 from "@/public/images/landing/features/ActivityReport.jpg";

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  features: string[];
  image: StaticImageData;
}

export default function FeaturesSection() {
  const features: FeatureItem[] = [
    {
      icon: Utensils,
      title: "Cardápio Digital Inteligente",
      desc: "Atualize seu cardápio em tempo real, com fotos, descrições e preços que se ajustam automaticamente.",
      features: [
        "Upload de imagens HD",
        "Categorização automática",
        "Controle de estoque",
      ],
      image: Feature01,
    },
    {
      icon: CreditCard,
      title: "Pagamentos Seguros",
      desc: "Integração completa com os principais meios de pagamento do Brasil.",
      features: [
        "PIX instantâneo",
        "Cartões de crédito/débito",
        "Parcelamento flexível",
      ],
      image: Feature02,
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      desc: "Relatórios detalhados que ajudam você a tomar decisões estratégicas.",
      features: [
        "Dashboard em tempo real",
        "Análise de vendas",
        "Produtos mais vendidos",
      ],
      image: Feature03,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [features.length, isAutoPlaying]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div id="features" className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Mobile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 block lg:hidden"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-600 mb-4">
            Tudo que seu restaurante precisa
          </h2>
          <p className="text-sm md:text-lg text-slate-600">
            Recursos poderosos desenvolvidos especialmente para o setor
            alimentício
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-0 items-center">
          {/* Left Panel - Text Content */}
          <div className="lg:w-2/5 w-full relative bg-white p-6 md:p-8 min-h-[400px] md:min-h-[600px] flex flex-col rounded-t-2xl lg:rounded-bl-2xl lg:rounded-tl-2xl lg:rounded-tr-none rounded-tr-2xl shadow-lg">
            {/* Desktop Header (hidden on mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 hidden lg:block mt-8"
            >
              <h2 className="text-3xl font-bold text-emerald-600 mb-4">
                Tudo que seu restaurante precisa
              </h2>
              <p className="text-lg text-slate-600">
                Recursos poderosos desenvolvidos especialmente para o setor
                alimentício
              </p>
            </motion.div>

            <div className="relative flex-grow">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className={`absolute inset-0 p-4 flex flex-col items-center justify-center ${
                    index === currentIndex ? "z-10" : "z-0"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: index === currentIndex ? 1 : 0 }}
                  transition={{ duration: 0.9 }}
                >
                  <feature.icon className="w-8 h-8 text-emerald-600 mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 mb-4 text-center text-xs md:text-sm">
                    {feature.desc}
                  </p>
                  <ul className="space-y-2 w-full px-2">
                    {feature.features.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center text-slate-700 text-xs md:text-sm"
                      >
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Mobile Navigation Arrows */}
            <div className="flex justify-between mt-4 lg:hidden">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition"
                aria-label="Previous feature"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                {features.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-2 h-2 rounded-full ${
                      currentIndex === idx ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                    aria-label={`Go to feature ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={nextSlide}
                className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition"
                aria-label="Next feature"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Panel - Image */}
          <div className="lg:w-3/5 w-full relative">
            <div className="relative h-[300px] md:min-h-[700px] rounded-b-2xl lg:rounded-2xl overflow-hidden shadow-lg">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: index === currentIndex ? 1 : 0 }}
                  transition={{ duration: 0.9 }}
                >
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
