"use client";

import { useState } from "react";
import { useClientFavorites } from "@/lib/hooks/useClientFavorites";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  User,
  LogOut,
  MapPin,
  Store,
  Star,
  Search,
  Calendar,
  ArrowRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import RatingStars from "@/app/components/restaurantSlug/RatingStars";

export default function ClientDashboardPage() {
  const [user] = useAuthState(auth);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const { favorites, isLoading, removeFromFavorites, getTotalFavorites } =
    useClientFavorites();

  // Filter favorites based on search term
  const filteredFavorites = favorites.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logout realizado com sucesso!");
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const handleRemoveFavorite = async (
    restaurantId: string,
    restaurantName: string
  ) => {
    try {
      await removeFromFavorites(restaurantId);
      toast.success(`${restaurantName} removido dos favoritos`);
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Erro ao remover dos favoritos");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Meus Favoritos
                  </h1>
                  <p className="text-sm text-gray-600">
                    Gerencie seus restaurantes favoritos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {getTotalFavorites()}
              </div>
              <div className="text-sm text-gray-600">
                Restaurantes Favoritados
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {favorites.filter((fav) => fav.rating).length}
              </div>
              <div className="text-sm text-gray-600">Com Avaliações</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {favorites.length > 0
                  ? Math.round(
                      (favorites.reduce(
                        (sum, fav) => sum + (fav.rating?.average || 0),
                        0
                      ) /
                        favorites.length) *
                        10
                    ) / 10
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Avaliação Média</div>
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar nos seus favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </motion.div>

          {/* Favorites List */}
          {filteredFavorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchTerm ? (
                  <Search className="w-12 h-12 text-gray-400" />
                ) : (
                  <Heart className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm
                  ? "Nenhum favorito encontrado"
                  : "Nenhum favorito ainda"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? `Nenhum restaurante encontrado para "${searchTerm}" nos seus favoritos.`
                  : "Comece a favoritar restaurantes para vê-los aqui!"}
              </p>
              {!searchTerm && (
                <Link
                  href="/restaurants"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Store className="w-5 h-5" />
                  Explorar Restaurantes
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden group"
                >
                  <Link href={`/${restaurant.slug || restaurant.id}`}>
                    <div className="p-6">
                      {/* Restaurant Logo */}
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {restaurant.logoUrl ? (
                          <Image
                            src={restaurant.logoUrl}
                            alt={`Logo do ${restaurant.name}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-10 h-10 text-gray-400" />
                        )}
                      </div>

                      {/* Restaurant Name */}
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center group-hover:text-emerald-600 transition-colors">
                        {restaurant.name}
                      </h3>

                      {/* Rating */}
                      {restaurant.rating && (
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <RatingStars
                            rating={restaurant.rating.average}
                            size="sm"
                            showNumber={false}
                          />
                          <span className="text-xs text-gray-500">
                            ({restaurant.rating.count})
                          </span>
                        </div>
                      )}

                      {/* Address */}
                      {restaurant.address && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate text-center">
                            {restaurant.address}
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      {restaurant.description && (
                        <p className="text-sm text-gray-600 text-center line-clamp-2 mb-4">
                          {restaurant.description}
                        </p>
                      )}

                      {/* Favorited Date */}
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Favoritado{" "}
                          {restaurant.favoritedAt.toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      {/* View Menu Button */}
                      <div className="text-center">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors">
                          Ver cardápio
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Remove from Favorites Button */}
                  <div className="px-6 pb-4">
                    <button
                      onClick={() =>
                        handleRemoveFavorite(restaurant.id, restaurant.name)
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover dos Favoritos
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
