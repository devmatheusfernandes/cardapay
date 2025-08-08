"use client";

import { useState, useEffect, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Utensils, Menu, ChevronLeft } from "lucide-react";

// Components
import MobileMenu from "./components/landing/MobileMenu";
import Header from "./components/landing/Header";
import HeroSection from "./components/landing/HeroSection";
import IntroSection from "./components/landing/IntroSection";
import FeaturesSection from "./components/landing/FeaturesSection";
import PricingSection from "./components/landing/PricingSection";
import FaqSection from "./components/landing/FaqSection";
import Footer from "./components/landing/Footer";

const plans = [
  {
    id: "monthly",
    name: "Plano Mensal",
    price: 59.90,
    interval: "month",
    intervalCount: 1,
    description: "Pagamento mensal recorrente por 1 ano",
    features: [
      "Código QR personalizado",
      "Pedidos online integrados",
      "Pagamentos via Stripe",
      "Relatórios de vendas",
      "Suporte prioritário",
    ],
  },
  {
    id: "semiannual",
    name: "Plano Semestral",
    price: 49.90,
    interval: "month",
    intervalCount: 6,
    description: "Pagamento semestral (6 meses) por 1 ano",
    savings: "Economize R$ 60,00 em relação ao mensal",
    features: [
      "Tudo do Plano Mensal",
      "Economia de 16%",
      "Cobrado a cada 6 meses",
    ],
    recommended: true,
  },
  {
    id: "annual",
    name: "Plano Anual",
    price: 540.0,
    interval: "year",
    intervalCount: 1,
    description: "Pagamento único anual",
    savings: "Economize R$ 178,80 em relação ao mensal",
    features: [
      "Tudo do Plano Mensal",
      "Economia de 25%",
      "Pagamento único por ano",
    ],
  },
];

const stats = [
  { number: "500+", label: "Restaurantes Ativos" },
  { number: "50k+", label: "Pedidos Mensais" },
  { number: "98%", label: "Satisfação dos Clientes" },
  { number: "24/7", label: "Suporte Técnico" },
];

const faqs = [
  {
    question: "Como funciona o período de teste gratuito?",
    answer:
      "O período de teste de 14 dias dá acesso completo a todos os recursos da plataforma. Não é necessário cartão de crédito para iniciar o teste e você pode cancelar a qualquer momento.",
  },
  {
    question: "Quais métodos de pagamento são aceitos?",
    answer:
      "Aceitamos todos os principais cartões de crédito, PIX e boleto bancário. As transações são processadas com segurança pelo Stripe, nosso parceiro de pagamentos.",
  },
  {
    question: "Posso migrar meu cardápio atual para a plataforma?",
    answer:
      "Sim, nossa equipe oferece suporte gratuito para migração de dados. Basta nos enviar seu cardápio atual em qualquer formato (PDF, Excel, etc.) e cuidaremos do resto.",
  },
  {
    question: "A plataforma funciona offline?",
    answer:
      "Nosso aplicativo mobile permite que garçons continuem registrando pedidos mesmo sem conexão com a internet. Os dados são sincronizados automaticamente quando a conexão é restabelecida.",
  },
  {
    question: "Como funciona o suporte técnico?",
    answer:
      "Oferecemos suporte 24/7 via chat, email e telefone. Nossos tempos médios de resposta são de 15 minutos para prioridade máxima e 2 horas para questões padrão.",
  },
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index: SetStateAction<null>) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

const navItems = [
  { text: "Sobre Nós", href: "#about" },
  { text: "Recursos", href: "#features" },
  { text: "Preços", href: "#pricing" },
  { text: "FAQ", href: "#faq" },
  { text: "Contato", href: "#contact" },
];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
    hover: {
      scale: 1.05,
      color: "#d97706",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(217, 119, 6, 0.4)",
      transition: { duration: 0.1 },
    },
    tap: { scale: 0.98 },
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MobileMenu
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <Header
        setIsMenuOpen={setIsMenuOpen}
        navItems={navItems}
        containerVariants={containerVariants}
        itemVariants={itemVariants}
        buttonVariants={buttonVariants}
      />
      <HeroSection scrollY={scrollY} />
      <IntroSection stats={stats} />
      <FeaturesSection />
      <PricingSection plans={plans} />
      <FaqSection faqs={faqs} activeFaq={activeFaq} toggleFaq={toggleFaq} />
      <Footer />

      <div className="block md:hidden">
        <AnimatePresence>
          {scrollY > 400 && (
            <motion.button
              onClick={() => setIsMenuOpen(true)}
              className="fixed bottom-4 right-5 z-50 bg-indigo-600 text-white p-4 rounded-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              aria-label="Abrir menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


