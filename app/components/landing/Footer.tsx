import { FC, JSX } from "react";
import { motion } from "framer-motion";
import { Utensils, MapPin, Smartphone, Clock } from "lucide-react";

// Tipagem para itens de contato
interface ContactItem {
  icon: JSX.Element;
  text: string;
}

// Tipagem para redes sociais
interface SocialItem {
  label: string;
  href: string;
}

interface UteisIcon {
  label: string;
  href: string;
}

const Footer: FC = () => {
  const contactItems: ContactItem[] = [
    {
      icon: <MapPin className="w-5 h-5" />,
      text: "Rua Exemplo, 123, Cidade, Estado",
    },
    { icon: <Smartphone className="w-5 h-5" />, text: "(XX) XXXX-XXXX" },
    { icon: <Clock className="w-5 h-5" />, text: "Seg-Sex: 9h-18h" },
  ];

  const socialItems: SocialItem[] = [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
  ];

  const uteisItems: UteisIcon[] = [
    { label: "Sou entregador", href: "/driver-login" },
    { label: "Sou garçom", href: "/waiter-login" },
    { label: "Acompanhar meu pedido", href: "/track" },
    { label: "Ver restaurantes", href: "/restaurants" },
  ];

  return (
    <footer id="contact" className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo e descrição */}
        <div className="col-span-full md:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-4"
          >
            <Utensils className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold">Cardapay</span>
          </motion.div>
          <p className="text-slate-400">
            A solução completa para digitalizar seu restaurante e impulsionar
            suas vendas.
          </p>
        </div>

        {/* Contato */}
        <div>
          <h4 className="text-xl font-semibold text-emerald-600 mb-4">
            Contato
          </h4>
          <ul className="space-y-2">
            {contactItems.map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-slate-400"
              >
                {item.icon}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Redes Sociais */}
        <div>
          <h4 className="text-xl font-semibold text-emerald-600 mb-4">
            Redes Sociais
          </h4>
          <div className="flex space-x-4 flex-col">
            {socialItems.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="text-slate-400 hover:text-white"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xl font-semibold text-emerald-600 mb-4">Utéis</h4>
          <div className="flex space-x-4 flex-col">
            {uteisItems.map((uteis, index) => (
              <a
                key={index}
                href={uteis.href}
                className="text-slate-400 hover:text-white"
              >
                {uteis.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center text-slate-500 mt-8 border-t border-slate-700 pt-8">
        © {new Date().getFullYear()} Cardapay. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default Footer;
