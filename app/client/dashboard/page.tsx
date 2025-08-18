"use client";

import { useState, useEffect } from "react";
import { useClientFavorites } from "@/lib/hooks/useClientFavorites";
import { useClientOrders } from "@/lib/hooks/useClientOrders";
import { useClientProfile } from "@/lib/hooks/useClientProfile";
import { safeTimestampToDate } from "@/lib/utils/timestamp";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut, sendEmailVerification } from "firebase/auth";
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
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Home,
  ShoppingBag,
  Settings,
  Bell,
  TrendingUp,
  Users,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import RatingStars from "@/app/components/restaurantSlug/RatingStars";

type TabType = "overview" | "favorites" | "orders" | "profile";

// Email Verification Status Component
const EmailVerificationStatus = ({ isVerified }: { isVerified: boolean }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;

    setIsSending(true);
    setMessage("");

    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("E-mail de verificação reenviado!");
      toast.success("E-mail de verificação enviado com sucesso!");

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao reenviar e-mail:", error);
      setMessage("Falha ao reenviar. Tente novamente.");
      toast.error("Erro ao reenviar e-mail de verificação");

      // Clear error message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsSending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
        <ShieldCheck className="w-4 h-4" />
        <span className="font-medium">E-mail Verificado</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
        <ShieldAlert className="w-4 h-4" />
        <span className="font-medium">E-mail Não Verificado</span>
      </div>
      <button
        onClick={handleResendEmail}
        disabled={isSending}
        className="text-xs text-amber-700 hover:text-amber-800 disabled:opacity-50 transition-colors underline"
      >
        {isSending ? "Enviando..." : "Reenviar e-mail"}
      </button>
      {message && (
        <p className="text-xs text-amber-600 mt-1 sm:mt-0">{message}</p>
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
          {title}
        </p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
          {value}
        </p>
        {trend && (
          <p className="text-xs text-emerald-600 mt-1 truncate">{trend}</p>
        )}
      </div>
      <div
        className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${color} flex-shrink-0 ml-2`}
      >
        <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

export default function ClientDashboardPage() {
  const [user] = useAuthState(auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
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

  // Refresh user verification status when component mounts
  useEffect(() => {
    if (user && !user.emailVerified) {
      // Refresh user data to get latest verification status
      const refreshUser = async () => {
        try {
          await user.reload();
        } catch (error) {
          console.error("Error refreshing user:", error);
        }
      };

      // Refresh every 30 seconds for unverified users
      const interval = setInterval(refreshUser, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  // Show success message when email gets verified
  useEffect(() => {
    if (user?.emailVerified) {
      toast.success("🎉 E-mail verificado com sucesso!", {
        duration: 5000,
        position: "top-center",
      });
    }
  }, [user?.emailVerified]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Modern Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Home className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    Bem-vindo,{" "}
                    {clientProfile?.name || user?.email?.split("@")[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:block">{user?.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:block">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
          {/* Mobile Email Verification Banner */}
          {!user?.emailVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sm:hidden mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-amber-800 mb-2">
                    Verifique seu e-mail
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Para sua segurança, verifique seu endereço de e-mail.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (auth.currentUser) {
                          sendEmailVerification(auth.currentUser)
                            .then(() => {
                              toast.success("E-mail de verificação enviado!");
                            })
                            .catch((error) => {
                              console.error("Erro ao enviar e-mail:", error);
                              toast.error(
                                "Erro ao enviar e-mail de verificação"
                              );
                            });
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors shadow-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Reenviar E-mail
                    </button>
                    <button
                      onClick={async () => {
                        if (auth.currentUser) {
                          try {
                            await auth.currentUser.reload();
                            toast.success("Status de verificação atualizado!");
                          } catch (error) {
                            console.error("Erro ao atualizar status:", error);
                            toast.error("Erro ao atualizar status");
                          }
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Já Verifiquei
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Email Verification Banner */}
          {!user?.emailVerified && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="hidden sm:block mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">
                    Verifique seu e-mail
                  </h3>
                  <p className="text-amber-700 mb-4">
                    Para sua segurança, verifique seu endereço de e-mail.
                    Verifique sua caixa de entrada e clique no link de
                    verificação.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        if (auth.currentUser) {
                          sendEmailVerification(auth.currentUser)
                            .then(() => {
                              toast.success("E-mail de verificação enviado!");
                            })
                            .catch((error) => {
                              console.error("Erro ao enviar e-mail:", error);
                              toast.error(
                                "Erro ao enviar e-mail de verificação"
                              );
                            });
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-amber-800 bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors shadow-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Reenviar E-mail
                    </button>
                    <button
                      onClick={async () => {
                        if (auth.currentUser) {
                          try {
                            await auth.currentUser.reload();
                            toast.success("Status de verificação atualizado!");
                          } catch (error) {
                            console.error("Erro ao atualizar status:", error);
                            toast.error("Erro ao atualizar status");
                          }
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-amber-700 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Já Verifiquei
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex justify-center space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Home className="w-4 h-4" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "favorites"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Heart className="w-4 h-4" />
              Favoritos
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {favorites.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "orders"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Pedidos
              <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "profile"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Settings className="w-4 h-4" />
              Perfil
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
                <StatsCard
                  title="Total de Favoritos"
                  value={favorites.length}
                  icon={Heart}
                  color="bg-gradient-to-br from-pink-500 to-rose-500"
                  trend="+2 este mês"
                />
                <StatsCard
                  title="Pedidos Realizados"
                  value={orders.length}
                  icon={ShoppingBag}
                  color="bg-gradient-to-br from-blue-500 to-indigo-500"
                  trend="+5 este mês"
                />
                <StatsCard
                  title="Pedidos Pendentes"
                  value={
                    orders.filter((order) => order.status === "Pending").length
                  }
                  icon={Clock}
                  color="bg-gradient-to-br from-amber-500 to-orange-500"
                />
                <StatsCard
                  title="Total Gasto"
                  value={`R$ ${orders
                    .reduce((total, order) => total + order.totalAmount, 0)
                    .toFixed(2)}`}
                  icon={CreditCard}
                  color="bg-gradient-to-br from-emerald-500 to-teal-500"
                  trend="+12% este mês"
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 gap-6 lg:gap-8">
                {/* Recent Favorites */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Favoritos Recentes
                    </h3>
                    <button
                      onClick={() => setActiveTab("favorites")}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todos
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {favorites.slice(0, 3).map((restaurant, index) => (
                      <motion.div
                        key={restaurant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {restaurant.logoUrl ? (
                            <Image
                              src={restaurant.logoUrl}
                              alt={`Logo do ${restaurant.name}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                            {restaurant.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {restaurant.address}
                          </p>
                        </div>
                        <Link
                          href={`/${restaurant.slug || restaurant.id}`}
                          className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Pedidos Recentes
                    </h3>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todos
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {orders.slice(0, 3).map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                            Pedido #{order.id.slice(-8).toUpperCase()}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {getStatusText(order.status)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            R$ {order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {safeTimestampToDate(
                              order.createdAt
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
                <div className="relative w-full max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar nos seus favoritos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                  />
                </div>
              </motion.div>

              {/* Favorites List */}
              {filteredFavorites.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center py-16"
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    {searchTerm ? (
                      <Search className="w-16 h-16 text-gray-400" />
                    ) : (
                      <Heart className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                    {searchTerm
                      ? "Nenhum favorito encontrado"
                      : "Nenhum favorito ainda"}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    {searchTerm
                      ? `Nenhum restaurante encontrado para "${searchTerm}" nos seus favoritos.`
                      : "Comece a favoritar restaurantes para vê-los aqui!"}
                  </p>
                  {!searchTerm && (
                    <Link
                      href="/restaurants"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1"
                    >
                      <Store className="w-5 h-5" />
                      Explorar Restaurantes
                    </Link>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredFavorites.map((restaurant, index) => (
                    <motion.div
                      key={restaurant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300"
                    >
                      <Link href={`/${restaurant.slug || restaurant.id}`}>
                        <div className="p-4 sm:p-6">
                          {/* Restaurant Logo */}
                          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            {restaurant.logoUrl ? (
                              <Image
                                src={restaurant.logoUrl}
                                alt={`Logo do ${restaurant.name}`}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Store className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                            )}
                          </div>

                          {/* Restaurant Name */}
                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 text-center group-hover:text-blue-600 transition-colors">
                            {restaurant.name}
                          </h3>

                          {/* Rating */}
                          {restaurant.rating && (
                            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                              <RatingStars
                                rating={restaurant.rating.average}
                                size="sm"
                                showNumber={false}
                              />
                              <span className="text-xs sm:text-sm text-gray-500">
                                ({restaurant.rating.count})
                              </span>
                            </div>
                          )}

                          {/* Address */}
                          {restaurant.address && (
                            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate text-center">
                                {restaurant.address}
                              </span>
                            </div>
                          )}

                          {/* Description */}
                          {restaurant.description && (
                            <p className="text-xs sm:text-sm text-gray-600 text-center line-clamp-2 mb-3 sm:mb-4">
                              {restaurant.description}
                            </p>
                          )}

                          {/* Favorited Date */}
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-3 sm:mb-4">
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
                            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                              Ver cardápio
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Remove from Favorites Button */}
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <button
                          onClick={() =>
                            handleRemoveFavorite(restaurant.id, restaurant.name)
                          }
                          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-200"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">
                            Remover dos Favoritos
                          </span>
                          <span className="sm:hidden">Remover</span>
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
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                    Nenhum pedido ainda
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Faça seu primeiro pedido para acompanhá-lo aqui!
                  </p>
                  <Link
                    href="/restaurants"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1"
                  >
                    <Store className="w-5 h-5" />
                    Fazer Pedido
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                            {getStatusIcon(order.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                              Pedido #{order.id.slice(-8).toUpperCase()}
                            </h4>
                            <p className="text-sm sm:text-base text-gray-500">
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
                        <div className="text-left sm:text-right">
                          <p className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                            R$ {order.totalAmount.toFixed(2)}
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm text-gray-600">
                            {order.isDelivery ? "Entrega" : "Retirada"}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-gray-700">
                            Status:
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        {order.deliveryAddress && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="break-words">
                              {order.deliveryAddress}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                        <h5 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">
                          Itens do Pedido
                        </h5>
                        <div className="space-y-2">
                          {order.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="flex items-center justify-between text-xs sm:text-sm"
                            >
                              <span className="text-gray-700 flex-1 mr-2">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-medium text-gray-900 text-right">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.confirmationCode && (
                        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <p className="text-xs sm:text-sm text-emerald-700">
                            <strong>Código de confirmação:</strong>{" "}
                            <span className="font-mono bg-emerald-100 px-2 py-1 rounded text-xs">
                              {order.confirmationCode}
                            </span>
                          </p>
                        </div>
                      )}

                      <div className="pt-3 sm:pt-4 border-t border-gray-200">
                        <Link
                          href={`/track/${order.id}`}
                          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Acompanhar Pedido
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
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
              className="w-ful mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      Informações do Perfil
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500">
                      Gerencie suas informações pessoais e preferências
                    </p>
                  </div>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleProfileSave}
                        className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
                      >
                        <Save className="w-4 h-4" />
                        Salvar
                      </button>
                      <button
                        onClick={handleProfileCancel}
                        className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Nome Completo
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                        placeholder="Seu nome completo"
                      />
                    ) : (
                      <p className="text-base sm:text-lg text-gray-900 py-2 sm:py-3">
                        {clientProfile?.name || "Não informado"}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Endereço de E-mail
                    </label>
                    <div className="space-y-3">
                      <p className="text-base sm:text-lg text-gray-900 py-2 sm:py-3">
                        {clientProfile?.email || user?.email}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {user?.emailVerified ? (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600 bg-emerald-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-medium">
                              E-mail Verificado
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-700 bg-amber-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-amber-200">
                            <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-medium">
                              E-mail Não Verificado
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        O e-mail não pode ser alterado
                      </p>
                      {!user?.emailVerified && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <p className="text-xs sm:text-sm text-amber-800 mb-3">
                            <strong>Verificação necessária:</strong> Para sua
                            segurança, verifique seu endereço de e-mail.
                          </p>
                          <button
                            onClick={() => {
                              if (auth.currentUser) {
                                sendEmailVerification(auth.currentUser)
                                  .then(() => {
                                    toast.success(
                                      "E-mail de verificação enviado!"
                                    );
                                  })
                                  .catch((error) => {
                                    console.error(
                                      "Erro ao enviar e-mail:",
                                      error
                                    );
                                    toast.error(
                                      "E-mail de verificação não pôde ser enviado"
                                    );
                                  });
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-amber-800 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors w-full sm:w-auto justify-center"
                          >
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">
                              Reenviar E-mail de Verificação
                            </span>
                            <span className="sm:hidden">Reenviar E-mail</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                      Número de Telefone
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                        placeholder="(11) 99999-9999"
                      />
                    ) : (
                      <p className="text-base sm:text-lg text-gray-900 py-2 sm:py-3">
                        {clientProfile?.phone || "Não informado"}
                      </p>
                    )}
                  </div>

                  {/* Default Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-sm sm:text-base"
                        rows={4}
                        placeholder="Digite seu endereço completo para entregas..."
                      />
                    ) : (
                      <div>
                        {clientProfile?.defaultAddress ? (
                          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-base sm:text-lg text-gray-900 break-words">
                              {clientProfile.defaultAddress}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic py-2 sm:py-3 text-sm sm:text-base">
                            Nenhum endereço padrão configurado
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      Este endereço será usado como opção padrão ao fazer
                      pedidos para entrega
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 sm:hidden">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                activeTab === "overview"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-medium">Visão</span>
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                activeTab === "favorites"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs font-medium">Favoritos</span>
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {favorites.length > 99 ? "99+" : favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                activeTab === "orders"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-medium">Pedidos</span>
              {orders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {orders.length > 99 ? "99+" : orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                activeTab === "profile"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
