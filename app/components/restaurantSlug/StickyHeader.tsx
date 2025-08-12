import { Utensils } from "lucide-react";
import { CartIcon } from "./CartIcon";
import { Restaurant } from "@/app/[restaurantSlug]/MenuClientPage";

interface StickyHeaderProps {
  restaurant: Restaurant;
  isScrolled: boolean;
  itemCount: number;
  onCartClick: () => void;
}

export function StickyHeader({
  restaurant,
  isScrolled,
  itemCount,
  onCartClick,
}: StickyHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={`${restaurant.name} logo`}
                className={`transition-all duration-300 ${
                  isScrolled ? "w-10 h-10" : "w-12 h-12"
                } rounded-full object-cover border-2 border-white shadow-md`}
              />
            ) : (
              <div
                className={`transition-all duration-300 ${
                  isScrolled ? "w-10 h-10" : "w-12 h-12"
                } rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 flex items-center justify-center shadow-md`}
              >
                <Utensils className="w-5 h-5 text-white" />
              </div>
            )}
            <h1
              className={`font-bold transition-all duration-300 ${
                isScrolled ? "text-lg text-gray-800" : "text-xl text-white"
              }`}
            >
              {restaurant.name}
            </h1>
          </div>

          <CartIcon
            onCartClick={onCartClick}
            itemCount={itemCount}
            isScrolled={isScrolled}
          />
        </div>
      </div>
    </header>
  );
}
