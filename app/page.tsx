'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Utensils, CreditCard, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-6 py-20 bg-gradient-to-b from-white to-slate-100">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold text-amber-600"
        >
          Cardapay
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-4 text-lg text-slate-700 max-w-xl"
        >
          A plataforma simples e poderosa para donos de restaurantes gerenciarem seus pedidos,
          pagamentos e cardápios digitais — tudo em um só lugar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 flex gap-4"
        >
          <Link
            href="/sign-up"
            className="px-6 py-3 rounded-lg bg-amber-600 text-white font-medium shadow hover:bg-amber-700 transition"
          >
            Criar Conta
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-lg border border-amber-600 text-amber-600 font-medium hover:bg-amber-50 transition"
          >
            Ver Preços
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
          {[
            {
              icon: Utensils,
              title: 'Cardápio Digital',
              desc: 'Atualize seu cardápio em tempo real, sem custos extras de impressão.',
            },
            {
              icon: CreditCard,
              title: 'Pagamentos Integrados',
              desc: 'Receba pedidos e pagamentos direto pela plataforma.',
            },
            {
              icon: BarChart3,
              title: 'Relatórios Inteligentes',
              desc: 'Acompanhe vendas, produtos mais pedidos e aumente seu faturamento.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-50 rounded-xl p-6 shadow hover:shadow-lg transition"
            >
              <f.icon className="w-10 h-10 text-amber-600 mb-4" />
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-slate-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
