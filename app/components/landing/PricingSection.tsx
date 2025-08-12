import { motion } from "framer-motion";
import { Star, Check, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  intervalCount: number;
  description: string;
  features: string[];
  savings?: string;
  recommended?: boolean;
}

interface PricingSectionProps {
  plans: Plan[];
}

export default function PricingSection({ plans }: PricingSectionProps) {
  const router = useRouter();
  const handleSelectPlan = (planId: string, isTrial: boolean) => {
    // Redireciona para a página de cadastro com os parâmetros na URL
    router.push(`/sign-up?plan=${planId}&trial=${isTrial}`);
  };

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-emerald-600 mb-4">
            Planos Flexíveis para o seu Negócio
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Escolha o plano que melhor se adapta às necessidades do seu
            restaurante e comece a transformar suas vendas hoje mesmo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 ">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-slate-50 p-8 pt-18 pb-14 rounded-xl shadow-md border-2 flex flex-col ${
                plan.recommended
                  ? "border-emerald-600 transform scale-105"
                  : "border-transparent"
              }
                  hover:shadow-xl transition-all duration-300 relative`}
            >
              {plan.recommended && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1">
                  <Star className="w-4 h-4" /> Mais Popular
                </span>
              )}
              <h3 className="text-3xl font-bold text-slate-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-slate-600 mb-4">{plan.description}</p>
              <div className="text-5xl font-bold text-emerald-600 mb-4">
                R${" "}
                {plan.price.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="text-xl text-slate-500">
                  /{plan.interval === "month" ? "mês" : "ano"}
                </span>
              </div>
              {plan.savings && (
                <p className="text-green-600 font-regular text-center mb-4">
                  {plan.savings}
                </p>
              )}
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-slate-700">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan.id, false)}
                className={`w-full py-3 rounded-lg font-semibold text-lg ${
                  plan.recommended
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                } transition-colors duration-300`}
              >
                {plan.recommended ? "Assinar Agora" : "Escolher Plano"}
              </button>
              <button
                onClick={() => handleSelectPlan(plan.id, true)}
                className="w-full py-2 text-emerald-600 opacity-65 font-regular hover:text-emerald-800 duration-300 ease-linear transition-all"
              >
                Testar grátis por 7 dias
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
