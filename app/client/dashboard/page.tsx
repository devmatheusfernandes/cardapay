"use client";

import { useState, useEffect } from "react";
import { useClientFavorites } from "@/lib/hooks/useClientFavorites";
import { useClientOrders } from "@/lib/hooks/useClientOrders";
import { useClientProfile } from "@/lib/hooks/useClientProfile";
import { safeTimestampToDate } from "@/lib/utils/timestamp";
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
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Edit,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import RatingStars from "@/app/components/restaurantSlug/RatingStars";

type TabType = "favorites" | "orders" | "profile";

export default function ClientDashboardPage() {
  const [user] = useAuthState(auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    defaultAddress: "",
    phone: "",
  });
  const router = useRouter();

  const {
    favorites,
    isLoading: favoritesLoading,
    removeFromFavorites,
    getTotalFavorites,
  } = useClientFavorites();

  const { orders, isLoading: ordersLoading } = useClientOrders();
  const { profile: clientProfile, updateProfile } = useClientProfile();

  // Update form when profile changes
  useEffect(() => {
    if (clientProfile) {
      setProfileForm({
        name: clientProfile.name || "",
        defaultAddress: clientProfile.defaultAddress || "",
        phone: clientProfile.phone || "",
      });
    }
  }, [clientProfile]);

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

  const handleProfileSave = async () => {
    try {
      const success = await updateProfile({
        name: profileForm.name,
        defaultAddress: profileForm.defaultAddress,
        phone: profileForm.phone,
      });

      if (success) {
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleProfileCancel = () => {
    setProfileForm({
      name: clientProfile?.name || "",
      defaultAddress: clientProfile?.defaultAddress || "",
      phone: clientProfile?.phone || "",
    });
    setIsEditingProfile(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "Confirmed":
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "Ready for Pickup":
      case "Ready for Delivery":
        return <Package className="w-4 h-4 text-purple-500" />;
      case "Out for Delivery":
        return <Truck className="w-4 h-4 text-orange-500" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Canceled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return "Pendente";
      case "Confirmed":
        return "Confirmado";
      case "In Progress":
        return "Em Preparo";
      case "Ready for Pickup":
        return "Pronto para Retirada";
      case "Ready for Delivery":
        return "Pronto para Entrega";
      case "Out for Delivery":
        return "Saiu para Entrega";
      case "Completed":
        return "Concluído";
      case "Canceled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const isLoading = favoritesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br bg-emerald-50">
        {/* Header */}
        <header className="bg-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Meu Dashboard
                  </h1>
                  <p className="text-sm text-gray-600">
                    Gerencie seus favoritos e acompanhe seus pedidos
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-rose-100 rounded-lg hover:bg-rose-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex space-x-1 bg-emerald-100 p-1 rounded-lg mb-8">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "favorites"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-emerald-600"
              }`}
            >
              <Heart className="w-4 h-4" />
              Favoritos ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "orders"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-emerald-600"
              }`}
            >
              <Package className="w-4 h-4" />
              Meus Pedidos ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-emerald-600"
              }`}
            >
              <User className="w-4 h-4" />
              Perfil
            </button>
          </div>

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <>
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div className="relative w-full mx-auto">
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
                      className="bg-emerald-100 rounded-xl shadow-sm overflow-hidden group"
                    >
                      <Link href={`/${restaurant.slug || restaurant.id}`}>
                        <div className="p-6">
                          {/* Restaurant Logo */}
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-emerald-200 flex items-center justify-center">
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
                              {restaurant.favoritedAt.toLocaleDateString(
                                "pt-BR"
                              )}
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
            </>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Nenhum pedido ainda
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Faça seu primeiro pedido para acompanhá-lo aqui!
                  </p>
                  <Link
                    href="/restaurants"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Store className="w-5 h-5" />
                    Fazer Pedido
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Pedido #{order.id.slice(-8).toUpperCase()}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {safeTimestampToDate(
                                order.createdAt
                              ).toLocaleDateString("pt-BR")}{" "}
                              às{" "}
                              {safeTimestampToDate(
                                order.createdAt
                              ).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            R$ {order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.isDelivery ? "Entrega" : "Retirada"}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Status: {getStatusText(order.status)}
                        </p>
                        {order.deliveryAddress && (
                          <p className="text-sm text-gray-600">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {order.deliveryAddress}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-600">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.confirmationCode && (
                        <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                          <p className="text-sm text-emerald-700">
                            <strong>Código de confirmação:</strong>{" "}
                            {order.confirmationCode}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Link
                          href={`/track/${order.id}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Acompanhar Pedido
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Informações do Perfil
                  </h2>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleProfileSave}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Salvar
                      </button>
                      <button
                        onClick={handleProfileCancel}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="Seu nome completo"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {clientProfile?.name || "Não informado"}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <p className="text-gray-900">
                      {clientProfile?.email || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      O email não pode ser alterado
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="(11) 99999-9999"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {clientProfile?.phone || "Não informado"}
                      </p>
                    )}
                  </div>

                  {/* Default Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço Padrão para Entrega
                    </label>
                    {isEditingProfile ? (
                      <textarea
                        value={profileForm.defaultAddress}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            defaultAddress: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        rows={3}
                        placeholder="Digite seu endereço completo para entregas..."
                      />
                    ) : (
                      <div>
                        {clientProfile?.defaultAddress ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-900">
                              {clientProfile.defaultAddress}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">
                            Nenhum endereço padrão configurado
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Este endereço será usado como opção padrão ao fazer
                      pedidos para entrega
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
