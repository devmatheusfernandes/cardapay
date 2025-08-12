"use client";

import { motion } from "framer-motion";
import { QrCode, Smartphone, BarChart3, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // CHANGE 1: Import the Next.js Image component

//Images
import Demo1 from "@/public/images/demo1.jpg";
import Demo2 from "@/public/images/demo2.jpg";
import Demo3 from "@/public/images/demo3.jpg";

const BackButton = () => (
  <Link
    href="/"
    className="absolute top-4 left-4 md:top-6 md:left-6 cursor-pointer"
  >
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer flex items-center gap-1 text-slate-600 hover:text-emerald-600 transition-colors"
    >
      <ChevronLeft className="w-8 h-8" />
      <span className="text-md font-medium">Voltar</span>
    </motion.button>
  </Link>
);

const features = [
  {
    icon: QrCode,
    title: "Crie seu Cardápio Digital em Minutos",
    description:
      "Adicione seus pratos, bebidas e categorias com fotos e descrições. Nosso painel intuitivo torna o gerenciamento do seu menu uma tarefa simples e rápida.",
    image: Demo3, // CHANGE 2: Assign the image object directly
  },
  {
    icon: Smartphone,
    title: "Receba Pedidos em Tempo Real",
    description:
      "Seus clientes escaneiam o QR code, fazem o pedido e pagam diretamente pelo celular. Você recebe as novas ordens instantaneamente no seu painel, prontas para serem preparadas.",
    image: Demo2, // Assign the image object directly
  },
  {
    icon: BarChart3,
    title: "Analise e Otimize suas Vendas",
    description:
      "Acesse relatórios detalhados sobre seus pedidos, receita e itens mais vendidos. Use esses dados para entender seus clientes e tomar decisões mais inteligentes para o seu negócio.",
    image: Demo1, // Assign the image object directly
  },
];

export default function DemoPage() {
  return (
    <div className="bg-white">
      <BackButton />
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
            Como o Cardapay Funciona
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-4">
            Modernize seu restaurante em 3 passos simples.
          </p>
        </motion.div>

        <div className="space-y-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col md:flex-row items-center gap-12 ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="md:w-1/2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {feature.title}
                  </h2>
                </div>
                <p className="text-slate-600 text-lg">{feature.description}</p>
              </div>
              <div className="md:w-1/2">
                {/* CHANGE 3: Use the <Image> component */}
                <Image
                  src={feature.image}
                  alt={feature.title}
                  className="rounded-lg shadow-xl w-full h-auto"
                  placeholder="blur" // Optional: adds a nice blur-up effect
                />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-24"
        >
          <h2 className="text-3xl font-bold text-slate-800">
            Pronto para Começar?
          </h2>
          <p className="text-lg text-slate-600 mt-3">
            Escolha um plano e comece a transformar seu negócio hoje mesmo.
          </p>
          <Link
            href="/#pricing"
            className="mt-8 inline-block bg-emerald-600 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:bg-emerald-700 transition-transform transform hover:scale-105"
          >
            Ver Planos e Preços
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
