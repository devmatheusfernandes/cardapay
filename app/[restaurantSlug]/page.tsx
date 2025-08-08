import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { CartProvider } from "@/lib/context/CartContext";
import MenuClientPage from "./MenuClientPage";

// Define the types for our data
interface Restaurant {
    id: string;
    name: string;
    logoUrl?: string;
    address?: string;
}

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    inStock: boolean;
}

// This function fetches the data on the server
async function getRestaurantData(slug: string) {
    const restaurantQuery = await adminDb.collection('restaurants').where('slug', '==', slug).limit(1).get();

    if (restaurantQuery.empty) {
        return null;
    }

    const restaurantDoc = restaurantQuery.docs[0];
    const restaurant: Restaurant = { id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant;

    const menuItemsQuery = await adminDb.collection('menuItems')
        .where('ownerId', '==', restaurant.id)
        .where('inStock', '==', true)
        .get();

    const menuItems: MenuItem[] = [];
    menuItemsQuery.forEach(doc => {
        menuItems.push({ id: doc.id, ...doc.data() } as MenuItem);
    });

    return { restaurant, menuItems };
}

// Define a type for the component's props for clarity
interface RestaurantMenuPageProps {
    params: {
        restaurantSlug: string;
    };
}

// The Page component itself remains a Server Component
export default async function RestaurantMenuPage({ params: { restaurantSlug } }: RestaurantMenuPageProps) {
    const data = await getRestaurantData(restaurantSlug);

    if (!data) {
        notFound();
    }

    const { restaurant, menuItems } = data;

    // The CartProvider wraps the client component, providing it with cart state.
    return (
        <CartProvider>
            <MenuClientPage restaurant={restaurant} menuItems={menuItems} />
        </CartProvider>
    );
}
