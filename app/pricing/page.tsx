"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Básico",
      price: "R$ 49/mês",
      features: [
        "Cardápio digital ilimitado",
        "Pedidos ilimitados",
        "Suporte por email",
      ],
    },
    {
      name: "Pro",
      price: "R$ 99/mês",
      features: [
        "Tudo do Básico",
        "Relatórios avançados",
        "Integração com pagamentos",
        "Suporte prioritário",
      ],
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      features: [
        "Tudo do Pro",
        "Funcionalidades personalizadas",
        "Gerente de conta dedicado",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-20 px-6">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-emerald-600"
        >
          Planos e Preços
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-slate-600"
        >
          Escolha o plano que melhor se adapta ao seu restaurante.
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow hover:shadow-lg transition flex flex-col"
          >
            <h3 className="text-2xl font-bold text-emerald-600">{plan.name}</h3>
            <p className="mt-4 text-3xl font-bold">{plan.price}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-slate-600"
                >
                  <Check className="w-5 h-5 text-emerald-600" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="mt-8 px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 transition text-center"
            >
              Começar Agora
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
