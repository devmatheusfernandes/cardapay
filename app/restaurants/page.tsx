"use client";

import { useState, useMemo } from "react";
import { useAllRestaurants } from "@/lib/hooks/useAllRestaurants";
import { useRestaurantRatings } from "@/lib/hooks/useRestaurantRatings";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  SectionContainer,
  SubContainer,
} from "@/app/components/shared/Container";
import PageHeader from "@/app/components/shared/PageHeader";
import Loading from "@/app/components/shared/Loading";
import { motion } from "framer-motion";
import { MapPin, Store, Search, Star, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import RatingStars from "@/app/components/restaurantSlug/RatingStars";

export default function RestaurantsPage() {
  const { restaurants, isLoading, error } = useAllRestaurants();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "favorites">("name");
  const [user] = useAuthState(auth);

  // Get restaurant IDs for the hook
  const restaurantIds = useMemo(
    () => restaurants.map((r) => r.id),
    [restaurants]
  );

  // Use the custom hook for ratings and favorites
  const {
    ratings: restaurantRatings,
    favorites: restaurantFavorites,
    isLoading: isLoadingRatings,
    toggleFavorite,
    getTotalRatings,
    getTotalFavorites,
  } = useRestaurantRatings(restaurantIds);

  // Handle favorite toggle with toast notifications
  const handleToggleFavorite = async (restaurantId: string) => {
    try {
      await toggleFavorite(restaurantId);
      toast.success("Favoritos atualizados!");
    } catch (error) {
      if (error instanceof Error && error.message.includes("logged in")) {
        toast.error("Faça login para favoritar restaurantes");
      } else {
        toast.error("Erro ao atualizar favoritos");
      }
    }
  };

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = restaurants.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          restaurant.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          const ratingA = restaurantRatings[a.id]?.average || 0;
          const ratingB = restaurantRatings[b.id]?.average || 0;
          return ratingB - ratingA;
        case "favorites":
          const favoritesA = restaurantFavorites[a.id]?.count || 0;
          const favoritesB = restaurantFavorites[b.id]?.count || 0;
          return favoritesB - favoritesA;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [restaurants, searchTerm, sortBy, restaurantRatings, restaurantFavorites]);

  if (isLoading) {
    return (
      <SectionContainer>
        <Loading />
      </SectionContainer>
    );
  }

  // Only show ratings loading if we actually have restaurants
  if (restaurants.length > 0 && isLoadingRatings) {
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

  // Handle case when no restaurants exist
  if (restaurants.length === 0) {
    return (
      <>
        <Toaster position="top-right" />
        <SectionContainer>
          <div className="max-w-7xl mx-auto">
            <PageHeader
              title="Restaurantes"
              subtitle="Nenhum restaurante cadastrado na plataforma"
            />

            <div className="mt-8 text-center">
              <SubContainer variant="white" className="p-12">
                <div className="text-gray-400 text-8xl mb-6">🍽️</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                  Nenhum restaurante encontrado
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Ainda não há restaurantes cadastrados na plataforma. Seja o
                  primeiro a se cadastrar e começar a usar o CardaPay!
                </p>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Store className="w-5 h-5" />
                  Cadastrar Restaurante
                </Link>
              </SubContainer>
            </div>
          </div>
        </SectionContainer>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <SectionContainer>
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Restaurantes"
            subtitle={
              searchTerm
                ? `${filteredRestaurants.length} de ${restaurants.length} restaurantes encontrados`
                : `${restaurants.length} restaurantes cadadastrados na plataforma`
            }
          />

          {/* Stats Summary */}
          {!searchTerm && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <SubContainer variant="white" className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {restaurants.length}
                </div>
                <div className="text-sm text-gray-600">Restaurantes</div>
              </SubContainer>
              <SubContainer variant="white" className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {getTotalRatings()}
                </div>
                <div className="text-sm text-gray-600">Avaliações</div>
              </SubContainer>
              <SubContainer variant="white" className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {getTotalFavorites()}
                </div>
                <div className="text-sm text-gray-600">Favoritos</div>
              </SubContainer>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mt-8 mb-6">
            <SubContainer variant="white" className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar restaurantes por nome, endereço ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Sort Options */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy("name")}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${
                      sortBy === "name"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : "text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Nome
                  </button>
                  <button
                    onClick={() => setSortBy("rating")}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${
                      sortBy === "rating"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : "text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    Melhor Avaliados
                  </button>
                  <button
                    onClick={() => setSortBy("favorites")}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${
                      sortBy === "favorites"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : "text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Mais Favoritados
                  </button>
                </div>

                {/* Filter Options */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const hasRatings = filteredRestaurants.filter(
                        (r) => restaurantRatings[r.id]
                      );
                      if (hasRatings.length > 0) {
                        // This would need to be implemented with a filter state
                        toast.success(
                          `${hasRatings.length} restaurantes com avaliações encontrados`
                        );
                      } else {
                        toast.success(
                          "Nenhum restaurante com avaliações encontrado"
                        );
                      }
                    }}
                    className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Com Avaliações
                  </button>
                </div>
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

                        {/* Rating and Favorites */}
                        <div className="flex items-center justify-center gap-4 mb-3">
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            {restaurantRatings[restaurant.id] ? (
                              <>
                                <RatingStars
                                  rating={
                                    restaurantRatings[restaurant.id].average
                                  }
                                  size="sm"
                                  showNumber={false}
                                />
                                <span className="text-xs text-gray-500">
                                  ({restaurantRatings[restaurant.id].count})
                                </span>
                              </>
                            ) : (
                              <>
                                <Star className="w-4 h-4 text-gray-300" />
                                <span className="text-xs text-gray-400">
                                  Sem avaliações
                                </span>
                              </>
                            )}
                          </div>

                          {/* Favorites */}
                          <div className="flex items-center gap-1">
                            {user ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleToggleFavorite(restaurant.id);
                                  }}
                                  className={`p-1 rounded-full transition-colors ${
                                    restaurantFavorites[restaurant.id]
                                      ?.isFavorited
                                      ? "text-red-500 hover:text-red-600"
                                      : "text-gray-400 hover:text-red-500"
                                  }`}
                                >
                                  <Heart
                                    className={`w-4 h-4 ${
                                      restaurantFavorites[restaurant.id]
                                        ?.isFavorited
                                        ? "fill-current"
                                        : ""
                                    }`}
                                  />
                                </button>
                                {restaurantFavorites[restaurant.id]?.count >
                                  0 && (
                                  <span className="text-xs text-gray-500">
                                    {restaurantFavorites[restaurant.id].count}
                                  </span>
                                )}
                              </>
                            ) : (
                              <Link
                                href="/client-login"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                title="Faça login para favoritar"
                              >
                                <Heart className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Address */}
                        {restaurant.address && (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">
                              {restaurant.address}
                            </span>
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
    </>
  );
}
