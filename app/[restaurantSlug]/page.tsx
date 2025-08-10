// app/(public)/menu/[restaurantSlug]/page.tsx

import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { CartProvider } from "@/lib/context/CartContext";
import MenuClientPage from "./MenuClientPage";
import { Toaster } from "react-hot-toast";
// ATENÇÃO: Caminho do import corrigido para o arquivo de tipos central
import { Restaurant, MenuItem } from "@/lib/types/restaurantSlug/types";

// A lógica de busca de dados no servidor permanece a mesma
async function getRestaurantData(slug: string) {
  const restaurantQuery = await adminDb
    .collection("restaurants")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (restaurantQuery.empty) {
    return null;
  }

  const restaurantDoc = restaurantQuery.docs[0];
  const restaurant: Restaurant = {
    id: restaurantDoc.id,
    ...restaurantDoc.data(),
  } as Restaurant;

  const menuItemsQuery = await adminDb
    .collection("menuItems")
    .where("ownerId", "==", restaurant.id)
    .where("inStock", "==", true)
    .get();

  const menuItems: MenuItem[] = [];
  menuItemsQuery.forEach((doc) => {
    menuItems.push({ id: doc.id, ...doc.data() } as MenuItem);
  });

  return { restaurant, menuItems };
}

// ATENÇÃO: A interface de props foi atualizada para refletir que params é uma Promise
interface RestaurantMenuPageProps {
  params: Promise<{
    restaurantSlug: string;
  }>;
}

export default async function RestaurantMenuPage({
  params,
}: RestaurantMenuPageProps) {
  // ATENÇÃO: Correção principal - aguardamos a promise de params ser resolvida
  const resolvedParams = await params;
  const { restaurantSlug } = resolvedParams;
  
  const data = await getRestaurantData(restaurantSlug);

  if (!data) {
    notFound();
  }

  const { restaurant, menuItems } = data;

  return (
    <CartProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f8fafc",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
        }}
      />
      <MenuClientPage restaurant={restaurant} menuItems={menuItems} />
    </CartProvider>
  );
}
