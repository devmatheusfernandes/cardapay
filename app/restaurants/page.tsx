"use client";

import { useState, useMemo } from "react";
import { useAllRestaurants } from "@/lib/hooks/useAllRestaurants";
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import Loading from "@/app/components/shared/Loading";
import { motion } from "framer-motion";
import { MapPin, Store, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function RestaurantsPage() {
  const { restaurants, isLoading, error } = useAllRestaurants();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter restaurants based on search term
  const filteredRestaurants = useMemo(() => {
    if (!searchTerm.trim()) return restaurants;

    return restaurants.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [restaurants, searchTerm]);

  if (isLoading) {
    return (
      <SectionContainer>
        <Loading />
      </SectionContainer>
    );
  }

  if (error) {
    return (
      <SectionContainer>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Erro ao carregar restaurantes
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Restaurantes"
          subtitle={
            searchTerm
              ? `${filteredRestaurants.length} de ${restaurants.length} restaurantes encontrados`
              : `${restaurants.length} restaurantes cadastrados na plataforma`
          }
        />

        {/* Search Bar */}
        <div className="mt-8 mb-6">
          <SubContainer variant="white" className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar restaurantes por nome, endereço ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">
                {filteredRestaurants.length} restaurante
                {filteredRestaurants.length !== 1 ? "s" : ""} encontrado
                {filteredRestaurants.length !== 1 ? "s" : ""}
              </p>
            )}
          </SubContainer>
        </div>

        {filteredRestaurants.length === 0 ? (
          <SubContainer variant="white" className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">
              {searchTerm ? "🔍" : "🍽️"}
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm
                ? "Nenhum restaurante encontrado"
                : "Nenhum restaurante encontrado"}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? `Nenhum restaurante encontrado para "${searchTerm}". Tente uma busca diferente.`
                : "Ainda não há restaurantes cadastrados na plataforma."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Limpar busca
              </button>
            )}
          </SubContainer>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <SubContainer variant="white" className="p-6 h-full">
                  <Link href={`/${restaurant.slug || restaurant.id}`}>
                    <div className="text-center">
                      {/* Logo */}
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {restaurant.logoUrl ? (
                          <Image
                            src={restaurant.logoUrl}
                            alt={`Logo do ${restaurant.name}`}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to store icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        <Store
                          className={`w-12 h-12 text-gray-400 ${
                            restaurant.logoUrl ? "hidden" : ""
                          }`}
                        />
                      </div>

                      {/* Restaurant Name */}
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                        {restaurant.name}
                      </h3>

                      {/* Address */}
                      {restaurant.address && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{restaurant.address}</span>
                        </div>
                      )}

                      {/* Description */}
                      {restaurant.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {restaurant.description}
                        </p>
                      )}

                      {/* View Menu Button */}
                      <div className="mt-4">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors">
                          Ver cardápio
                          <svg
                            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </SubContainer>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
