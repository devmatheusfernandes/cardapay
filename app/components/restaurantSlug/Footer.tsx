"use client";

import { MapPin, Clock, Store, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  schedule?: string;
}

interface RestaurantFooterProps {
  restaurant: Restaurant;
}

export function RestaurantFooter({ restaurant }: RestaurantFooterProps) {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* UPDATE: This container now handles the mobile/desktop separators */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 divide-y lg:divide-y-0 divide-gray-800">
          {/* Left Side - Restaurant Info */}
          <div className="space-y-6 pb-12 lg:pb-0">
            <div className="flex items-center space-x-4">
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={`${restaurant.name} logo`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 flex items-center justify-center">
                  <Store className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{restaurant.name}</h3>
                <p className="text-gray-400">Restaurante</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {restaurant.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Endereço
                    </p>
                    <p className="text-white leading-relaxed">
                      {restaurant.address}
                    </p>
                  </div>
                </div>
              )}

              {restaurant.schedule && (
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Horário de Funcionamento
                    </p>
                    <p className="text-white leading-relaxed">
                      {restaurant.schedule}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - CTA with Vertical Separator */}
          <div className="pt-12 lg:pt-0 lg:border-l lg:border-gray-800 lg:pl-12 px-6 md:px-2">
            <h4 className="text-2xl font-bold mb-4">
              Quer criar seu restaurante?
            </h4>
            <p className="text-white/90 mb-6 leading-relaxed">
              Junte-se a centenas de restaurantes que já estão vendendo online.
              É fácil, rápido e sem complicações!
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-white text-emerald-600 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 {restaurant.name}. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-6">
              <Link
                href="/termos"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacidade"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/contato"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Contato
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
