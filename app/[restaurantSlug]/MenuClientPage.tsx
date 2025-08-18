// app/(public)/menu/[restaurantSlug]/MenuClientPage.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useCart, ItemToAdd, SelectedOptions } from "@/lib/context/CartContext";
import { toast } from "react-hot-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { HeroSection } from "@/app/components/restaurantSlug/HeroSection";
import { StickyHeader } from "@/app/components/restaurantSlug/StickyHeader";
import { SearchAndFilter } from "@/app/components/restaurantSlug/SearchAndFilter";
import { MenuSection } from "@/app/components/restaurantSlug/MenuSection";
import { CartSidebar } from "@/app/components/restaurantSlug/CartSidebar";
import { RestaurantFooter } from "@/app/components/restaurantSlug/Footer";
import { MenuItem, Restaurant } from "@/lib/types/restaurantSlug/types";
import { ItemOptionsModal } from "@/app/components/restaurantSlug/ItemsOptionsModal";
import {
  User,
  LogIn,
  UserPlus,
  X,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuClientPageProps {
  restaurant: Restaurant;
  menuItems: MenuItem[];
}

export default function MenuClientPage({
  restaurant,
  menuItems,
}: MenuClientPageProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [user, loading] = useAuthState(auth);

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Authentication modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authFormData, setAuthFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const { cartItems, addItem, updateQuantity, itemCount } = useCart();

  const categories = [...new Set(menuItems.map((item) => item.category))];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredItems = menuItems
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((item) => !activeCategory || item.category === activeCategory);

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(
      category.toLowerCase().replace(/\s+/g, "-")
    );
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = (item: MenuItem, options?: SelectedOptions) => {
    const hasOptions =
      (item.sizes && item.sizes.length > 0) ||
      (item.addons && item.addons.length > 0) ||
      (item.stuffedCrust && item.stuffedCrust.available);

    if (hasOptions && !options) {
      setSelectedItem(item);
      setIsOptionsModalOpen(true);
      return;
    }

    const itemToAdd: ItemToAdd = {
      productId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      imageUrl: item.imageUrl,
      options: options || {},
    };

    addItem(itemToAdd);
    toast.success(`${item.name} adicionado ao carrinho!`);
  };

  const handleAuthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    try {
      if (isLoginMode) {
        // Login
        await signInWithEmailAndPassword(
          auth,
          authFormData.email,
          authFormData.password
        );
        toast.success("Login realizado com sucesso!");
        setIsAuthModalOpen(false);
        setAuthFormData({
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
        });
      } else {
        // Signup
        if (authFormData.password !== authFormData.confirmPassword) {
          toast.error("As senhas não coincidem");
          return;
        }
        if (authFormData.password.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres");
          return;
        }
        if (!authFormData.name.trim()) {
          toast.error("O nome é obrigatório");
          return;
        }

        await createUserWithEmailAndPassword(
          auth,
          authFormData.email,
          authFormData.password
        );
        toast.success("Conta criada com sucesso!");
        setIsAuthModalOpen(false);
        setAuthFormData({
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = "Erro na autenticação. Tente novamente.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha é muito fraca.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
      }

      toast.error(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const openAuthModal = (mode: "login" | "signup") => {
    setIsLoginMode(mode === "login");
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthFormData({ email: "", password: "", confirmPassword: "", name: "" });
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection
        restaurant={restaurant}
        heroRef={heroRef}
        isScrolled={isScrolled}
      />

      {/* Authentication Banner for Non-Logged Users */}
      {!loading && !user && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Faça login para acompanhar seus pedidos
                  </p>
                  <p className="text-xs text-emerald-600">
                    Acesse seu histórico de pedidos e favoritos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openAuthModal("login")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </button>
                <button
                  onClick={() => openAuthModal("signup")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Criar Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner for Logged Users */}
      {!loading && user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Bem-vindo de volta, {user.email}!
                  </p>
                  <p className="text-xs text-blue-600">
                    Acesse seu dashboard para ver seus pedidos e favoritos
                  </p>
                </div>
              </div>
              <a
                href="/client/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <User className="w-4 h-4" />
                Meu Dashboard
              </a>
            </div>
          </div>
        </div>
      )}

      <StickyHeader
        restaurant={restaurant}
        isScrolled={isScrolled}
        itemCount={itemCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 mb-8 lg:mb-0">
            <SearchAndFilter
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              scrollToCategory={scrollToCategory}
            />
          </aside>
          <div className="lg:col-span-3">
            <MenuSection
              filteredItems={filteredItems}
              categories={categories}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={updateQuantity}
            />
          </div>
        </div>
      </main>

      <RestaurantFooter restaurant={restaurant} />
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurantId={restaurant.id}
      />

      <ItemOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        item={selectedItem}
        onAddToCart={(optionsFromModal) => {
          if (selectedItem) {
            handleAddToCart(selectedItem, optionsFromModal);
          }
        }}
      />

      {/* Authentication Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={closeAuthModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      {isLoginMode ? (
                        <LogIn className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <UserPlus className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {isLoginMode ? "Entrar" : "Criar Conta"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {isLoginMode
                          ? "Acesse sua conta para acompanhar pedidos"
                          : "Crie sua conta para começar"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeAuthModal}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                  {!isLoginMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={authFormData.name}
                        onChange={handleAuthInputChange}
                        required={!isLoginMode}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={authFormData.email}
                      onChange={handleAuthInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="Digite seu email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={authFormData.password}
                        onChange={handleAuthInputChange}
                        required
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="Digite sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {!isLoginMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar senha
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={authFormData.confirmPassword}
                        onChange={handleAuthInputChange}
                        required={!isLoginMode}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="Confirme sua senha"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAuthLoading ? (
                      <>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        {isLoginMode ? "Entrando..." : "Criando conta..."}
                      </>
                    ) : (
                      <>{isLoginMode ? "Entrar" : "Criar Conta"}</>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {isLoginMode ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                      <button
                        type="button"
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        {isLoginMode ? "Crie uma conta" : "Faça login"}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Exportar o tipo aqui não é mais necessário, mas não causa erro
export type { Restaurant, MenuItem };
