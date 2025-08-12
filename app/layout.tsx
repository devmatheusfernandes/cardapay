import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// Fonte Poppins
const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Metadados
export const metadata: Metadata = {
  title: "Cardapay | Cardápio Digital, Pedidos e Pagamentos para Restaurantes",
  description:
    "O Cardapay é a plataforma SaaS que permite aos restaurantes criar e gerenciar cardápios digitais, receber pedidos e pagamentos online de forma simples e rápida.",
  keywords: [
    "cardápio digital",
    "gestão de restaurante",
    "pedidos online",
    "pagamento digital",
    "SaaS para restaurantes",
    "Cardapay",
  ],
  authors: [{ name: "Cardapay" }],
  openGraph: {
    title:
      "Cardapay | Cardápio Digital, Pedidos e Pagamentos para Restaurantes",
    description:
      "Crie seu cardápio digital, receba pedidos e pagamentos online com o Cardapay. Simples, rápido e integrado.",
    url: "https://cardapay.com",
    siteName: "Cardapay",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cardapay | Cardápio Digital, Pedidos e Pagamentos",
    description:
      "A solução completa para cardápios digitais, pedidos e pagamentos online para restaurantes.",
    creator: "@cardapay",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.variable} font-sans antialiased bg-slate-50 text-slate-900`}
      >
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#1e1e1e",
              fontSize: "0.95rem",
              padding: "12px 16px",
              borderRadius: "0.5rem",
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)",
            },
            success: {
              iconTheme: {
                primary: "#14b8a6", // teal-500
                secondary: "#fff",
              },
              style: {
                border: "1px solid #14b8a6",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444", // red-500
                secondary: "#fff",
              },
              style: {
                border: "1px solid #EF4444",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
