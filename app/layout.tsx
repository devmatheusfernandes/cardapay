import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// Configuração da fonte Poppins com múltiplos pesos para flexibilidade
const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Adicionado pesos para regular, semibold e bold
});

// Metadados atualizados para o seu projeto
export const metadata: Metadata = {
  title: "Cardapay - Cardápio Online e Pedidos para Restaurantes",
  description: "A plataforma SaaS para restaurantes criarem e gerenciarem seus cardápios digitais, receberem pedidos e pagamentos online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {/* Adicionado o Toaster aqui para que as notificações funcionem em todo o site */}
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
